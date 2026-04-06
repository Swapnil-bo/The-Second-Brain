// Description: Chat message bubble — renders user and assistant messages. Assistant messages
// use react-markdown for rich formatting. Shows "Graph Entities Mentioned" as clickable pills.
// Source citations are collapsible. Slide-up entrance animation from bottom.

import { memo } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { User, Brain } from 'lucide-react'
import SourceCitation from './SourceCitation'

function ChatMessage({ message, sources, graphContext, onEntityClick }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 mt-0.5"
        style={{
          background: isUser ? 'var(--accent-subtle)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${isUser ? 'rgba(124, 58, 237, 0.2)' : 'rgba(16, 185, 129, 0.15)'}`,
        }}
      >
        {isUser ? (
          <User size={14} style={{ color: 'var(--accent-bright)' }} />
        ) : (
          <Brain size={14} style={{ color: 'var(--status-success)' }} />
        )}
      </div>

      {/* Message body */}
      <div
        className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}
      >
        {/* Bubble */}
        <div
          className="px-3 py-2.5 rounded-xl text-[13px] leading-relaxed"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-primary)',
            background: isUser ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
            border: `1px solid ${isUser ? 'rgba(124, 58, 237, 0.15)' : 'var(--border-dim)'}`,
            borderTopRightRadius: isUser ? 4 : undefined,
            borderTopLeftRadius: !isUser ? 4 : undefined,
          }}
        >
          {isUser ? (
            <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
          ) : (
            <div className="chat-markdown prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  code: ({ children }) => (
                    <code
                      className="px-1 py-0.5 rounded text-[11px]"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--bg-surface)',
                        color: 'var(--accent-bright)',
                      }}
                    >
                      {children}
                    </code>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
                }}
              >
                {message.content || ''}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Graph entities mentioned — only for assistant */}
        {!isUser && graphContext?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {graphContext.map((entity, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onEntityClick?.(entity)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: `var(--entity-${entity.type?.toLowerCase() || 'unknown'})15`,
                  color: `var(--entity-${entity.type?.toLowerCase() || 'unknown'})`,
                  border: `1px solid var(--entity-${entity.type?.toLowerCase() || 'unknown'})30`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {entity.name}
              </motion.button>
            ))}
          </div>
        )}

        {/* Sources — only for assistant */}
        {!isUser && sources?.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
              }}
            >
              Sources
            </span>
            {sources.map((source, i) => (
              <SourceCitation key={i} source={source} index={i} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default memo(ChatMessage)
