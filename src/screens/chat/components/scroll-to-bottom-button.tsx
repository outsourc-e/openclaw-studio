import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ScrollToBottomButtonProps = {
  className?: string
  isVisible: boolean
  unreadCount: number
  onClick: () => void
}

function ScrollToBottomButton({
  className,
  isVisible,
  unreadCount,
  onClick,
}: ScrollToBottomButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      aria-label="Scroll to bottom"
      className={cn(
        'pointer-events-auto relative rounded-full shadow-md transition-all duration-200 ease-out',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
        className,
      )}
      onClick={onClick}
    >
      <HugeiconsIcon icon={ArrowDown01Icon} size={20} strokeWidth={1.5} />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary-700 px-1.5 text-xs font-medium tabular-nums text-primary-50">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Button>
  )
}

export { ScrollToBottomButton }
