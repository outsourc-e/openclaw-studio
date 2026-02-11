import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGatewayChatStream } from '../../../hooks/use-gateway-chat-stream'
import { useGatewayChatStore } from '../../../stores/gateway-chat-store'
import { appendHistoryMessage } from '../chat-queries'
import type { GatewayMessage } from '../types'

type UseRealtimeChatHistoryOptions = {
  sessionKey: string
  friendlyId: string
  historyMessages: Array<GatewayMessage>
  enabled?: boolean
  onUserMessage?: (message: GatewayMessage, source?: string) => void
}

/**
 * Hook that makes SSE the PRIMARY source for new messages and streaming.
 * - Streaming chunks update the gateway-chat-store (already happens)
 * - When 'done' arrives, the complete message is immediately available
 * - History polling is now just a backup/backfill mechanism
 */
export function useRealtimeChatHistory({
  sessionKey,
  friendlyId,
  historyMessages,
  enabled = true,
  onUserMessage,
}: UseRealtimeChatHistoryOptions) {
  const queryClient = useQueryClient()
  const [lastCompletedRunAt, setLastCompletedRunAt] = useState<number | null>(null)
  
  const { 
    connectionState, 
    lastError,
    reconnect,
  } = useGatewayChatStream({
    sessionKey: sessionKey === 'new' ? undefined : sessionKey,
    enabled: enabled && sessionKey !== 'new',
    onUserMessage: useCallback((message: GatewayMessage, source?: string) => {
      // When we receive a user message from an external channel,
      // append it to the query cache immediately for instant display
      if (sessionKey && sessionKey !== 'new') {
        appendHistoryMessage(queryClient, friendlyId, sessionKey, {
          ...message,
          __realtimeSource: source,
        })
      }
      onUserMessage?.(message, source)
    }, [queryClient, friendlyId, sessionKey, onUserMessage]),
    onDone: useCallback((_state: string, eventSessionKey: string) => {
      // Track when generation completes for this session
      if (eventSessionKey === sessionKey || !sessionKey || sessionKey === 'new') {
        setLastCompletedRunAt(Date.now())
      }
    }, [sessionKey]),
  })

  const { 
    getStreamingState,
    mergeHistoryMessages,
    clearSession,
  } = useGatewayChatStore()

  // Get current streaming state for this session
  const streamingState = useMemo(() => {
    return getStreamingState(sessionKey)
  }, [getStreamingState, sessionKey])

  // Merge history with real-time messages
  const mergedMessages = useMemo(() => {
    if (sessionKey === 'new') return historyMessages
    return mergeHistoryMessages(sessionKey, historyMessages)
  }, [sessionKey, historyMessages, mergeHistoryMessages])

  // Clear realtime buffer when session changes
  useEffect(() => {
    if (!sessionKey || sessionKey === 'new') return undefined

    // Clear on unmount/session change after a delay
    // to allow history to catch up
    return () => {
      setTimeout(() => {
        clearSession(sessionKey)
      }, 5000)
    }
  }, [sessionKey, clearSession])

  // Compute streaming UI state
  const isRealtimeStreaming = streamingState !== null && streamingState.text.length > 0
  const realtimeStreamingText = streamingState?.text ?? ''
  const realtimeStreamingThinking = streamingState?.thinking ?? ''

  return {
    messages: mergedMessages,
    connectionState,
    lastError,
    reconnect,
    isRealtimeStreaming,
    realtimeStreamingText,
    realtimeStreamingThinking,
    streamingRunId: streamingState?.runId ?? null,
    lastCompletedRunAt, // Parent watches this to clear waitingForResponse
  }
}
