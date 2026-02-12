import { randomUUID } from 'node:crypto'
import EventEmitter from 'node:events'
import * as pty from 'node-pty'

export type TerminalSessionEvent = {
  event: string
  payload: unknown
}

export type TerminalSession = {
  id: string
  createdAt: number
  emitter: EventEmitter
  sendInput: (data: string) => void
  resize: (cols: number, rows: number) => void
  close: () => void
}

const sessions = new Map<string, TerminalSession>()

export function createTerminalSession(params: {
  command?: string[]
  cwd?: string
  env?: Record<string, string>
  cols?: number
  rows?: number
}): TerminalSession {
  const emitter = new EventEmitter()
  const sessionId = randomUUID()

  const shell = params.command?.[0] ?? process.env.SHELL ?? '/bin/zsh'
  const args = params.command?.slice(1) ?? []

  // Resolve ~ to home directory
  let cwd = params.cwd ?? process.env.HOME ?? '/tmp'
  if (cwd.startsWith('~')) {
    cwd = cwd.replace('~', process.env.HOME ?? '/tmp')
  }

  const ptyProcess = pty.spawn(shell, args, {
    name: 'xterm-256color',
    cols: params.cols ?? 80,
    rows: params.rows ?? 24,
    cwd,
    env: {
      ...process.env,
      ...params.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    } as Record<string, string>,
  })

  ptyProcess.onData((data: string) => {
    emitter.emit('event', {
      event: 'data',
      payload: { data },
    } as TerminalSessionEvent)
  })

  ptyProcess.onExit(({ exitCode, signal }) => {
    emitter.emit('event', {
      event: 'exit',
      payload: { exitCode, signal },
    } as TerminalSessionEvent)
    emitter.emit('close')
    sessions.delete(sessionId)
  })

  const session: TerminalSession = {
    id: sessionId,
    createdAt: Date.now(),
    emitter,

    sendInput(data: string) {
      ptyProcess.write(data)
    },

    resize(cols: number, rows: number) {
      try {
        ptyProcess.resize(cols, rows)
      } catch {
        // Process may have exited
      }
    },

    close() {
      try {
        ptyProcess.kill()
      } catch {
        // Already dead
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

export function closeTerminalSession(id: string): void {
  const session = sessions.get(id)
  if (!session) return
  session.close()
}
