import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { gatewayRpc } from '../../server/gateway'

export const Route = createFileRoute('/api/config-patch')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
          const raw = typeof body.raw === 'string' ? body.raw : ''
          const reason = typeof body.reason === 'string' ? body.reason : 'Studio provider setup'

          if (!raw.trim()) {
            return json({ ok: false, error: 'raw config patch required' }, { status: 400 })
          }

          const result = await gatewayRpc<{ ok: boolean; error?: string }>('config.patch', {
            raw,
            reason,
          })

          return json({ ...result, ok: true })
        } catch (err) {
          return json(
            { ok: false, error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          )
        }
      },
    },
  },
})
