import { GlobeIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type BrowserStatusResponse = {
  active: boolean
  url: string
  screenshotUrl: string
  message: string
}

type UnknownRecord = Record<string, unknown>

const PLACEHOLDER_TEXT = 'Browser available when agents browse'
const NO_SESSION_TEXT = 'No active browser session'

const FALLBACK_STATUS: BrowserStatusResponse = {
  active: false,
  url: '',
  screenshotUrl: '',
  message: PLACEHOLDER_TEXT,
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false
}

function normalizeStatusPayload(payload: unknown): BrowserStatusResponse {
  if (!isRecord(payload)) return FALLBACK_STATUS

  const active = readBoolean(payload.active)
  const url = readString(payload.url)
  const screenshotUrl = readString(payload.screenshotUrl)
  const message = readString(payload.message) || PLACEHOLDER_TEXT

  return {
    active,
    url,
    screenshotUrl,
    message,
  }
}

async function fetchBrowserStatus(): Promise<BrowserStatusResponse> {
  try {
    const response = await fetch('/api/browser/status')
    if (!response.ok) return FALLBACK_STATUS

    const payload = (await response.json()) as unknown
    return normalizeStatusPayload(payload)
  } catch {
    return FALLBACK_STATUS
  }
}

function BrowserSidebarPreview() {
  const [failedImageUrl, setFailedImageUrl] = useState('')

  const browserStatusQuery = useQuery({
    queryKey: ['browser', 'sidebar-preview', 'status'],
    queryFn: fetchBrowserStatus,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
    retry: false,
  })

  const status = browserStatusQuery.data ?? FALLBACK_STATUS
  const hasLivePreview =
    status.active &&
    Boolean(status.screenshotUrl) &&
    failedImageUrl !== status.screenshotUrl

  const urlLabel = status.active && status.url ? status.url : NO_SESSION_TEXT
  const placeholderText = status.active
    ? 'Waiting for browser screenshot'
    : PLACEHOLDER_TEXT

  return (
    <Link to="/browser" className="block">
      <div className="flex h-[200px] flex-col overflow-hidden rounded-xl border border-primary-200 bg-primary-100/45 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-100/65">
        <div className="flex items-center gap-2 border-b border-primary-200/70 bg-primary-50/80 px-2.5 py-2">
          <HugeiconsIcon
            icon={GlobeIcon}
            size={20}
            strokeWidth={1.5}
            className={cn('shrink-0', status.active ? 'text-primary-700' : 'text-primary-500')}
          />
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[11px] tabular-nums',
              status.active ? 'text-primary-700' : 'text-primary-500',
            )}
          >
            {urlLabel}
          </span>
        </div>

        <div className="relative min-h-0 flex-1 bg-primary-100/30">
          {hasLivePreview ? (
            <img
              src={status.screenshotUrl}
              alt="Browser preview screenshot"
              className="h-full w-full object-cover"
              onError={function onImageError() {
                setFailedImageUrl(status.screenshotUrl)
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <div className="flex size-10 items-center justify-center rounded-full border border-primary-200 bg-primary-50/80 text-primary-500">
                <HugeiconsIcon icon={GlobeIcon} size={20} strokeWidth={1.5} />
              </div>
              <p className="text-[11px] text-primary-600 text-pretty">
                {placeholderText}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export { BrowserSidebarPreview }
