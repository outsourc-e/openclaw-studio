/**
 * ChatPanel — collapsible right-panel chat overlay for non-chat routes.
 * Renders a full ChatScreen in a side panel so users can chat while
 * viewing dashboard, skills, gateway pages, etc.
 */
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowExpand01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'
import { motion, AnimatePresence } from 'motion/react'
import { ChatScreen } from '@/screens/chat/chat-screen'
import { moveHistoryMessages } from '@/screens/chat/chat-queries'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { Button } from '@/components/ui/button'
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ChatPanel() {
  const isOpen = useWorkspaceStore((s) => s.chatPanelOpen)
  const sessionKey = useWorkspaceStore((s) => s.chatPanelSessionKey)
  const setChatPanelOpen = useWorkspaceStore((s) => s.setChatPanelOpen)
  const setChatPanelSessionKey = useWorkspaceStore((s) => s.setChatPanelSessionKey)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [forcedSession, setForcedSession] = useState<{
    friendlyId: string
    sessionKey: string
  } | null>(null)

  const isNewChat = sessionKey === 'new'
  const activeFriendlyId = sessionKey || 'main'
  const forcedSessionKey =
    forcedSession?.friendlyId === activeFriendlyId
      ? forcedSession.sessionKey
      : undefined

  const handleSessionResolved = useCallback(
    (payload: { friendlyId: string; sessionKey: string }) => {
      moveHistoryMessages(
        queryClient,
        'new',
        'new',
        payload.friendlyId,
        payload.sessionKey,
      )
      setForcedSession({
        friendlyId: payload.friendlyId,
        sessionKey: payload.sessionKey,
      })
      setChatPanelSessionKey(payload.friendlyId)
    },
    [queryClient, setChatPanelSessionKey],
  )

  const handleExpand = useCallback(() => {
    setChatPanelOpen(false)
    navigate({
      to: '/chat/$sessionKey',
      params: { sessionKey: activeFriendlyId },
    })
  }, [activeFriendlyId, navigate, setChatPanelOpen])

  const handleClose = useCallback(() => {
    setChatPanelOpen(false)
  }, [setChatPanelOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 420, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="h-full border-l border-primary-200 bg-surface overflow-hidden flex flex-col relative"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between h-10 px-3 border-b border-primary-200 shrink-0">
            <span className="text-xs font-medium text-primary-700 truncate">
              Chat
            </span>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <TooltipRoot>
                  <TooltipTrigger
                    onClick={handleExpand}
                    render={
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-primary-600 hover:text-primary-900"
                        aria-label="Expand to full chat"
                      >
                        <HugeiconsIcon
                          icon={ArrowExpand01Icon}
                          size={14}
                          strokeWidth={1.5}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom">Full chat view</TooltipContent>
                </TooltipRoot>
              </TooltipProvider>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={handleClose}
                className="text-primary-600 hover:text-primary-900"
                aria-label="Close chat panel"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={14}
                  strokeWidth={1.5}
                />
              </Button>
            </div>
          </div>

          {/* Chat content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatScreen
              activeFriendlyId={activeFriendlyId}
              isNewChat={isNewChat}
              forcedSessionKey={forcedSessionKey}
              onSessionResolved={isNewChat ? handleSessionResolved : undefined}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
