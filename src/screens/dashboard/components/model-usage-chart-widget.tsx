import { ChartLineData02Icon } from '@hugeicons/core-free-icons'
import { useMemo } from 'react'
import { DashboardGlassCard } from './dashboard-glass-card'
import { cn } from '@/lib/utils'

type ModelUsageSample = {
  model: string
  percent: number
}

type ModelUsageChartWidgetProps = {
  draggable?: boolean
  onRemove?: () => void
}

const MODEL_USAGE_SAMPLE: Array<ModelUsageSample> = [
  { model: 'Claude Sonnet 4.5', percent: 64 },
  { model: 'GPT-5.2 Codex', percent: 52 },
  { model: 'Claude Opus 4.6', percent: 33 },
  { model: 'Gemini 2.5 Pro', percent: 21 },
]

function clampPercent(value: number): number {
  if (value < 0) return 0
  if (value > 100) return 100
  return Math.round(value)
}

function barClass(index: number): string {
  if (index % 4 === 0) return 'bg-primary-700'
  if (index % 4 === 1) return 'bg-primary-600'
  if (index % 4 === 2) return 'bg-primary-500'
  return 'bg-primary-400'
}

export function ModelUsageChartWidget({
  draggable = false,
  onRemove,
}: ModelUsageChartWidgetProps) {
  const modelUsage = useMemo(
    function normalizeUsage() {
      return MODEL_USAGE_SAMPLE.map(function mapUsage(entry) {
        return {
          ...entry,
          percent: clampPercent(entry.percent),
        }
      })
    },
    [],
  )

  return (
    <DashboardGlassCard
      title="Model Usage"
      description=""
      icon={ChartLineData02Icon}
      draggable={draggable}
      onRemove={onRemove}
      className="h-full rounded-xl border-primary-200 p-4 shadow-sm [&_h2]:text-sm [&_h2]:font-medium [&_h2]:normal-case [&_h2]:text-ink [&_h2]:text-balance"
    >
      <div className="space-y-3">
        {modelUsage.map(function renderUsage(entry, index) {
          return (
            <article key={entry.model} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-sm font-medium text-ink text-balance">
                  {entry.model}
                </p>
                <span className="text-xs font-medium text-primary-600 tabular-nums">
                  {entry.percent}%
                </span>
              </div>
              <div className="h-2 rounded-full border border-primary-200 bg-primary-100/60">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-300',
                    barClass(index),
                  )}
                  style={{ width: `${entry.percent}%` }}
                />
              </div>
            </article>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-primary-500 text-pretty">
        TODO: Replace sample values with gateway model usage API data.
      </p>
    </DashboardGlassCard>
  )
}
