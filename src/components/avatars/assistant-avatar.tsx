import { memo } from 'react'
import { cn } from '@/lib/utils'

type AvatarProps = {
  size?: number
  className?: string
}

/** OpenClaw Studio logo — orange claw mark */
function AssistantAvatarComponent({ size = 28, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-orange-500 flex items-center justify-center shrink-0',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="text-white"
        style={{ width: size * 0.6, height: size * 0.6 }}
      >
        {/* Stylized claw / terminal cursor */}
        <path
          d="M6 4l6 8-6 8M13 20h6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export const AssistantAvatar = memo(AssistantAvatarComponent)
