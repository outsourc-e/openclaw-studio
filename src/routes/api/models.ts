import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { gatewayRpc } from '../../server/gateway'

type ModelsListGatewayResponse = {
  models?: Array<unknown>
}

export const Route = createFileRoute('/api/models')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const payload = await gatewayRpc<ModelsListGatewayResponse>(
            'models.list',
            {},
          )
          const models = Array.isArray(payload.models) ? payload.models : []
          return json({ ok: true, models })
        } catch (err) {
          return json(
            {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            },
            { status: 503 },
          )
        }
      },
    },
  },
})
