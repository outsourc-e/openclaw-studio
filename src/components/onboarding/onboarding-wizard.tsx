'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { useOnboardingStore } from '@/hooks/use-onboarding'
import { ONBOARDING_STEPS } from './onboarding-steps'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function OnboardingWizard() {
  const { isOpen, currentStep, totalSteps, initialize, nextStep, prevStep, goToStep, complete, skip } =
    useOnboardingStore()

  // Initialize on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isOpen) return null

  const step = ONBOARDING_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[min(520px,92vw)] overflow-hidden rounded-2xl border border-primary-200 bg-primary-50 shadow-2xl"
          >
            {/* Skip button */}
            <button
              onClick={skip}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-primary-500 transition-colors hover:bg-primary-100 hover:text-primary-700"
              aria-label="Skip onboarding"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
            </button>

            {/* Content */}
            <div className="px-8 pb-6 pt-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    className={cn(
                      'mb-6 flex size-20 items-center justify-center rounded-2xl text-white shadow-lg',
                      step.iconBg,
                    )}
                  >
                    <HugeiconsIcon icon={step.icon} className="size-10" strokeWidth={1.5} />
                  </motion.div>

                  {/* Title */}
                  <h2 className="mb-3 text-2xl font-semibold text-primary-900">{step.title}</h2>

                  {/* Description */}
                  <p className="mb-8 max-w-md text-base leading-relaxed text-primary-600">
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Step indicator dots */}
              <div className="mb-6 flex justify-center gap-2">
                {ONBOARDING_STEPS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToStep(index)}
                    className={cn(
                      'size-2.5 rounded-full transition-all duration-200',
                      index === currentStep
                        ? 'w-6 bg-orange-500'
                        : 'bg-primary-300 hover:bg-primary-400',
                    )}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={isFirstStep}
                  className={cn('gap-2', isFirstStep && 'invisible')}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                  Back
                </Button>

                <span className="text-sm text-primary-500">
                  {currentStep + 1} / {totalSteps}
                </span>

                {isLastStep ? (
                  <Button
                    variant="default"
                    onClick={complete}
                    className="gap-2 bg-orange-500 hover:bg-orange-600"
                  >
                    Get Started
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                  </Button>
                ) : (
                  <Button variant="default" onClick={nextStep} className="gap-2">
                    Next
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
