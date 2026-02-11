import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { gatewayRpc } from '../../server/gateway'

type AbortRequestBody = {
  sessionKey?: string
}

export const Route = createFileRoute('/api/chat-abort')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as AbortRequestBody
          const sessionKey = body.sessionKey?.trim() || undefined

          await gatewayRpc('chat.abort', { sessionKey })

          return json({ ok: true })
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return json({ ok: false, error: message }, { status: 500 })
        }
      },
    },
  },
})
