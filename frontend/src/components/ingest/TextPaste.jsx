// Description: Raw text paste ingestion tab. Large monospace textarea with character counter,
// optional source name field, and submit button. Validates minimum content length.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlignLeft, ArrowRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function TextPaste({ onSubmit }) {
  const [content, setContent] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const charCount = content.length
  const isValid = charCount >= 10

  const handleSubmit = async () => {
    if (!isValid) {
      setError('Content must be at least 10 characters')
      return
    }

    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      await onSubmit?.(content.trim(), sourceName.trim() || 'Pasted Note')
      setSuccess(true)
      setContent('')
      setSourceName('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to ingest text')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Source name */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-dim)',
        }}
      >
        <AlignLeft size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
        <input
          type="text"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="Source name (e.g., 'My Notes on Transformers')"
          className="flex-1 bg-transparent outline-none text-xs"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-primary)',
            caretColor: 'var(--accent-bright)',
          }}
          disabled={loading}
        />
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setError(null)
          }}
          placeholder="Paste your notes, thoughts, or any text content here..."
          rows={8}
          className="w-full px-3 py-3 rounded-lg outline-none resize-none text-xs leading-relaxed"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            background: 'var(--bg-elevated)',
            border: `1px solid ${error ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-dim)'}`,
            color: 'var(--text-primary)',
            caretColor: 'var(--accent-bright)',
            transition: 'border-color 0.2s ease',
          }}
          disabled={loading}
        />

        {/* Character counter */}
        <div
          className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: charCount < 10 ? 'var(--text-dim)' : 'var(--text-secondary)',
            background: 'var(--bg-surface)',
          }}
        >
          {charCount.toLocaleString()} chars
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}
          >
            <AlertTriangle size={14} style={{ color: 'var(--status-error)', flexShrink: 0 }} />
            <span
              className="text-xs"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--status-error)' }}
            >
              {error}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
            }}
          >
            <CheckCircle size={14} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
            <span
              className="text-xs"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--status-success)' }}
            >
              Text queued for ingestion
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={loading || !isValid}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          fontFamily: 'var(--font-display)',
          background: 'var(--accent)',
          color: '#fff',
          boxShadow: isValid ? '0 0 20px var(--accent-glow)' : 'none',
        }}
        whileHover={isValid && !loading ? { scale: 1.02 } : {}}
        whileTap={isValid && !loading ? { scale: 0.98 } : {}}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={14} />
            </motion.div>
            Processing...
          </>
        ) : (
          <>
            <ArrowRight size={14} />
            Ingest Text
          </>
        )}
      </motion.button>
    </div>
  )
}
