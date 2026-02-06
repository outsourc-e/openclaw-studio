import { useEffect, useMemo, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { chatQueryKeys } from '../chat-queries'
import { updateSessionTitleState, useSessionTitleInfo } from '../session-title-store'
import { textFromMessage } from '../utils'
import type { GatewayMessage, SessionMeta } from '../types'

const MIN_MESSAGES_FOR_TITLE = 3
const MAX_MESSAGES_FOR_TITLE = 6
const MAX_TOTAL_CHARS = 900
const MAX_PER_MESSAGE_CHARS = 400

function buildSnippet(messages: Array<GatewayMessage>) {
  const snippet: Array<{ role: string; text: string }> = []
  let totalChars = 0
  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue
    const text = textFromMessage(message)
    if (!text) continue
    const clipped = text.slice(0, MAX_PER_MESSAGE_CHARS)
    snippet.push({ role: message.role ?? 'user', text: clipped })
    totalChars += clipped.length
    if (
      snippet.length >= MAX_MESSAGES_FOR_TITLE ||
      totalChars >= MAX_TOTAL_CHARS
    ) {
      break
    }
  }
  return snippet
}

function computeSignature(
  friendlyId: string,
  snippet: Array<{ role: string; text: string }> | undefined,
): string {
  if (!snippet || snippet.length === 0) return ''
  return `${friendlyId}:${snippet
    .map((part) => `${part.role}:${part.text}`)
    .join('|')}`
}

type UseAutoSessionTitleInput = {
  friendlyId: string
  sessionKey: string | undefined
  activeSession?: SessionMeta
  messages: Array<GatewayMessage>
  enabled: boolean
}

type GenerateTitlePayload = {
  friendlyId: string
  sessionKey: string
  snippet: Array<{ role: string; text: string }>
  signature: string
}

type GenerateTitleResponse = {
  ok?: boolean
  title?: string
  fallback?: boolean
  source?: string
  error?: string
}

export function useAutoSessionTitle({
  friendlyId,
  sessionKey,
  activeSession,
  messages,
  enabled,
}: UseAutoSessionTitleInput) {
  const queryClient = useQueryClient()
  const titleInfo = useSessionTitleInfo(friendlyId)
  const lastAttemptSignaturesRef = useRef<Record<string, string>>({})

  const snippet = useMemo(() => {
    if (!enabled) return []
    return buildSnippet(messages)
  }, [enabled, messages])

  const snippetSignature = useMemo(
    () => computeSignature(friendlyId, snippet),
    [friendlyId, snippet],
  )

  const userCount = useMemo(
    () => snippet.filter((part) => part.role === 'user').length,
    [snippet],
  )

  const shouldGenerate = useMemo(() => {
    if (!enabled) return false
    if (!friendlyId || friendlyId === 'new') return false
    if (!sessionKey || sessionKey === 'new') return false
    if (!snippetSignature) return false
    if (snippet.length < MIN_MESSAGES_FOR_TITLE) return false
    if (userCount === 0) return false
    if (activeSession?.label || activeSession?.title) return false
    if (activeSession?.derivedTitle && activeSession.titleSource === 'auto')
      return false
    if (titleInfo.status === 'generating') return false
    if (titleInfo.status === 'ready' && titleInfo.title) return false
    return true
  }, [
    activeSession?.derivedTitle,
    activeSession?.label,
    activeSession?.title,
    activeSession?.titleSource,
    enabled,
    friendlyId,
    sessionKey,
    snippet.length,
    snippetSignature,
    titleInfo.status,
    titleInfo.title,
    userCount,
  ])

  const mutation = useMutation({
    mutationFn: async (payload: GenerateTitlePayload) => {
      const res = await fetch('/api/session-title', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          friendlyId: payload.friendlyId,
          sessionKey: payload.sessionKey,
          messages: payload.snippet,
          maxWords: 5,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as GenerateTitleResponse
      if (!res.ok || !data.ok || !data.title) {
        const message =
          data.error ?? (await res.text().catch(() => 'Failed to generate'))
        throw new Error(message)
      }
      return { payload, data }
    },
    onSuccess: ({ payload, data }) => {
      updateSessionTitleState(payload.friendlyId, {
        title: data.title,
        source: 'auto',
        status: 'ready',
        error: null,
      })
      queryClient.setQueryData(
        chatQueryKeys.sessions,
        function updateSessions(existing: unknown) {
          if (!Array.isArray(existing)) return existing
          return existing.map((session) => {
            if (
              session &&
              typeof session === 'object' &&
              (session as SessionMeta).friendlyId === payload.friendlyId
            ) {
              return {
                ...(session as SessionMeta),
                derivedTitle: data.title,
                titleStatus: 'ready',
                titleSource: 'auto',
                titleError: null,
              }
            }
            return session
          })
        },
      )
    },
    onError: (error: unknown, payload) => {
      updateSessionTitleState(payload.friendlyId, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error ?? ''),
      })
    },
  })

  const { mutate, isPending } = mutation

  useEffect(() => {
    if (!shouldGenerate) return
    if (isPending) return
    const lastSignature = lastAttemptSignaturesRef.current[friendlyId]
    if (lastSignature === snippetSignature) return
    lastAttemptSignaturesRef.current[friendlyId] = snippetSignature
    updateSessionTitleState(friendlyId, { status: 'generating', error: null })
    mutate({
      friendlyId,
      sessionKey: sessionKey ?? friendlyId,
      snippet,
      signature: snippetSignature,
    })
  }, [
    friendlyId,
    isPending,
    mutate,
    sessionKey,
    shouldGenerate,
    snippet,
    snippetSignature,
  ])
}
