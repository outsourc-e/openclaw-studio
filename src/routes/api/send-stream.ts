import { randomUUID } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { createGatewayStreamConnection } from '../../server/gateway-stream'
import { resolveSessionKey } from '../../server/session-utils'

export const Route = createFileRoute('/api/send-stream')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >

        const rawSessionKey =
          typeof body.sessionKey === 'string' ? body.sessionKey.trim() : ''
        const friendlyId =
          typeof body.friendlyId === 'string' ? body.friendlyId.trim() : ''
        const message = String(body.message ?? '')
        const thinking =
          typeof body.thinking === 'string' ? body.thinking : undefined
        const attachments = Array.isArray(body.attachments)
          ? body.attachments
          : undefined
        const idempotencyKey =
          typeof body.idempotencyKey === 'string'
            ? body.idempotencyKey
            : randomUUID()

        if (!message.trim() && (!attachments || attachments.length === 0)) {
          return new Response(
            JSON.stringify({ ok: false, error: 'message required' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        // Resolve session key
        let sessionKey: string
        try {
          const resolved = await resolveSessionKey({
            rawSessionKey,
            friendlyId,
            defaultKey: 'main',
          })
          sessionKey = resolved.sessionKey
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          if (errorMsg === 'session not found') {
            return new Response(
              JSON.stringify({ ok: false, error: 'session not found' }),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }
          return new Response(JSON.stringify({ ok: false, error: errorMsg }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Create streaming response
        const encoder = new TextEncoder()
        let conn: Awaited<ReturnType<typeof createGatewayStreamConnection>> | null = null
        let streamClosed = false

        const stream = new ReadableStream({
          async start(controller) {
            const sendEvent = (event: string, data: unknown) => {
              if (streamClosed) return
              const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
              controller.enqueue(encoder.encode(payload))
            }

            const closeStream = () => {
              if (streamClosed) return
              streamClosed = true
              try {
                controller.close()
              } catch {
                // ignore
              }
              conn?.close().catch(() => {})
            }

            try {
              // Connect to gateway
              conn = await createGatewayStreamConnection()

              // Subscribe to chat events for this session
              try {
                await conn.request('node.event', {
                  event: 'chat.subscribe',
                  payload: { sessionKey },
                })
              } catch {
                // best effort - subscription may not be supported
              }

              // Listen for events
              conn.on('agent', (payload: any) => {
                const stream = payload?.stream
                const data = payload?.data

                if (stream === 'assistant' && data?.text) {
                  sendEvent('assistant', {
                    text: data.text,
                    runId: payload?.runId,
                  })
                } else if (stream === 'tool') {
                  sendEvent('tool', {
                    phase: data?.phase,
                    name: data?.name,
                    toolCallId: data?.toolCallId,
                    args: data?.args,
                    runId: payload?.runId,
                  })
                } else if (stream === 'thinking' && data?.text) {
                  sendEvent('thinking', {
                    text: data.text,
                    runId: payload?.runId,
                  })
                }
              })

              conn.on('chat', (payload: any) => {
                const state = payload?.state
                if (state === 'final' || state === 'aborted' || state === 'error') {
                  sendEvent('done', {
                    state,
                    errorMessage: payload?.errorMessage,
                    runId: payload?.runId,
                  })
                  closeStream()
                }
              })

              conn.on('close', () => {
                if (!streamClosed) {
                  sendEvent('error', { message: 'Gateway connection closed' })
                  closeStream()
                }
              })

              conn.on('error', (err: any) => {
                if (!streamClosed) {
                  sendEvent('error', {
                    message: err?.message ?? 'Gateway error',
                  })
                  closeStream()
                }
              })

              // Send the chat message
              const sendResult = await conn.request<{ runId?: string }>(
                'chat.send',
                {
                  sessionKey,
                  message,
                  thinking,
                  attachments,
                  deliver: false,
                  timeoutMs: 120_000,
                  idempotencyKey,
                },
              )

              // Send initial event with runId
              sendEvent('started', {
                runId: sendResult.runId,
                sessionKey,
              })

              // Set a timeout to close the stream if no completion event
              setTimeout(() => {
                if (!streamClosed) {
                  sendEvent('error', { message: 'Stream timeout' })
                  closeStream()
                }
              }, 180_000) // 3 minute timeout
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : String(err)
              sendEvent('error', { message: errorMsg })
              closeStream()
            }
          },
          cancel() {
            streamClosed = true
            conn?.close().catch(() => {})
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      },
    },
  },
})
