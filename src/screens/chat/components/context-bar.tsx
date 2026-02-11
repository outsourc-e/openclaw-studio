'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { DialogContent, DialogRoot, DialogTrigger } from '@/components/ui/dialog'
import { UsageDetailsModal } from '@/components/usage-meter/usage-details-modal'

const CONTEXT_POLL_MS = 15_000
const PROVIDER_POLL_MS = 30_000
const SESSION_POLL_MS = 10_000

// ---------- types ----------

type ContextData = {
  contextPercent: number
  model: string
  maxTokens: number
  usedTokens: number
}

type ProviderLine = {
  label: string
  type: string
  format?: string
  used?: number
  limit?: number
}

type ProviderEntry = {
  provider: string
  displayName: string
  plan?: string
  status: string
  lines: ProviderLine[]
}

type SessionUsage = {
  inputTokens: number
  outputTokens: number
  contextPercent: number
  dailyCost: number
  models: any[]
  sessions: any[]
}

const EMPTY_CTX: ContextData = { contextPercent: 0, model: '', maxTokens: 0, usedTokens: 0 }
const EMPTY_USAGE: SessionUsage = { inputTokens: 0, outputTokens: 0, contextPercent: 0, dailyCost: 0, models: [], sessions: [] }

// ---------- helpers ----------

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function readNumber(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return 0
}

function readPercent(v: unknown): number {
  const n = readNumber(v)
  return Math.max(0, Math.min(n, 100))
}

function parseSessionStatus(payload: unknown): SessionUsage {
  const root = payload && typeof payload === 'object' ? (payload as any) : {}
  const usage = root.today ?? root.usage ?? root.summary ?? root.totals ?? root
  const tokensRoot = usage?.tokens ?? usage?.tokenUsage ?? usage
  return {
    inputTokens: readNumber(tokensRoot?.inputTokens ?? tokensRoot?.input_tokens ?? usage?.inputTokens),
    outputTokens: readNumber(tokensRoot?.outputTokens ?? tokensRoot?.output_tokens ?? usage?.outputTokens),
    contextPercent: readPercent(usage?.contextPercent ?? usage?.context_percent ?? root?.contextPercent),
    dailyCost: readNumber(usage?.costUsd ?? usage?.dailyCost ?? usage?.cost ?? root?.costUsd ?? root?.dailyCost),
    models: [],
    sessions: [],
  }
}

// ---------- component ----------

