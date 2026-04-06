// Description: Conversational query panel — SSE stream consumer. Fixed-height drawer that
// slides in from right. Messages scroll area (flex-col-reverse for bottom-pinned).
// Typing indicator with 3-dot pulse animation while stream is active.
// Uses native fetch with ReadableStream for SSE — NOT axios.

import { useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Trash2 } from 'lucide-react'
import { useBrain } from '../../context/BrainContext'
import { CHAT_URL } from '../../api/client'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

export default function ChatPanel() {
  const { state, dispatch, closePanel } = useBrain()
  const scrollRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [state.chatHistory, scrollToBottom])

  const sendMessage = useCallback(async (message) => {
    // Add user message
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'user', content: message } })
    // Add empty assistant message placeholder
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'assistant', content: '' } })
    dispatch({ type: 'SET_CHAT_STREAMING', payload: true })
    dispatch({ type: 'SET_CHAT_SOURCES', payload: [] })
    dispatch({ type: 'SET_CHAT_GRAPH_CONTEXT', payload: [] })

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: state.chatHistory
            .filter((m) => m.content)
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
          top_k: 5,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'token') {
              assistantMessage += event.content
              dispatch({ type: 'UPDATE_LAST_CHAT_MESSAGE', payload: assistantMessage })
            }
            if (event.type === 'done') {
              dispatch({ type: 'SET_CHAT_SOURCES', payload: event.sources || [] })
              dispatch({ type: 'SET_CHAT_GRAPH_CONTEXT', payload: event.graph_context || [] })
            }
          } catch {
            // skip malformed events
          }
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
  }, [state.chatHistory, dispatch])

  const handleClear = () => {
    dispatch({ type: 'CLEAR_CHAT' })
  }

  const handleEntityClick = (entity) => {
    dispatch({ type: 'SELECT_NODE', payload: entity })
    dispatch({ type: 'HIGHLIGHT_NODES', payload: [entity.id] })
  }

  const lastMsgIndex = state.chatHistory.length - 1

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="panel-overlay flex flex-col"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-dim)' }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={15} style={{ color: 'var(--accent-bright)' }} />
          <h2
            className="text-sm font-semibold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            Chat
          </h2>
          {state.chatHistory.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
                background: 'var(--bg-elevated)',
              }}
            >
              {state.chatHistory.length} msgs
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {state.chatHistory.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-150"
              title="Clear chat"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = 'var(--status-error)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-dim)'
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={closePanel}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-150"
            style={{ color: 'var(--text-dim)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-dim)'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
      >
        {state.chatHistory.length === 0 ? (
          <ChatEmptyState />
        ) : (
          state.chatHistory.map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              sources={i === lastMsgIndex && msg.role === 'assistant' ? state.chatSources : undefined}
              graphContext={i === lastMsgIndex && msg.role === 'assistant' ? state.chatGraphContext : undefined}
              onEntityClick={handleEntityClick}
            />
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {state.chatStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-1.5 px-3 py-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--accent-bright)' }}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <ChatInput onSend={sendMessage} disabled={state.chatStreaming} />
      </div>
    </motion.div>
  )
}

function ChatEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'var(--accent-subtle)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
          }}
        >
          <MessageSquare size={24} style={{ color: 'var(--accent-bright)' }} />
        </div>
        <div className="space-y-1">
          <h3
            className="text-sm font-semibold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            Query Your Brain
          </h3>
          <p
            className="text-xs leading-relaxed max-w-[240px]"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-dim)',
            }}
          >
            Ask questions about your knowledge. I'll search your notes and graph to find answers.
          </p>
        </div>
        <div
          className="flex flex-col gap-1.5 mt-2 text-[11px]"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-secondary)',
          }}
        >
          <span>"What do I know about transformers?"</span>
          <span>"How are BERT and GPT related?"</span>
          <span>"Summarize my notes on attention"</span>
        </div>
      </motion.div>
    </div>
  )
}
