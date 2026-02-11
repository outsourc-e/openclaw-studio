import { createFileRoute } from '@tanstack/react-router'
import { createGatewayStreamConnection } from '../../server/gateway-stream'

/**
 * SSE endpoint that streams all chat events from the gateway.
 * This allows the client to receive real-time updates for:
 * - User messages from external channels (Telegram, Discord, etc.)
 * - Assistant streaming responses
 * - Tool calls and their results
 * - Session state changes
 */
export const Route = createFileRoute('/api/chat-events')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const sessionKeyParam = url.searchParams.get('sessionKey')?.trim()
        
        const encoder = new TextEncoder()
        let conn: Awaited<ReturnType<typeof createGatewayStreamConnection>> | null = null
        let streamClosed = false
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null

        const stream = new ReadableStream({
          async start(controller) {
            const sendEvent = (event: string, data: unknown) => {
              if (streamClosed) return
              try {
                const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                controller.enqueue(encoder.encode(payload))
              } catch {
                // Stream may be closed
              }
            }

            const closeStream = () => {
              if (streamClosed) return
              streamClosed = true
              
              if (heartbeatTimer) {
                clearInterval(heartbeatTimer)
                heartbeatTimer = null
              }
              
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
              
              sendEvent('connected', { 
                timestamp: Date.now(),
                sessionKey: sessionKeyParam || 'all',
              })

              // Subscribe to chat events for the session if specified
              if (sessionKeyParam) {
                try {
                  await conn.request('node.event', {
                    event: 'chat.subscribe',
                    payload: { sessionKey: sessionKeyParam },
                  })
                } catch {
                  // Subscription may not be supported, continue anyway
                }
              }

              // Listen for agent events (streaming responses)
              conn.on('agent', (payload: any) => {
                const eventSessionKey = payload?.sessionKey || payload?.context?.sessionKey
                
                // Filter by session if specified
                if (sessionKeyParam && eventSessionKey && eventSessionKey !== sessionKeyParam) {
                  return
                }

                const stream = payload?.stream
                const data = payload?.data
                const runId = payload?.runId

                if (stream === 'assistant' && data?.text) {
                  sendEvent('chunk', {
                    text: data.text,
                    runId,
                    sessionKey: eventSessionKey || sessionKeyParam || 'main',
                  })
                } else if (stream === 'thinking' && data?.text) {
                  sendEvent('thinking', {
                    text: data.text,
                    runId,
                    sessionKey: eventSessionKey || sessionKeyParam || 'main',
                  })
                } else if (stream === 'tool') {
                  sendEvent('tool', {
                    phase: data?.phase,
                    name: data?.name,
                    toolCallId: data?.toolCallId,
                    args: data?.args,
                    runId,
                    sessionKey: eventSessionKey || sessionKeyParam || 'main',
                  })
                }
              })

              // Listen for chat events (messages, state changes)
              conn.on('chat', (payload: any) => {
                const eventSessionKey = payload?.sessionKey || payload?.context?.sessionKey
                
                // Filter by session if specified
                if (sessionKeyParam && eventSessionKey && eventSessionKey !== sessionKeyParam) {
                  return
                }

                const state = payload?.state
                const targetSessionKey = eventSessionKey || sessionKeyParam || 'main'

                // Check for incoming user message from external channels
                if (payload?.message && payload.message.role === 'user') {
                  sendEvent('user_message', {
                    message: payload.message,
                    sessionKey: targetSessionKey,
                    source: payload?.source || payload?.channel || 'external',
                  })
                }

                // Check for assistant message delivery
                if (payload?.message && payload.message.role === 'assistant') {
                  sendEvent('message', {
                    message: payload.message,
                    sessionKey: targetSessionKey,
                  })
                }

                // State transitions
                if (state === 'final' || state === 'aborted' || state === 'error') {
                  sendEvent('done', {
                    state,
                    errorMessage: payload?.errorMessage,
                    runId: payload?.runId,
                    sessionKey: targetSessionKey,
                  })
                } else if (state === 'started' || state === 'thinking') {
                  sendEvent('state', {
                    state,
                    runId: payload?.runId,
                    sessionKey: targetSessionKey,
                  })
                }
              })

              // Handle other events that might contain messages
              conn.on('other', (eventName: string, payload: any) => {
                const eventSessionKey = payload?.sessionKey || payload?.context?.sessionKey
                
                // Filter by session if specified
                if (sessionKeyParam && eventSessionKey && eventSessionKey !== sessionKeyParam) {
                  return
                }

                // Look for message delivery events
                if (
                  eventName === 'message.received' ||
                  eventName === 'chat.message' ||
                  eventName === 'channel.message'
                ) {
                  const message = payload?.message || payload
                  if (message?.role === 'user') {
                    sendEvent('user_message', {
                      message,
                      sessionKey: eventSessionKey || sessionKeyParam || 'main',
                      source: payload?.source || payload?.channel || eventName,
                    })
                  } else if (message?.role === 'assistant') {
                    sendEvent('message', {
                      message,
                      sessionKey: eventSessionKey || sessionKeyParam || 'main',
                    })
                  }
                }
              })

              conn.on('close', () => {
                if (!streamClosed) {
                  sendEvent('disconnected', { reason: 'Gateway connection closed' })
                  closeStream()
                }
              })

              conn.on('error', (err: any) => {
                if (!streamClosed) {
                  sendEvent('error', {
                    message: err?.message ?? 'Gateway error',
                  })
                  // Don't close on error, try to recover
                }
              })

              // Heartbeat to keep connection alive
              heartbeatTimer = setInterval(() => {
                sendEvent('heartbeat', { timestamp: Date.now() })
              }, 30000)

            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : String(err)
              sendEvent('error', { message: errorMsg })
              closeStream()
            }
          },
          cancel() {
            streamClosed = true
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer)
              heartbeatTimer = null
            }
            conn?.close().catch(() => {})
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
          },
        })
      },
    },
  },
})
