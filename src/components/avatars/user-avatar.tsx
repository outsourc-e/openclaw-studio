import { memo } from 'react'
import { cn } from '@/lib/utils'

type AvatarProps = {
  size?: number
  className?: string
}

/** User avatar — person silhouette on neutral background */
function UserAvatarComponent({ size = 28, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-primary-200 flex items-center justify-center shrink-0',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="text-primary-600"
        style={{ width: size * 0.6, height: size * 0.6 }}
      >
        {/* Person icon */}
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path
          d="M4 21c0-3.866 3.582-7 8-7s8 3.134 8 7"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

export const UserAvatar = memo(UserAvatarComponent)
