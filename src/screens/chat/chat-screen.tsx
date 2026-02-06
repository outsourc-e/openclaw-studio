import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useStreamingMessage } from './hooks/use-streaming-message'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deriveFriendlyIdFromKey,
  isMissingGatewayAuth,
  readError,
  textFromMessage,
} from './utils'
import { createOptimisticMessage } from './chat-screen-utils'
import {
  chatQueryKeys,
  appendHistoryMessage,
  clearHistoryMessages,
  fetchGatewayStatus,
  removeHistoryMessageByClientId,
  updateHistoryMessageByClientId,
  updateSessionLastMessage,
} from './chat-queries'
import { chatUiQueryKey, getChatUiState, setChatUiState } from './chat-ui'
import { ChatSidebar } from './components/chat-sidebar'
import { ChatHeader } from './components/chat-header'
import { ChatMessageList } from './components/chat-message-list'
import { ChatComposer } from './components/chat-composer'
import { GatewayStatusMessage } from './components/gateway-status-message'
import {
  consumePendingSend,
  hasPendingGeneration,
  hasPendingSend,
  isRecentSession,
  resetPendingSend,
  setRecentSession,
  setPendingGeneration,
  stashPendingSend,
} from './pending-send'
import { useChatMeasurements } from './hooks/use-chat-measurements'
import { useChatHistory } from './hooks/use-chat-history'
import { useChatMobile } from './hooks/use-chat-mobile'
import { useChatSessions } from './hooks/use-chat-sessions'
import { useAutoSessionTitle } from './hooks/use-auto-session-title'
import type {
  ChatComposerAttachment,
  ChatComposerHelpers,
} from './components/chat-composer'
import type { GatewayAttachment, GatewayMessage, HistoryResponse } from './types'
import { cn } from '@/lib/utils'

type ChatScreenProps = {
  activeFriendlyId: string
  isNewChat?: boolean
  onSessionResolved?: (payload: {
    sessionKey: string
    friendlyId: string
  }) => void
  forcedSessionKey?: string
}

type ActiveStreamContext = {
  streamId: string
  sessionKey: string
  friendlyId: string
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function hasResolvedAssistantMessage(
  messages: Array<GatewayMessage>,
  context: ActiveStreamContext,
  finalText: string,
): boolean {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.role !== 'assistant') continue
    const messageId = message.__optimisticId || (message as any).id
    if (messageId === context.streamId) continue
    const text = textFromMessage(message)
    if (!text.trim()) continue
    if (finalText.trim().length > 0) {
      return text === finalText
    }
    return true
  }
  return false
}

