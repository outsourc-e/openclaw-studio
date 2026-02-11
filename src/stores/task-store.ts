/**
 * Task System Lite — Mission Control-inspired task management.
 * localStorage-backed, zero backend dependencies.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3'

export type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  project?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

export const STATUS_ORDER: TaskStatus[] = ['backlog', 'in_progress', 'review', 'done']

export const PRIORITY_ORDER: TaskPriority[] = ['P0', 'P1', 'P2', 'P3']


/** Seed data from real Mission Control tasks */
const SEED_TASKS: Task[] = [
  {
    id: 'STUDIO-001',
    title: 'Dashboard UX Lock-In',
    description: 'Enterprise alignment pass — mode selector, header cleanup, widget polish, visual hierarchy.',
    status: 'review',
    priority: 'P0',
    project: 'studio',
    tags: ['dashboard', 'ux'],
    createdAt: '2026-02-10T18:00:00Z',
    updatedAt: '2026-02-10T19:00:00Z',
  },
  {
    id: 'STUDIO-002',
    title: 'Workspace (Chat/Session) UX Parity',
    description: 'Begin chat/session UX polish to match dashboard quality. Separate phase after dashboard freeze.',
    status: 'backlog',
    priority: 'P1',
    project: 'studio',
    tags: ['workspace', 'ux'],
    createdAt: '2026-02-10T18:00:00Z',
    updatedAt: '2026-02-10T18:00:00Z',
  },
  {
    id: 'STUDIO-003',
    title: 'Fix Anthropic OAuth 403',
    description: 'Anthropic OAuth returning 403. Debug and fix auth flow.',
    status: 'backlog',
    priority: 'P1',
    project: 'studio',
    tags: ['auth', 'bug'],
    createdAt: '2026-02-10T18:00:00Z',
    updatedAt: '2026-02-10T18:00:00Z',
  },
  {
    id: 'STUDIO-004',
    title: 'Fix Minimax Cookie Issue',
    description: 'Minimax provider cookie-based auth failing. Investigate and resolve.',
    status: 'backlog',
    priority: 'P2',
    project: 'studio',
    tags: ['auth', 'bug'],
    createdAt: '2026-02-10T18:00:00Z',
    updatedAt: '2026-02-10T18:00:00Z',
  },
  {
    id: 'MYAGENCYLAB-001',
    title: 'Manager Role — Fix Broken Pages',
    description: 'MyAgencyLab manager role has broken page layouts. Audit and fix all views.',
    status: 'backlog',
    priority: 'P2',
    project: 'myagencylab',
    tags: ['bug', 'ui'],
    createdAt: '2026-02-09T01:00:00Z',
    updatedAt: '2026-02-09T01:00:00Z',
  },
  {
    id: 'MYAGENCYLAB-002',
    title: 'Dashboard Design Iterations',
    description: 'Iterate on MyAgencyLab dashboard layout and data presentation.',
    status: 'backlog',
    priority: 'P3',
    project: 'myagencylab',
    tags: ['design', 'dashboard'],
    createdAt: '2026-02-09T01:00:00Z',
    updatedAt: '2026-02-09T01:00:00Z',
  },
  {
    id: 'MYAGENCYLAB-SEC',
    title: 'Security Audit & Chatter Access Fix',
    description: 'Full security audit completed. 18 tickets (P0-P3). Chatter access controls hardened.',
    status: 'done',
    priority: 'P0',
    project: 'myagencylab',
    tags: ['security'],
    createdAt: '2026-02-07T01:00:00Z',
    updatedAt: '2026-02-08T01:00:00Z',
  },
  {
    id: 'CODEX-001',
    title: 'Codex CLI Integration',
    description: 'Codex CLI workflow integrated for free coding tasks via ChatGPT Pro.',
    status: 'done',
    priority: 'P1',
    project: 'openclaw',
    tags: ['tooling'],
    createdAt: '2026-02-05T01:00:00Z',
    updatedAt: '2026-02-06T01:00:00Z',
  },
  {
    id: 'ACC-001',
    title: 'Custom OF Scraper',
    description: 'Build custom scraper to replace OnlyFansAPI.com dependency.',
    status: 'backlog',
    priority: 'P1',
    project: 'myagencylab',
    tags: ['scraper', 'automation'],
    createdAt: '2026-02-08T01:00:00Z',
    updatedAt: '2026-02-08T01:00:00Z',
  },
  {
    id: 'STUDIO-005',
    title: 'Tag Release v2.2.0',
    description: 'Tag and release v2.2.0 after dashboard UX lock-in merge.',
    status: 'backlog',
    priority: 'P1',
    project: 'studio',
    tags: ['release'],
    createdAt: '2026-02-10T19:00:00Z',
    updatedAt: '2026-02-10T19:00:00Z',
  },
]

type TaskStore = {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  moveTask: (id: string, status: TaskStatus) => void
  deleteTask: (id: string) => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: SEED_TASKS,
      addTask: (taskData) => {
        const now = new Date().toISOString()
        const task: Task = {
          ...taskData,
          id: `TASK-${Date.now().toString(36).toUpperCase()}`,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ tasks: [task, ...state.tasks] }))
      },
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
          ),
        }))
      },
      moveTask: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t,
          ),
        }))
      },
      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
      },
    }),
    {
      name: 'clawsuite-tasks-v1',
    },
  ),
)
