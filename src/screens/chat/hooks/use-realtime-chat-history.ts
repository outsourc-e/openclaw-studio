import { useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGatewayChatStream } from '../../../hooks/use-gateway-chat-stream'
import { useGatewayChatStore } from '../../../stores/gateway-chat-store'
import { chatQueryKeys, appendHistoryMessage } from '../chat-queries'
import type { GatewayMessage, HistoryResponse } from '../types'

type UseRealtimeChatHistoryOptions = {
  sessionKey: string
  friendlyId: string
  historyMessages: Array<GatewayMessage>
  enabled?: boolean
  onUserMessage?: (message: GatewayMessage, source?: string) => void
}

/**
 * Hook that enhances history polling with real-time streaming.
 * Subscribes to gateway chat events and merges incoming messages
 * with the polled history.
 */
export function useRealtimeChatHistory({
  sessionKey,
  friendlyId,
  historyMessages,
  enabled = true,
  onUserMessage,
}: UseRealtimeChatHistoryOptions) {
  const queryClient = useQueryClient()
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
  })

  const { 
    getRealtimeMessages, 
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
    return () => {
      if (sessionKey && sessionKey !== 'new') {
        // Don't clear immediately - wait for history to catch up
        const timer = setTimeout(() => {
          clearSession(sessionKey)
        }, 5000)
        return () => clearTimeout(timer)
      }
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
  }
}