export function ChatScreen({
  activeFriendlyId,
  isNewChat = false,
  onSessionResolved,
  forcedSessionKey,
}: ChatScreenProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sending, setSending] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { headerRef, composerRef, mainRef, pinGroupMinHeight, headerHeight } =
    useChatMeasurements()
  const [waitingForResponse, setWaitingForResponse] = useState(
    () => hasPendingSend() || hasPendingGeneration(),
  )
  const [pinToTop, setPinToTop] = useState(
    () => hasPendingSend() || hasPendingGeneration(),
  )
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  )
  const [streamingText, setStreamingText] = useState<string>('')
  const [streamingThinking, setStreamingThinking] = useState<string>('')
  const [useStreamingApi, setUseStreamingApi] = useState(true)

  const streamTimer = useRef<number | null>(null)
  const streamIdleTimer = useRef<number | null>(null)
  const lastAssistantSignature = useRef('')
  const activeStreamRef = useRef<ActiveStreamContext | null>(null)
  const refreshHistoryRef = useRef<() => void>(() => {})
  const pendingStartRef = useRef(false)
  const { isMobile } = useChatMobile(queryClient)
  const {
    sessionsQuery,
    sessions,
    activeSession,
    activeExists,
    activeSessionKey,
    activeTitle,
    sessionsError,
  } = useChatSessions({ activeFriendlyId, isNewChat, forcedSessionKey })
  const {
    historyQuery,
    historyMessages,
    displayMessages,
    historyError,
    resolvedSessionKey,
    activeCanonicalKey,
    sessionKeyForHistory,
  } = useChatHistory({
    activeFriendlyId,
    activeSessionKey,
    forcedSessionKey,
    isNewChat,
    isRedirecting,
    activeExists,
    sessionsReady: sessionsQuery.isSuccess,
    queryClient,
  })

  useAutoSessionTitle({
    friendlyId: activeFriendlyId,
    sessionKey: resolvedSessionKey,
    activeSession,
    messages: historyMessages,
    enabled: !isNewChat && Boolean(resolvedSessionKey) && historyQuery.isSuccess,
  })

  const clearActiveStream = useCallback(function clearActiveStream(
    streamId?: string,
  ) {
    const current = activeStreamRef.current
    if (!current) return
    if (streamId && current.streamId !== streamId) return
    activeStreamRef.current = null
    setStreamingMessageId(null)
    setStreamingText('')
    setStreamingThinking('')
  }, [])

  const streamStop = useCallback(() => {
    if (streamTimer.current) {
      window.clearInterval(streamTimer.current)
      streamTimer.current = null
    }
    if (streamIdleTimer.current) {
      window.clearTimeout(streamIdleTimer.current)
      streamIdleTimer.current = null
    }
  }, [])

  const streamFinish = useCallback(() => {
    streamStop()
    setPendingGeneration(false)
    setWaitingForResponse(false)
  }, [streamStop])

  const finalizeStreamingPlaceholder = useCallback(
    async function finalizeStreamingPlaceholder(
      context: ActiveStreamContext,
      finalText: string,
    ) {
      updateHistoryMessageByClientId(
        queryClient,
        context.friendlyId,
        context.sessionKey,
        context.streamId,
        function markStreamComplete(message) {
          return {
            ...message,
            __streamingStatus: 'complete',
            __streamingText: finalText,
          }
        },
      )

      const historyKey = chatQueryKeys.history(
        context.friendlyId,
        context.sessionKey,
      )
      const maxAttempts = 12

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const cached = queryClient.getQueryData(historyKey) as
          | HistoryResponse
          | undefined
        const cachedMessages = Array.isArray(cached?.messages)
          ? cached.messages
          : []
        if (hasResolvedAssistantMessage(cachedMessages, context, finalText)) {
          break
        }
        await historyQuery.refetch()
        await waitFor(Math.min(320, 80 + attempt * 20))
      }

      if (activeStreamRef.current?.streamId !== context.streamId) {
        return
      }

      removeHistoryMessageByClientId(
        queryClient,
        context.friendlyId,
        context.sessionKey,
        context.streamId,
      )
      clearActiveStream(context.streamId)
      streamFinish()
    },
    [clearActiveStream, historyQuery, queryClient, streamFinish],
  )

  // Streaming message hook
  const streaming = useStreamingMessage({
    onChunk: useCallback((_chunk: string, fullText: string) => {
      setStreamingText(fullText)
      const context = activeStreamRef.current
      if (!context) return
      updateHistoryMessageByClientId(
        queryClient,
        context.friendlyId,
        context.sessionKey,
        context.streamId,
        function updateStreamingMessage(message) {
          return { ...message, __streamingText: fullText }
        },
      )
    }, [queryClient]),
    onThinking: useCallback((thinking: string) => {
      setStreamingThinking(thinking)
      const context = activeStreamRef.current
      if (!context) return
      updateHistoryMessageByClientId(
        queryClient,
        context.friendlyId,
        context.sessionKey,
        context.streamId,
        function updateStreamingThinking(message) {
          return { ...message, __streamingThinking: thinking }
        },
      )
    }, [queryClient]),
    onComplete: useCallback(
      async function onComplete(message: GatewayMessage) {
        const context = activeStreamRef.current
        if (!context) {
          streamFinish()
          return
        }
        const finalText = textFromMessage(message)
        setStreamingText(finalText)
        setStreamingThinking('')
        await finalizeStreamingPlaceholder(context, finalText)
      },
      [finalizeStreamingPlaceholder, streamFinish],
    ),
    onError: useCallback((errorMessage: string) => {
      const context = activeStreamRef.current
      if (context) {
        removeHistoryMessageByClientId(
          queryClient,
          context.friendlyId,
          context.sessionKey,
          context.streamId,
        )
        clearActiveStream(context.streamId)
      } else {
        setStreamingMessageId(null)
        setStreamingText('')
        setStreamingThinking('')
      }
      setError(`Streaming error: ${errorMessage}`)
      streamFinish()
    }, [clearActiveStream, queryClient, streamFinish]),
  })

  const uiQuery = useQuery({
    queryKey: chatUiQueryKey,
    queryFn: function readUiState() {
      return getChatUiState(queryClient)
    },
    initialData: function initialUiState() {
      return getChatUiState(queryClient)
    },
    staleTime: Infinity,
  })
  const gatewayStatusQuery = useQuery({
    queryKey: ['gateway', 'status'],
    queryFn: fetchGatewayStatus,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: 'always',
  })
  const gatewayStatusMountRef = useRef(Date.now())
  const gatewayStatusError =
    gatewayStatusQuery.error instanceof Error
      ? gatewayStatusQuery.error.message
      : gatewayStatusQuery.data && !gatewayStatusQuery.data.ok
        ? gatewayStatusQuery.data.error || 'Gateway unavailable'
        : null
  const gatewayError = gatewayStatusError ?? sessionsError ?? historyError
  const handleGatewayRefetch = useCallback(() => {
    void gatewayStatusQuery.refetch()
  }, [gatewayStatusQuery])
  const isSidebarCollapsed = uiQuery.data?.isSidebarCollapsed ?? false
  const handleActiveSessionDelete = useCallback(() => {
    setError(null)
    setIsRedirecting(true)
    navigate({ to: '/new', replace: true })
  }, [navigate])
  const streamStart = useCallback(() => {
    if (!activeFriendlyId || isNewChat) return
    if (streamTimer.current) window.clearInterval(streamTimer.current)
    streamTimer.current = window.setInterval(() => {
      refreshHistoryRef.current()
    }, 350)
  }, [activeFriendlyId, isNewChat])
  const stableContentStyle = useMemo<React.CSSProperties>(() => ({}), [])
  refreshHistoryRef.current = function refreshHistory() {
    void historyQuery.refetch()
  }

  useEffect(() => {
    if (isRedirecting) {
      if (error) setError(null)
      return
    }
    if (shouldRedirectToNew) {
      if (error) setError(null)
      return
    }
    if (sessionsQuery.isSuccess && !activeExists) {
      if (error) setError(null)
      return
    }
    const messageText = sessionsError ?? historyError ?? gatewayStatusError
    if (!messageText) {
      if (error?.startsWith('Failed to load')) {
        setError(null)
      }
      return
    }
    if (isMissingGatewayAuth(messageText)) {
      navigate({ to: '/connect', replace: true })
    }
    const message = sessionsError
      ? `Failed to load sessions. ${sessionsError}`
      : historyError
        ? `Failed to load history. ${historyError}`
        : gatewayStatusError
          ? `Gateway unavailable. ${gatewayStatusError}`
          : null
    if (message) setError(message)
  }, [
    error,
    gatewayStatusError,
    historyError,
    isRedirecting,
    navigate,
    sessionsError,
  ])

  const shouldRedirectToNew =
    !isNewChat &&
    !forcedSessionKey &&
    !isRecentSession(activeFriendlyId) &&
    sessionsQuery.isSuccess &&
    sessions.length > 0 &&
    !sessions.some((session) => session.friendlyId === activeFriendlyId) &&
    !historyQuery.isFetching &&
    !historyQuery.isSuccess

  useEffect(() => {
    if (!isRedirecting) return
    if (isNewChat) {
      setIsRedirecting(false)
      return
    }
    if (!shouldRedirectToNew && sessionsQuery.isSuccess) {
      setIsRedirecting(false)
    }
  }, [isNewChat, isRedirecting, sessionsQuery.isSuccess, shouldRedirectToNew])

  useEffect(() => {
    if (isNewChat) return
    if (!sessionsQuery.isSuccess) return
    if (sessions.length === 0) return
    if (!shouldRedirectToNew) return
    resetPendingSend()
    clearHistoryMessages(queryClient, activeFriendlyId, sessionKeyForHistory)
    navigate({ to: '/new', replace: true })
  }, [
    activeFriendlyId,
    historyQuery.isFetching,
    historyQuery.isSuccess,
    isNewChat,
    navigate,
    queryClient,
    sessionKeyForHistory,
    sessions,
    sessionsQuery.isSuccess,
    shouldRedirectToNew,
  ])

  const hideUi = shouldRedirectToNew || isRedirecting

  useEffect(() => {
    const latestMessage = historyMessages[historyMessages.length - 1]
    if (!latestMessage || latestMessage.role !== 'assistant') return
    const signature = `${historyMessages.length}:${textFromMessage(latestMessage).slice(-64)}`
    if (signature !== lastAssistantSignature.current) {
      lastAssistantSignature.current = signature
      if (streamIdleTimer.current) {
        window.clearTimeout(streamIdleTimer.current)
      }
      streamIdleTimer.current = window.setTimeout(() => {
        streamFinish()
      }, 4000)
    }
  }, [historyMessages, streamFinish])

  useEffect(() => {
    const resetKey = isNewChat ? 'new' : activeFriendlyId
    if (!resetKey) return
    if (pendingStartRef.current) {
      pendingStartRef.current = false
      return
    }
    if (hasPendingSend() || hasPendingGeneration()) {
      setWaitingForResponse(true)
      setPinToTop(true)
      return
    }
    streamStop()
    lastAssistantSignature.current = ''
    clearActiveStream()
    setWaitingForResponse(false)
    setPinToTop(false)
  }, [activeFriendlyId, clearActiveStream, isNewChat, streamStop])

  useLayoutEffect(() => {
    if (isNewChat) return
    const pending = consumePendingSend(
      forcedSessionKey || resolvedSessionKey || activeSessionKey,
      activeFriendlyId,
    )
    if (!pending) return
    pendingStartRef.current = true
    const historyKey = chatQueryKeys.history(
      pending.friendlyId,
      pending.sessionKey,
    )
    const cached = queryClient.getQueryData(historyKey) as
      | HistoryResponse
      | undefined
    const cachedMessages = Array.isArray(cached?.messages)
      ? cached.messages
      : []
    const alreadyHasOptimistic = cachedMessages.some((message) => {
      if (pending.optimisticMessage.clientId) {
        if (message.clientId === pending.optimisticMessage.clientId) return true
        if (message.__optimisticId === pending.optimisticMessage.clientId)
          return true
      }
      if (pending.optimisticMessage.__optimisticId) {
        if (message.__optimisticId === pending.optimisticMessage.__optimisticId)
          return true
      }
      return false
    })
    if (!alreadyHasOptimistic) {
      appendHistoryMessage(
        queryClient,
        pending.friendlyId,
        pending.sessionKey,
        pending.optimisticMessage,
      )
    }
    setWaitingForResponse(true)
    setPinToTop(true)
    sendMessage(
      pending.sessionKey,
      pending.friendlyId,
      pending.message,
      pending.attachments,
      true,
    )
  }, [
    activeFriendlyId,
    activeSessionKey,
    forcedSessionKey,
    isNewChat,
    queryClient,
    resolvedSessionKey,
  ])

  function sendMessage(
    sessionKey: string,
    friendlyId: string,
    body: string,
    attachments: Array<GatewayAttachment> = [],
    skipOptimistic = false,
  ) {
    const normalizedAttachments = attachments.map((attachment) => ({
      ...attachment,
      id: attachment.id ?? crypto.randomUUID(),
    }))

    let optimisticClientId = ''
    if (!skipOptimistic) {
      const { clientId, optimisticMessage } = createOptimisticMessage(
        body,
        normalizedAttachments,
      )
      optimisticClientId = clientId
      appendHistoryMessage(
        queryClient,
        friendlyId,
        sessionKey,
        optimisticMessage,
      )
      updateSessionLastMessage(
        queryClient,
        sessionKey,
        friendlyId,
        optimisticMessage,
      )
    }

    setPendingGeneration(true)
    setSending(true)
    setError(null)
    setWaitingForResponse(true)
    setPinToTop(true)

    const payloadAttachments = normalizedAttachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      contentType: attachment.contentType,
      size: attachment.size,
      dataUrl: attachment.dataUrl,
    }))

    if (useStreamingApi) {
      if (activeStreamRef.current) {
        const previous = activeStreamRef.current
        removeHistoryMessageByClientId(
          queryClient,
          previous.friendlyId,
          previous.sessionKey,
          previous.streamId,
        )
        clearActiveStream(previous.streamId)
      }

      const streamContext: ActiveStreamContext = {
        streamId: `streaming-${Date.now()}`,
        friendlyId,
        sessionKey,
      }
      activeStreamRef.current = streamContext
      setStreamingMessageId(streamContext.streamId)
      setStreamingText('')
      setStreamingThinking('')

      const streamingPlaceholder: GatewayMessage = {
        role: 'assistant',
        content: [],
        __optimisticId: streamContext.streamId,
        __streamingStatus: 'streaming',
        __streamingText: '',
        __streamingThinking: '',
        timestamp: Date.now(),
      }
      appendHistoryMessage(queryClient, friendlyId, sessionKey, streamingPlaceholder)

      streaming.startStreaming({
        sessionKey,
        friendlyId,
        message: body,
        thinking: 'low',
        attachments: payloadAttachments.length > 0 ? payloadAttachments : undefined,
      }).catch((err) => {
        console.warn('Streaming failed, falling back to polling:', err)
        setUseStreamingApi(false)
        if (activeStreamRef.current?.streamId === streamContext.streamId) {
          removeHistoryMessageByClientId(
            queryClient,
            friendlyId,
            sessionKey,
            streamContext.streamId,
          )
          clearActiveStream(streamContext.streamId)
        }
        sendMessageNonStreaming(
          sessionKey,
          friendlyId,
          body,
          payloadAttachments,
          optimisticClientId,
        )
      })

      setSending(false)
      return
    }

    sendMessageNonStreaming(
      sessionKey,
      friendlyId,
      body,
      payloadAttachments,
      optimisticClientId,
    )
  }

  function sendMessageNonStreaming(
    sessionKey: string,
    friendlyId: string,
    body: string,
    payloadAttachments: Array<{
      id?: string
      name?: string
      contentType?: string
      size?: number
      dataUrl?: string
    }>,
    optimisticClientId: string,
  ) {
    fetch('/api/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionKey,
        friendlyId,
        message: body,
        attachments: payloadAttachments.length > 0 ? payloadAttachments : undefined,
        thinking: 'low',
        idempotencyKey: crypto.randomUUID(),
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res))
        streamStart()
      })
      .catch((err) => {
        const messageText = err instanceof Error ? err.message : String(err)
        if (isMissingGatewayAuth(messageText)) {
          navigate({ to: '/connect', replace: true })
          return
        }
        if (optimisticClientId) {
          updateHistoryMessageByClientId(
            queryClient,
            friendlyId,
            sessionKey,
            optimisticClientId,
            function markFailed(message) {
              return { ...message, status: 'error' }
            },
          )
        }
        setError(`Failed to send message. ${messageText}`)
        setPendingGeneration(false)
        setWaitingForResponse(false)
        setPinToTop(false)
      })
      .finally(() => {
        setSending(false)
      })
  }

  const createSessionForMessage = useCallback(async () => {
    setCreatingSession(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error(await readError(res))

      const data = (await res.json()) as {
        sessionKey?: string
        friendlyId?: string
      }

      const sessionKey =
        typeof data.sessionKey === 'string' ? data.sessionKey : ''
      const friendlyId =
        typeof data.friendlyId === 'string' && data.friendlyId.trim().length > 0
          ? data.friendlyId.trim()
          : deriveFriendlyIdFromKey(sessionKey)

      if (!sessionKey || !friendlyId) {
        throw new Error('Invalid session response')
      }

      queryClient.invalidateQueries({ queryKey: chatQueryKeys.sessions })
      return { sessionKey, friendlyId }
    } finally {
      setCreatingSession(false)
    }
  }, [queryClient])

  const send = useCallback(
    (
      body: string,
      attachments: Array<ChatComposerAttachment>,
      helpers: ChatComposerHelpers,
    ) => {
      const trimmedBody = body.trim()
      if (trimmedBody.length === 0 && attachments.length === 0) return
      helpers.reset()

      const attachmentPayload: Array<GatewayAttachment> = attachments.map(
        (attachment) => ({
          ...attachment,
          id: attachment.id ?? crypto.randomUUID(),
        }),
      )

      if (isNewChat) {
        const { clientId, optimisticId, optimisticMessage } =
          createOptimisticMessage(trimmedBody, attachmentPayload)
        appendHistoryMessage(queryClient, 'new', 'new', optimisticMessage)
        setPendingGeneration(true)
        setSending(true)
        setWaitingForResponse(true)
        setPinToTop(true)

        createSessionForMessage()
          .then(({ sessionKey, friendlyId }) => {
            setRecentSession(friendlyId)
            stashPendingSend({
              sessionKey,
              friendlyId,
              message: trimmedBody,
              attachments: attachmentPayload,
              optimisticMessage,
            })
            if (onSessionResolved) {
              onSessionResolved({ sessionKey, friendlyId })
              return
            }
            navigate({
              to: '/chat/$sessionKey',
              params: { sessionKey: friendlyId },
              replace: true,
            })
          })
          .catch((err: unknown) => {
            removeHistoryMessageByClientId(
              queryClient,
              'new',
              'new',
              clientId,
              optimisticId,
            )
            helpers.setValue(trimmedBody)
            helpers.setAttachments(attachments)
            setError(
              `Failed to create session. ${err instanceof Error ? err.message : String(err)}`,
            )
            setPendingGeneration(false)
            setWaitingForResponse(false)
            setPinToTop(false)
            setSending(false)
          })
        return
      }

      const sessionKeyForSend =
        forcedSessionKey || resolvedSessionKey || activeSessionKey
      sendMessage(
        sessionKeyForSend,
        activeFriendlyId,
        trimmedBody,
        attachmentPayload,
      )
    },
    [
      activeFriendlyId,
      activeSessionKey,
      createSessionForMessage,
      forcedSessionKey,
      isNewChat,
      navigate,
      onSessionResolved,
      queryClient,
      resolvedSessionKey,
    ],
  )

  const startNewChat = useCallback(() => {
    setWaitingForResponse(false)
    setPinToTop(false)
    clearHistoryMessages(queryClient, 'new', 'new')
    navigate({ to: '/new' })
    if (isMobile) {
      setChatUiState(queryClient, function collapse(state) {
        return { ...state, isSidebarCollapsed: true }
      })
    }
  }, [isMobile, navigate, queryClient])

  const handleToggleSidebarCollapse = useCallback(() => {
    setChatUiState(queryClient, function toggle(state) {
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed }
    })
  }, [queryClient])

  const handleSelectSession = useCallback(() => {
    if (!isMobile) return
    setChatUiState(queryClient, function collapse(state) {
      return { ...state, isSidebarCollapsed: true }
    })
  }, [isMobile, queryClient])

  const handleOpenSidebar = useCallback(() => {
    setChatUiState(queryClient, function open(state) {
      return { ...state, isSidebarCollapsed: false }
    })
  }, [queryClient])

  const historyLoading =
    (historyQuery.isLoading && !historyQuery.data) || isRedirecting
  const showGatewayDown = Boolean(gatewayStatusError)
  const showGatewayNotice =
    showGatewayDown &&
    gatewayStatusQuery.errorUpdatedAt > gatewayStatusMountRef.current
  const historyEmpty = !historyLoading && displayMessages.length === 0
  const gatewayNotice = useMemo(() => {
    if (!showGatewayNotice) return null
    if (!gatewayError) return null
    return (
      <GatewayStatusMessage
        state="error"
        error={gatewayError}
        onRetry={handleGatewayRefetch}
      />
    )
  }, [gatewayError, handleGatewayRefetch, showGatewayNotice])

  const sidebar = (
    <ChatSidebar
      sessions={sessions}
      activeFriendlyId={activeFriendlyId}
      creatingSession={creatingSession}
      onCreateSession={startNewChat}
      isCollapsed={isMobile ? false : isSidebarCollapsed}
      onToggleCollapse={handleToggleSidebarCollapse}
      onSelectSession={handleSelectSession}
      onActiveSessionDelete={handleActiveSessionDelete}
    />
  )
  const hasActiveStreamPlaceholder = streamingMessageId !== null

  return (
    <div className="h-screen bg-surface text-primary-900">
      <div
        className={cn(
          'h-full overflow-hidden',
          isMobile ? 'relative' : 'grid grid-cols-[auto_1fr]',
        )}
      >
        {hideUi ? null : isMobile ? (
          <>
            <div
              className={cn(
                'fixed inset-y-0 left-0 z-50 w-[300px] transition-transform duration-200',
                isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0',
              )}
            >
              {sidebar}
            </div>
          </>
        ) : (
          sidebar
        )}

        <main className="flex flex-col h-full min-h-0" ref={mainRef}>
          <ChatHeader
            activeTitle={activeTitle}
            wrapperRef={headerRef}
            showSidebarButton={isMobile}
            onOpenSidebar={handleOpenSidebar}
          />

          {hideUi ? null : (
            <>
              <ChatMessageList
                messages={displayMessages}
                loading={historyLoading}
                empty={historyEmpty}
                notice={gatewayNotice}
                noticePosition="end"
                waitingForResponse={waitingForResponse}
                sessionKey={activeCanonicalKey}
                pinToTop={pinToTop}
                pinGroupMinHeight={pinGroupMinHeight}
                headerHeight={headerHeight}
                contentStyle={stableContentStyle}
                isStreaming={streaming.isStreaming || hasActiveStreamPlaceholder}
                streamingMessageId={streamingMessageId}
                streamingText={streamingText}
                streamingThinking={streamingThinking}
              />
              <ChatComposer
                onSubmit={send}
                isLoading={sending}
                disabled={sending}
                wrapperRef={composerRef}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
