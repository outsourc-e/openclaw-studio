'use client'

import { useState, useEffect } from 'react'
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride'
import { tourSteps } from './tour-steps'
import { useSettingsStore } from '@/hooks/use-settings'
import { useResolvedTheme } from '@/hooks/use-chat-settings'

const TOUR_STORAGE_KEY = 'clawsuite-onboarding-completed'

// Accent color mapping to hex values
const ACCENT_COLORS = {
  orange: '#f97316',
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#10b981',
}

export function OnboardingTour() {
  const [run, setRun] = useState(false)
  const accentColor = useSettingsStore((state) => state.settings.accentColor)
  const resolvedTheme = useResolvedTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    // Check if user has completed tour
    if (typeof window === 'undefined') return

    try {
      const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY)
      if (hasCompletedTour) return

      // Wait for the wizard to finish first before starting the tour
      const wizardComplete = localStorage.getItem('openclaw-onboarding-complete') === 'true'
      if (!wizardComplete) {
        // Poll until wizard completes (user might be going through it)
        const interval = setInterval(() => {
          if (localStorage.getItem('openclaw-onboarding-complete') === 'true') {
            clearInterval(interval)
            setTimeout(() => setRun(true), 500)
          }
        }, 1000)
        return () => clearInterval(interval)
      }

      // Wizard done, tour not done — start tour after brief delay
      const timer = setTimeout(() => setRun(true), 1000)
      return () => clearTimeout(timer)
    } catch {
      // ignore localStorage errors
    }
  }, [])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      } catch {
        // ignore
      }
      setRun(false)
    }
  }

  const primaryColor = ACCENT_COLORS[accentColor] || ACCENT_COLORS.orange

  const styles: Partial<Styles> = {
    options: {
      primaryColor,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      textColor: isDark ? '#f3f4f6' : '#1f2937',
      overlayColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
      arrowColor: isDark ? '#1f2937' : '#ffffff',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: 12,
      fontSize: 14,
      padding: 20,
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize: 16,
      fontWeight: 600,
      marginBottom: 8,
      color: isDark ? '#f9fafb' : '#111827',
    },
    tooltipContent: {
      padding: '8px 0',
      fontSize: 14,
      lineHeight: 1.6,
      color: isDark ? '#e5e7eb' : '#374151',
    },
    buttonNext: {
      backgroundColor: primaryColor,
      color: '#ffffff',
      borderRadius: 8,
      padding: '8px 16px',
      fontSize: 14,
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
    buttonBack: {
      color: isDark ? '#9ca3af' : '#6b7280',
      marginRight: 8,
      fontSize: 14,
    },
    buttonSkip: {
      color: isDark ? '#9ca3af' : '#9ca3af',
      fontSize: 14,
    },
    buttonClose: {
      width: 20,
      height: 20,
      padding: 0,
    },
    spotlight: {
      borderRadius: 8,
    },
  }

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={styles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next',
        skip: 'Skip tour',
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))',
          },
        },
      }}
      spotlightPadding={4}
    />
  )
}
