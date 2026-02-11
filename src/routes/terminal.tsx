import { lazy, Suspense } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'

const TerminalWorkspace = lazy(() =>
  import('@/components/terminal/terminal-workspace').then((m) => ({
    default: m.TerminalWorkspace,
  })),
)

export const Route = createFileRoute('/terminal')({
  component: TerminalRoute,
})

function TerminalRoute() {
  usePageTitle('Terminal')
  const navigate = useNavigate()

  function handleBack() {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate({
      to: '/chat/$sessionKey',
      params: { sessionKey: 'main' },
      replace: true,
    })
  }

  return (
    <div className="h-screen bg-surface text-primary-900">
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-xs text-primary-500">Loading terminal…</div>}>
        <TerminalWorkspace mode="fullscreen" onBack={handleBack} />
      </Suspense>
    </div>
  )
}
