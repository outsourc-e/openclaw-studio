import { memo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Folder01Icon, Menu01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { UsageMeter } from '@/components/usage-meter'
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type ChatHeaderProps = {
  activeTitle: string
  wrapperRef?: React.Ref<HTMLDivElement>
  showSidebarButton?: boolean
  onOpenSidebar?: () => void
  showFileExplorerButton?: boolean
  fileExplorerCollapsed?: boolean
  onToggleFileExplorer?: () => void
  chatMode?: 'native' | 'gateway'
  onToggleChatMode?: () => void
}

function ChatHeaderComponent({
  activeTitle,
  wrapperRef,
  showSidebarButton = false,
  onOpenSidebar,
  showFileExplorerButton = false,
  fileExplorerCollapsed = true,
  onToggleFileExplorer,
  chatMode = 'gateway',
  onToggleChatMode,
}: ChatHeaderProps) {
  return (
    <div
      ref={wrapperRef}
      className="sticky top-0 z-10 border-b border-primary-200 px-4 h-12 flex items-center bg-surface"
    >
      {showSidebarButton ? (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onOpenSidebar}
          className="mr-2 text-primary-800 hover:bg-primary-100"
          aria-label="Open sidebar"
        >
          <HugeiconsIcon icon={Menu01Icon} size={18} strokeWidth={1.6} />
        </Button>
      ) : null}
      {showFileExplorerButton ? (
        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger
              onClick={onToggleFileExplorer}
              render={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="mr-2 text-primary-800 hover:bg-primary-100"
                  aria-label={fileExplorerCollapsed ? 'Show files' : 'Hide files'}
                >
                  <HugeiconsIcon icon={Folder01Icon} size={18} strokeWidth={1.6} />
                </Button>
              }
            />
            <TooltipContent side="bottom">
              {fileExplorerCollapsed ? 'Show files' : 'Hide files'}
            </TooltipContent>
          </TooltipRoot>
        </TooltipProvider>
      ) : null}
      <div className="text-sm font-medium truncate flex-1">{activeTitle}</div>
      {onToggleChatMode ? (
        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger
              onClick={onToggleChatMode}
              render={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="mr-1 text-primary-800 hover:bg-primary-100"
                  aria-label={chatMode === 'gateway' ? 'Switch to native chat' : 'Switch to gateway chat'}
                >
                  <span className="text-[10px] font-mono">{chatMode === 'gateway' ? 'GW' : 'UI'}</span>
                </Button>
              }
            />
            <TooltipContent side="bottom">
              {chatMode === 'gateway' ? 'Using Gateway Chat (switch to native)' : 'Using Native Chat (switch to gateway)'}
            </TooltipContent>
          </TooltipRoot>
        </TooltipProvider>
      ) : null}
      <UsageMeter />
    </div>
  )
}

const MemoizedChatHeader = memo(ChatHeaderComponent)

export { MemoizedChatHeader as ChatHeader }