function ContextBarComponent({ compact }: { compact?: boolean }) {
  const [ctx, setCtx] = useState<ContextData>(EMPTY_CTX)
  const [providers, setProviders] = useState<ProviderEntry[]>([])
  const [sessionUsage, setSessionUsage] = useState<SessionUsage>(EMPTY_USAGE)
  const [providerUpdatedAt, setProviderUpdatedAt] = useState<number | null>(null)
  const [usageOpen, setUsageOpen] = useState(false)

  // Fetch context %
  const refreshContext = useCallback(async () => {
    try {
      const res = await fetch('/api/context-usage')
      if (!res.ok) return
      const data = await res.json()
      if (data.ok) {
        setCtx({
          contextPercent: data.contextPercent ?? 0,
          model: data.model ?? '',
          maxTokens: data.maxTokens ?? 0,
          usedTokens: data.usedTokens ?? 0,
        })
      }
    } catch { /* ignore */ }
  }, [])

  // Fetch provider usage (Claude MAX, etc.)
  const refreshProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/provider-usage')
      const data = await res.json().catch(() => null)
      if (data?.ok !== false) {
        setProviders(data?.providers ?? [])
        setProviderUpdatedAt(data?.updatedAt ?? Date.now())
      }
    } catch { /* ignore */ }
  }, [])

  // Fetch session usage (for the details modal)
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/session-status')
      if (!res.ok) return
      const data = await res.json()
      setSessionUsage(parseSessionStatus(data.payload ?? data))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    void refreshContext()
    void refreshProviders()
    void refreshSession()
    const c = window.setInterval(refreshContext, CONTEXT_POLL_MS)
    const p = window.setInterval(refreshProviders, PROVIDER_POLL_MS)
    const s = window.setInterval(refreshSession, SESSION_POLL_MS)
    return () => { window.clearInterval(c); window.clearInterval(p); window.clearInterval(s) }
  }, [refreshContext, refreshProviders, refreshSession])

  const pct = ctx.contextPercent
  const isDanger = pct >= 75
  const isWarning = pct >= 50
  const isCritical = pct >= 90

  // Bar color
  const barColor = isCritical
    ? 'bg-red-500'
    : isDanger
      ? 'bg-amber-500'
      : isWarning
        ? 'bg-amber-400'
        : 'bg-emerald-500'

  const textColor = isCritical
    ? 'text-red-600'
    : isDanger
      ? 'text-amber-600'
      : isWarning
        ? 'text-amber-600'
        : 'text-primary-500'

  // Provider pill (right side)
  const primaryProvider = providers.find(p => p.status === 'ok' && p.lines.length > 0)
  const progressLines = useMemo(() =>
    primaryProvider?.lines.filter(l => l.type === 'progress').slice(0, 3) ?? [],
    [primaryProvider],
  )

  // Provider pill color
  const providerAlertTone = useMemo(() => {
    if (!primaryProvider) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    const allProgress = primaryProvider.lines.filter(l => l.type === 'progress' && l.format === 'percent' && l.used !== undefined)
    const maxPct = allProgress.reduce((max, l) => Math.max(max, l.used ?? 0), 0)
    if (maxPct >= 75) return 'text-red-600 bg-red-50 border-red-200'
    if (maxPct >= 50) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }, [primaryProvider])

  const detailProps = useMemo(
    () => ({
      usage: sessionUsage,
      error: null as string | null,
      providerUsage: providers as any,
      providerError: null as string | null,
      providerUpdatedAt,
    }),
    [sessionUsage, providers, providerUpdatedAt],
  )

  // Don't render if no data at all
  if (pct <= 0 && !primaryProvider) return null

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1 border-b border-primary-100 bg-surface',
      compact && 'px-2',
    )}>
      {/* Context progress bar (left side) */}
      {pct > 0 && (
        <>
          <span className={cn('text-[10px] font-medium uppercase tracking-wide text-primary-400 shrink-0')}>
            Ctx
          </span>
          <div className="flex-1 h-1 rounded-full bg-primary-100 overflow-hidden min-w-0 max-w-[200px]">
            <div
              className={cn('h-full rounded-full transition-all duration-700 ease-out', barColor)}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className={cn('text-[10px] font-medium tabular-nums shrink-0', textColor)}>
            {Math.round(pct)}%
          </span>
          {!compact && ctx.maxTokens > 0 && (
            <span className="text-[10px] tabular-nums text-primary-400 shrink-0">
              {formatTokens(ctx.usedTokens)}/{formatTokens(ctx.maxTokens)}
            </span>
          )}
          {isCritical && (
            <span className={cn('text-[10px] font-medium shrink-0', textColor)}>
              Start new chat
            </span>
          )}
        </>
      )}

      {/* Spacer — subtle model name in the middle */}
      <div className="flex-1 flex justify-center">
        {ctx.model && (
          <span className="text-[10px] text-primary-300 truncate max-w-[120px]">
            {ctx.model}
          </span>
        )}
      </div>

      {/* Provider usage pill (right side) — opens details modal */}
      {primaryProvider && (
        <DialogRoot open={usageOpen} onOpenChange={setUsageOpen}>
          <DialogTrigger
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[10px] font-medium',
              'flex items-center gap-2 transition hover:opacity-80 cursor-pointer',
              providerAlertTone,
            )}
          >
            <span className="uppercase tracking-wide">
              {primaryProvider.displayName.split(' ')[0]}
            </span>
            {primaryProvider.plan && (
              <span className="uppercase text-[9px] opacity-70">{primaryProvider.plan}</span>
            )}
            {progressLines.map((line, i) => (
              <span key={`${line.label}-${i}`} className="flex items-center gap-0.5">
                <span className="uppercase tracking-wide opacity-70">
                  {line.label.replace('Session (5h)', 'Sess').replace('Weekly', 'Wk').replace('Sonnet', 'Son')}
                </span>
                <span className="tabular-nums">
                  {line.format === 'dollars' && line.used !== undefined
                    ? `$${line.used >= 1000 ? `${(line.used / 1000).toFixed(1)}k` : line.used.toFixed(0)}`
                    : line.used !== undefined ? `${Math.round(line.used)}%` : '—'}
                </span>
              </span>
            ))}
          </DialogTrigger>
          <DialogContent className="w-[min(720px,94vw)]">
            <UsageDetailsModal {...detailProps} />
          </DialogContent>
        </DialogRoot>
      )}
    </div>
  )
}

export const ContextBar = memo(ContextBarComponent)
