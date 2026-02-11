import { randomUUID } from 'node:crypto'
import EventEmitter from 'node:events'

import { gatewayRpc, onGatewayEvent } from './gateway'
import type { GatewayFrame } from './gateway'

export type TerminalSessionEvent = {
  event: string
  payload: unknown
}

export type TerminalSession = {
  id: string
  execId: string | null
  createdAt: number
  emitter: EventEmitter
  sendInput: (data: string) => Promise<void>
  resize: (cols: number, rows: number) => Promise<void>
  close: () => Promise<void>
}

const sessions = new Map<string, TerminalSession>()

function pickExecId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const value = p.execId ?? p.execID ?? p.id ?? p.streamId ?? p.streamID ?? p.processId ?? p.pid
  return typeof value === 'string' ? value : null
}

export async function createTerminalSession(params: {
  command: Array<string>
  cwd?: string
  env?: Record<string, string>
  cols?: number
  rows?: number
  pty?: boolean
}): Promise<TerminalSession> {
  const emitter = new EventEmitter()
  const sessionId = randomUUID()

  // Start exec via shared gateway connection
  const execPayload = await gatewayRpc<Record<string, unknown>>('exec', {
    command: params.command,
    cwd: params.cwd,
    env: params.env,
    pty: params.pty ?? true,
    cols: params.cols,
    rows: params.rows,
    timeoutMs: 0,
  })

  const execId = pickExecId(execPayload)

  // Subscribe to gateway events for this exec session
  const unsubscribe = onGatewayEvent((frame: GatewayFrame) => {
    if (frame.type !== 'event') return

    const payload = frame.payload ?? null

    emitter.emit('event', {
      event: frame.event,
      payload: { payload },
    } as TerminalSessionEvent)
  })

  const session: TerminalSession = {
    id: sessionId,
    execId,
    createdAt: Date.now(),
    emitter,

    sendInput: async (data: string) => {
      if (!execId) return
      await gatewayRpc('exec.write', { id: execId, data }).catch(() => {})
    },

    resize: async (cols: number, rows: number) => {
      if (!execId) return
      await gatewayRpc('exec.resize', { id: execId, cols, rows }).catch(() => {})
    },

    close: async () => {
      unsubscribe()
      if (execId) {
        await gatewayRpc('exec.close', { id: execId }).catch(() => {})
      }
      sessions.delete(sessionId)
    },
  }

  sessions.set(sessionId, session)
  return session
}

export function getTerminalSession(id: string): TerminalSession | null {
  return sessions.get(id) ?? null
}

export async function closeTerminalSession(id: string): Promise<void> {
  const session = sessions.get(id)
  if (!session) return
  await session.close()
}
