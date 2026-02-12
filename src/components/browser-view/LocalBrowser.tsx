import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Loading03Icon,
  Refresh01Icon,
  Cancel01Icon,
  GlobeIcon,
  AiChat02Icon,
  SentIcon,
  Tick01Icon,
  ComputerTerminal01Icon,
} from '@hugeicons/core-free-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type BrowserState = {
  ok: boolean
  running: boolean
  url: string
  title: string
  screenshot: string | null
  error?: string
}

async function browserAction(action: string, params?: Record<string, unknown>): Promise<BrowserState> {
  const res = await fetch('/api/browser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
  return res.json() as Promise<BrowserState>
}

export function LocalBrowser() {
  const queryClient = useQueryClient()
  const navigateTo = useNavigate()
  const [agentPrompt, setAgentPrompt] = useState('')
  const [handingOff, setHandingOff] = useState(false)
  const [isLaunched, setIsLaunched] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  // Check if browser is already running
  useEffect(() => {
    browserAction('screenshot').then((state) => {
      if (state.running) {
        setIsLaunched(true)
        setUrlInput(state.url || '')
        queryClient.setQueryData(['local-browser', 'state'], state)
      }
    }).catch(() => {})
  }, [queryClient])

  // Poll state (for URL/title updates + sidebar preview)
  const stateQuery = useQuery<BrowserState>({
    queryKey: ['local-browser', 'state'],
    queryFn: () => browserAction('screenshot'),
    enabled: isLaunched,
    refetchInterval: 3000,
    staleTime: 2000,
  })

  const currentState = stateQuery.data
  const currentUrl = currentState?.url || ''
  const currentTitle = currentState?.title || ''

  useEffect(() => {
    if (currentUrl && currentUrl !== 'about:blank') {
      setUrlInput(currentUrl)
    }
  }, [currentUrl])

  const launchMutation = useMutation({
    mutationFn: () => browserAction('launch'),
    onSuccess: (data) => {
      setIsLaunched(true)
      queryClient.setQueryData(['local-browser', 'state'], data)
    },
  })

  const navMutation = useMutation({
    mutationFn: (url: string) => browserAction('navigate', { url }),
    onSuccess: (data) => {
      queryClient.setQueryData(['local-browser', 'state'], data)
      if (data.url) setUrlInput(data.url)
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => browserAction('close'),
    onSuccess: () => {
      setIsLaunched(false)
      queryClient.setQueryData(['local-browser', 'state'], null)
    },
  })

  const handleNavigate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!urlInput.trim()) return
      navMutation.mutate(urlInput.trim())
    },
    [urlInput, navMutation],
  )

  async function handleHandoff() {
    if (!agentPrompt.trim() && !currentUrl) return
    setHandingOff(true)

    try {
      const contentRes = await fetch('/api/browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'content' }),
      })
      const content = await contentRes.json() as { url: string; title: string; text: string }

      const instruction = agentPrompt.trim() || 'Take over this browser session and help me with this page.'
      const contextMsg = [
        `🌐 **Browser Handoff**`,
        `**URL:** ${content.url || currentUrl}`,
        `**Page:** ${content.title || currentTitle}`,
        '',
        `**Task:** ${instruction}`,
        '',
        `<page_content>`,
        (content.text || '').slice(0, 4000),
        `</page_content>`,
        '',
        `The browser is running locally via Playwright (visible window). Control it with POST /api/browser — actions: navigate, click (x,y), type (text), press (key), scroll (direction), back, forward, refresh, content, screenshot.`,
      ].join('\n')

      const sendRes = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey: '', friendlyId: 'new', message: contextMsg }),
      })
      const sendResult = await sendRes.json() as { ok?: boolean; friendlyId?: string }

      setAgentPrompt('')
      if (sendResult.friendlyId) {
        void navigateTo({ to: '/chat/$sessionKey', params: { sessionKey: sendResult.friendlyId } })
      }
    } catch {
      void navigateTo({ to: '/chat/$sessionKey', params: { sessionKey: 'new' } })
    } finally {
      setHandingOff(false)
    }
  }

  // ── Not launched ──────────────────────────────────────────────
  if (!isLaunched) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-accent-500/10">
          <HugeiconsIcon icon={GlobeIcon} size={40} strokeWidth={1.5} className="text-accent-500" />
        </div>
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-semibold text-ink">Browser</h2>
          <p className="mt-3 text-sm text-primary-500 leading-relaxed">
            Opens a real Chrome window on your machine. Browse normally — log in, navigate, interact.
            Then hand it to your AI agent to automate workflows with your session intact.
          </p>
        </div>
        <Button
          onClick={() => launchMutation.mutate()}
          disabled={launchMutation.isPending}
          size="lg"
          className="gap-2.5 px-6"
        >
          {launchMutation.isPending ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" />
              Opening Chrome...
            </>
          ) : (
            <>
              <HugeiconsIcon icon={ComputerTerminal01Icon} size={18} />
              Open Browser
            </>
          )}
        </Button>
        {launchMutation.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 max-w-md text-center">
            <p className="font-medium">Failed to launch browser</p>
            <p className="text-xs mt-1 text-red-500">{launchMutation.error?.message || 'Make sure Playwright is installed: npx playwright install chromium'}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-4 max-w-lg text-center">
          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-3">
            <p className="text-lg mb-1">🔐</p>
            <p className="text-xs font-medium text-ink">You Log In</p>
            <p className="text-[10px] text-primary-500 mt-0.5">Handle auth yourself</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-3">
            <p className="text-lg mb-1">🤖</p>
            <p className="text-xs font-medium text-ink">Agent Takes Over</p>
            <p className="text-[10px] text-primary-500 mt-0.5">Automate from there</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-3">
            <p className="text-lg mb-1">🍪</p>
            <p className="text-xs font-medium text-ink">Session Persists</p>
            <p className="text-[10px] text-primary-500 mt-0.5">Cookies stay intact</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Browser running — control panel ──────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 border-b border-primary-200 bg-primary-50/80 px-3 py-2 shrink-0">
        <button
          type="button"
          onClick={() => browserAction('back').then((d) => queryClient.setQueryData(['local-browser', 'state'], d))}
          className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-200 hover:text-primary-700 transition-colors"
          title="Back"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => browserAction('forward').then((d) => queryClient.setQueryData(['local-browser', 'state'], d))}
          className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-200 hover:text-primary-700 transition-colors"
          title="Forward"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => browserAction('refresh').then((d) => queryClient.setQueryData(['local-browser', 'state'], d))}
          className="rounded-lg p-1.5 text-primary-500 hover:bg-primary-200 hover:text-primary-700 transition-colors"
          title="Refresh"
        >
          <HugeiconsIcon icon={Refresh01Icon} size={16} strokeWidth={2} />
        </button>

        <form onSubmit={handleNavigate} className="flex-1 mx-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter URL..."
            className={cn(
              'w-full rounded-xl border border-primary-200 bg-surface px-4 py-1.5 text-sm text-ink',
              'placeholder:text-primary-400',
              'focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/30',
            )}
          />
        </form>

        <button
          type="button"
          onClick={() => closeMutation.mutate()}
          className="rounded-lg p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
          title="Close browser"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Main content — status + preview */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Status card */}
          <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-500/15">
                <HugeiconsIcon icon={Tick01Icon} size={20} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800">Browser Running</p>
                <p className="text-xs text-green-600 truncate mt-0.5">
                  {currentTitle || currentUrl || 'Chrome window is open on your desktop'}
                </p>
              </div>
              <div className="flex size-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>

          {/* Live preview thumbnail */}
          {currentState?.screenshot && (
            <div className="rounded-2xl border border-primary-200 overflow-hidden shadow-sm">
              <div className="border-b border-primary-200 bg-primary-50/80 px-3 py-2 flex items-center gap-2">
                <HugeiconsIcon icon={GlobeIcon} size={14} className="text-primary-500" />
                <span className="text-xs text-primary-500 truncate flex-1">{currentUrl}</span>
                <span className="text-[10px] text-primary-400">Live preview</span>
              </div>
              <img
                src={currentState.screenshot}
                alt="Browser preview"
                className="w-full"
              />
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navMutation.mutate('https://google.com')}
              className="rounded-xl border border-primary-200 bg-primary-50/50 p-3 text-left hover:bg-primary-100 transition-colors"
            >
              <p className="text-sm font-medium text-ink">Google</p>
              <p className="text-[10px] text-primary-500">google.com</p>
            </button>
            <button
              type="button"
              onClick={() => navMutation.mutate('https://x.com')}
              className="rounded-xl border border-primary-200 bg-primary-50/50 p-3 text-left hover:bg-primary-100 transition-colors"
            >
              <p className="text-sm font-medium text-ink">X / Twitter</p>
              <p className="text-[10px] text-primary-500">x.com</p>
            </button>
            <button
              type="button"
              onClick={() => navMutation.mutate('https://github.com')}
              className="rounded-xl border border-primary-200 bg-primary-50/50 p-3 text-left hover:bg-primary-100 transition-colors"
            >
              <p className="text-sm font-medium text-ink">GitHub</p>
              <p className="text-[10px] text-primary-500">github.com</p>
            </button>
            <button
              type="button"
              onClick={() => navMutation.mutate('https://chat.openai.com')}
              className="rounded-xl border border-primary-200 bg-primary-50/50 p-3 text-left hover:bg-primary-100 transition-colors"
            >
              <p className="text-sm font-medium text-ink">ChatGPT</p>
              <p className="text-[10px] text-primary-500">chat.openai.com</p>
            </button>
          </div>

          {/* Instructions */}
          <div className="rounded-xl border border-primary-200 bg-primary-50/30 p-4 text-center">
            <p className="text-sm text-primary-600">
              Interact with the Chrome window on your desktop. When ready, use the agent bar below to hand control to your AI.
            </p>
          </div>
        </div>
      </div>

      {/* Agent handoff bar */}
      <div className="border-t border-accent-200/50 bg-accent-50/30 px-4 py-3 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleHandoff() }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <HugeiconsIcon icon={AiChat02Icon} size={16} className="text-accent-500" />
            <span className="text-xs font-medium text-accent-600">Agent</span>
          </div>
          <input
            type="text"
            value={agentPrompt}
            onChange={(e) => setAgentPrompt(e.target.value)}
            placeholder="Tell the agent what to do on this page..."
            className="flex-1 rounded-lg border border-accent-200 bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-primary-400 focus:border-accent-500 focus:outline-none"
          />
          <Button
            type="submit"
            disabled={handingOff}
            className="gap-1.5 bg-accent-500 hover:bg-accent-400"
            size="sm"
          >
            {handingOff ? (
              <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
            ) : (
              <HugeiconsIcon icon={SentIcon} size={14} />
            )}
            Hand to Agent
          </Button>
        </form>
      </div>
    </div>
  )
}
