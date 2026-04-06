// Description: Chat hook — SSE stream reader via native fetch/ReadableStream. Sends messages
// to POST /api/chat, consumes server-sent events token-by-token for live streaming,
// and extracts source citations + graph context from the final event.
// Does NOT use axios — SSE requires raw fetch with ReadableStream.

import { useCallback } from 'react'
import { useBrain } from '../context/BrainContext'
import { CHAT_URL } from '../api/client'

export default function useChat() {
  const { state, dispatch } = useBrain()

  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim()) return

      // Add user message to history
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: { role: 'user', content: message },
      })

      // Add empty assistant placeholder for streaming
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: { role: 'assistant', content: '' },
      })

      dispatch({ type: 'SET_CHAT_STREAMING', payload: true })
      dispatch({ type: 'SET_CHAT_SOURCES', payload: [] })
      dispatch({ type: 'SET_CHAT_GRAPH_CONTEXT', payload: [] })

      try {
        // Build history from last 10 non-empty messages
        const history = state.chatHistory
          .filter((m) => m.content)
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }))

        const response = await fetch(CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history, top_k: 5 }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE lines from buffer
          const lines = buffer.split('\n')
          // Keep last incomplete line in buffer
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue

            try {
              const event = JSON.parse(trimmed.slice(6))

              if (event.type === 'token') {
                assistantMessage += event.content
                dispatch({
                  type: 'UPDATE_LAST_CHAT_MESSAGE',
                  payload: assistantMessage,
                })
              }

              if (event.type === 'done') {
                dispatch({
                  type: 'SET_CHAT_SOURCES',
                  payload: event.sources || [],
                })
                dispatch({
                  type: 'SET_CHAT_GRAPH_CONTEXT',
                  payload: event.graph_context || [],
                })
              }

              if (event.type === 'error') {
                dispatch({
                  type: 'UPDATE_LAST_CHAT_MESSAGE',
                  payload: event.content || "Something went wrong.",
                })
              }
            } catch {
              // skip malformed SSE events
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim().startsWith('data: ')) {
          try {
            const event = JSON.parse(buffer.trim().slice(6))
            if (event.type === 'token') {
              assistantMessage += event.content
              dispatch({
                type: 'UPDATE_LAST_CHAT_MESSAGE',
                payload: assistantMessage,
              })
            }
            if (event.type === 'done') {
              dispatch({
                type: 'SET_CHAT_SOURCES',
                payload: event.sources || [],
              })
              dispatch({
                type: 'SET_CHAT_GRAPH_CONTEXT',
                payload: event.graph_context || [],
              })
            }
          } catch {
            // skip
          }
        }
      } catch (err) {
        dispatch({
          type: 'UPDATE_LAST_CHAT_MESSAGE',
          payload: "Couldn't query your brain. Try again.",
        })
      } finally {
        dispatch({ type: 'SET_CHAT_STREAMING', payload: false })
      }
    },
    [state.chatHistory, dispatch]
  )

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_CHAT' })
  }, [dispatch])

  return {
    history: state.chatHistory,
    sources: state.chatSources,
    graphContext: state.chatGraphContext,
    streaming: state.chatStreaming,
    sendMessage,
    clearChat,
  }
}
