import { Moon01Icon, Sun01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useChatSettingsStore } from '@/hooks/use-chat-settings'
import type { ThemeMode } from '@/hooks/use-chat-settings'
import { cn } from '@/lib/utils'

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  root.classList.remove('light', 'dark', 'system')
  root.classList.add(theme)
  if (theme === 'system' && media.matches) {
    root.classList.add('dark')
  }
}

function resolvedIsDark(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

type ThemeToggleProps = {
  /** "icon" = small icon button (default), "pill" = prominent pill toggle */
  variant?: 'icon' | 'pill'
}

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { settings, updateSettings } = useChatSettingsStore()
  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && resolvedIsDark())

  function toggle() {
    const next: ThemeMode = isDark ? 'light' : 'dark'
    applyTheme(next)
    updateSettings({ theme: next })
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200',
          isDark
            ? 'border-primary-600 bg-primary-800 text-primary-200 hover:bg-primary-700'
            : 'border-primary-200 bg-primary-100/80 text-primary-700 hover:bg-primary-200',
        )}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        <HugeiconsIcon
          icon={isDark ? Sun01Icon : Moon01Icon}
          size={14}
          strokeWidth={1.5}
        />
        <span>{isDark ? 'Light' : 'Dark'}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-7 items-center justify-center rounded-md text-primary-400 transition-colors hover:text-primary-700 dark:hover:text-primary-300"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <HugeiconsIcon icon={isDark ? Sun01Icon : Moon01Icon} size={16} strokeWidth={1.5} />
    </button>
  )
}
