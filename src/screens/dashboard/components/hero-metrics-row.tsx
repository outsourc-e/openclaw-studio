import {
  Activity01Icon,
  ChartLineData02Icon,
  Timer02Icon,
  UserGroupIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { DashboardIcon } from './dashboard-types'

type HeroMetric = {
  label: string
  value: string
  icon: DashboardIcon
  isError?: boolean
  onRetry?: () => void
}

type HeroMetricsRowProps = {
  totalSessions: number
  activeAgents: number
  uptimeSeconds: number
  totalSpend: string
  costError?: boolean
  onRetryCost?: () => void
}

function formatUptime(seconds: number): string {
  if (seconds <= 0) return '—'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function HeroMetricsRow({
  totalSessions,
  activeAgents,
  uptimeSeconds,
  totalSpend,
  costError = false,
  onRetryCost,
}: HeroMetricsRowProps) {
  const metrics: Array<HeroMetric> = [
    {
      label: 'Total Sessions',
      value: `${totalSessions}`,
      icon: Activity01Icon,
    },
    { label: 'Active Agents', value: `${activeAgents}`, icon: UserGroupIcon },
    { label: 'Uptime', value: formatUptime(uptimeSeconds), icon: Timer02Icon },
    { 
      label: 'Cost', 
      value: costError ? 'Failed to load' : totalSpend, 
      icon: ChartLineData02Icon,
      isError: costError,
      onRetry: onRetryCost,
    },
  ]

  return (
    <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="group flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3.5 shadow-sm transition-transform duration-150 hover:-translate-y-[1px]"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-100/70">
            <HugeiconsIcon
              icon={m.icon}
              size={20}
              strokeWidth={1.5}
              className="shrink-0 text-accent-600"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-2xl font-bold font-mono tabular-nums leading-none ${
              m.isError ? 'text-red-600 dark:text-red-500 text-xs' : 'text-ink'
            }`}>
              {m.value}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-primary-500">
              {m.label}
            </p>
          </div>
          {m.isError && m.onRetry ? (
            <button
              type="button"
              onClick={m.onRetry}
              className="shrink-0 inline-flex size-6 items-center justify-center rounded-md text-red-600 dark:text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-900/20"
              aria-label="Retry"
              title="Retry loading cost data"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                size={14}
                strokeWidth={1.5}
              />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
