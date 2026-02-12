import {
  Chat01Icon,
  ComputerTerminal01Icon,
  Settings01Icon,
  Task01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useNavigate } from '@tanstack/react-router'
import { DashboardGlassCard } from './dashboard-glass-card'
import type { DashboardIcon } from './dashboard-types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type QuickActionRoute = '/new' | '/terminal' | '/agents' | '/settings'

type QuickActionItem = {
  id: string
  label: string
  route: QuickActionRoute
  icon: DashboardIcon
}

type QuickActionsWidgetProps = {
  draggable?: boolean
  onRemove?: () => void
}

const QUICK_ACTIONS: Array<QuickActionItem> = [
  {
    id: 'new-chat',
    label: 'New Chat',
    route: '/new',
    icon: Chat01Icon,
  },
  {
    id: 'open-terminal',
    label: 'Open Terminal',
    route: '/terminal',
    icon: ComputerTerminal01Icon,
  },
  {
    id: 'view-agents',
    label: 'View Agents',
    route: '/agents',
    icon: UserGroupIcon,
  },
  {
    id: 'settings',
    label: 'Settings',
    route: '/settings',
    icon: Settings01Icon,
  },
]

export function QuickActionsWidget({
  draggable = false,
  onRemove,
}: QuickActionsWidgetProps) {
  const navigate = useNavigate()

  return (
    <DashboardGlassCard
      title="Quick Actions"
      description=""
      icon={Task01Icon}
      draggable={draggable}
      onRemove={onRemove}
      className="h-full rounded-xl border-primary-200 p-4 shadow-sm [&_h2]:text-sm [&_h2]:font-medium [&_h2]:normal-case [&_h2]:text-ink [&_h2]:text-balance"
    >
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map(function mapAction(action, index) {
          return (
            <Button
              key={action.id}
              variant="outline"
              className={cn(
                'h-auto min-h-18 flex-col items-start justify-start rounded-lg border border-primary-200 px-3 py-3 text-left shadow-sm transition-colors hover:border-primary-300',
                index % 2 === 0
                  ? 'bg-primary-50/90 hover:bg-primary-50'
                  : 'bg-primary-100/60 hover:bg-primary-100/75',
              )}
              onClick={function handleActionClick() {
                void navigate({ to: action.route })
              }}
              aria-label={action.label}
            >
              <HugeiconsIcon
                icon={action.icon}
                size={20}
                strokeWidth={1.5}
                className="text-primary-700"
              />
              <span className="mt-1.5 line-clamp-2 text-sm font-medium text-ink text-balance">
                {action.label}
              </span>
            </Button>
          )
        })}
      </div>
    </DashboardGlassCard>
  )
}
