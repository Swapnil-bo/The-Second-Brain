// Description: Chat input bar — multiline textarea. Shift+Enter for newline, Enter to send.
// Send button with animated state. Disabled while streaming. Subtle glow on focus.

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = '38px'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    setValue(e.target.value)
    // Auto-resize
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = '38px'
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
    }
  }

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div
      className="flex items-end gap-2 px-3 py-2.5 rounded-xl transition-all duration-200"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-dim)',
        boxShadow: canSend ? '0 0 20px var(--accent-glow)' : 'none',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask your second brain..."
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent outline-none resize-none text-[13px] leading-relaxed"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--text-primary)',
          caretColor: 'var(--accent-bright)',
          height: 38,
          maxHeight: 120,
          scrollbarWidth: 'none',
        }}
      />

      <motion.button
        onClick={handleSend}
        disabled={!canSend}
        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: canSend ? 'var(--accent)' : 'var(--bg-surface)',
          color: canSend ? '#fff' : 'var(--text-dim)',
        }}
        whileHover={canSend ? { scale: 1.05 } : {}}
        whileTap={canSend ? { scale: 0.95 } : {}}
      >
        {disabled ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={14} />
          </motion.div>
        ) : (
          <Send size={14} />
        )}
      </motion.button>
    </div>
  )
}
