import { Activity01Icon } from '@hugeicons/core-free-icons'
import { useQuery } from '@tanstack/react-query'
import { DashboardGlassCard } from './dashboard-glass-card'

type SystemInfo = {
  os: string
  nodeVersion: string
  openClawVersion: string
  uptime: string
}

type SystemInfoWidgetProps = {
  draggable?: boolean
  onRemove?: () => void
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

function readString(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : ''
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function formatUptime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(safeSeconds / 86_400)
  const hours = Math.floor((safeSeconds % 86_400) / 3_600)
  const minutes = Math.floor((safeSeconds % 3_600) / 60)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${safeSeconds}s`
}

function fallbackPlatform(): string {
  if (typeof navigator === 'undefined') return 'Unknown'
  const platform = navigator.platform.trim()
  return platform.length > 0 ? platform : 'Unknown'
}

function fallbackUptimeSeconds(): number {
  if (typeof performance === 'undefined') return 0
  return Math.floor(performance.now() / 1000)
}

function getFallbackSystemInfo(): SystemInfo {
  return {
    os: fallbackPlatform(),
    nodeVersion: 'N/A (browser runtime)',
    openClawVersion: 'Unknown',
    uptime: formatUptime(fallbackUptimeSeconds()),
  }
}

function resolveUptime(source: Record<string, unknown>, fallback: string): string {
  const uptimeLabel = readString(source.uptime)
  if (uptimeLabel.length > 0) return uptimeLabel

  const secondsFromPayload =
    readNumber(source.uptimeSeconds) ??
    readNumber(source.uptimeSec) ??
    readNumber(source.uptimeMs)

  if (secondsFromPayload === null) return fallback

  const isMilliseconds =
    source.uptimeMs !== undefined ||
    (typeof source.uptime === 'number' && secondsFromPayload > 100_000)

  const normalizedSeconds = isMilliseconds
    ? secondsFromPayload / 1000
    : secondsFromPayload

  return formatUptime(normalizedSeconds)
}

function normalizeSystemInfo(payload: unknown): SystemInfo {
  const fallback = getFallbackSystemInfo()
  const source = toRecord(payload)

  return {
    os:
      readString(source.os) ||
      readString(source.platform) ||
      readString(source.operatingSystem) ||
      fallback.os,
    nodeVersion:
      readString(source.nodeVersion) ||
      readString(source.node) ||
      fallback.nodeVersion,
    openClawVersion:
      readString(source.openClawVersion) ||
      readString(source.openclawVersion) ||
      readString(source.version) ||
      fallback.openClawVersion,
    uptime: resolveUptime(source, fallback.uptime),
  }
}

async function fetchSystemInfo(): Promise<SystemInfo> {
  const fallback = getFallbackSystemInfo()

  try {
    const response = await fetch('/api/gateway/status')
    if (!response.ok) {
      return fallback
    }

    const payload = (await response
      .json()
      .catch(function onInvalidJson() {
        return {}
      })) as unknown

    return normalizeSystemInfo(payload)
  } catch {
    return fallback
  }
}

export function SystemInfoWidget({
  draggable = false,
  onRemove,
}: SystemInfoWidgetProps) {
  const systemInfoQuery = useQuery({
    queryKey: ['dashboard', 'system-info'],
    queryFn: fetchSystemInfo,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const systemInfo = systemInfoQuery.data ?? getFallbackSystemInfo()

  return (
    <DashboardGlassCard
      title="System Info"
      description=""
      icon={Activity01Icon}
      draggable={draggable}
      onRemove={onRemove}
      className="h-full rounded-xl border-primary-200 p-4 shadow-sm [&_h2]:text-sm [&_h2]:font-medium [&_h2]:normal-case [&_h2]:text-ink [&_h2]:text-balance"
    >
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50/90 px-3 py-2">
          <span className="text-primary-600 text-pretty">OS</span>
          <span className="font-medium text-ink tabular-nums text-right">
            {systemInfo.os}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-100/60 px-3 py-2">
          <span className="text-primary-600 text-pretty">Node</span>
          <span className="font-medium text-ink tabular-nums text-right">
            {systemInfo.nodeVersion}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50/90 px-3 py-2">
          <span className="text-primary-600 text-pretty">OpenClaw</span>
          <span className="font-medium text-ink tabular-nums text-right">
            {systemInfo.openClawVersion}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-100/60 px-3 py-2">
          <span className="text-primary-600 text-pretty">Uptime</span>
          <span className="font-medium text-ink tabular-nums text-right">
            {systemInfo.uptime}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-primary-500 text-pretty">
        Uses <code>/api/gateway/status</code> when available.
      </p>
    </DashboardGlassCard>
  )
}
