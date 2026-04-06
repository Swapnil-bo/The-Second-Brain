// Description: URL ingestion tab — paste any URL to scrape and extract knowledge.
// Shows URL validation, loading state during scrape, and success/error feedback.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ArrowRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function URLIngestor({ onSubmit }) {
  const [url, setUrl] = useState('')
  const [customName, setCustomName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const isValidUrl = (str) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async () => {
    if (!url.trim() || !isValidUrl(url.trim())) {
      setError('Please enter a valid URL')
      return
    }

    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      await onSubmit?.(url.trim(), customName.trim() || null)
      setSuccess(true)
      setUrl('')
      setCustomName('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to ingest URL')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* URL Input */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200"
        style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${error ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-dim)'}`,
        }}
      >
        <Globe size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/article..."
          className="flex-1 bg-transparent outline-none text-xs"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-primary)',
            caretColor: 'var(--accent-bright)',
          }}
          disabled={loading}
        />
      </div>

      {/* Optional custom name */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-dim)',
        }}
      >
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Custom source name (optional)"
          className="flex-1 bg-transparent outline-none text-xs"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-primary)',
            caretColor: 'var(--accent-bright)',
          }}
          disabled={loading}
        />
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
              URL queued for ingestion
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={loading || !url.trim()}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          fontFamily: 'var(--font-display)',
          background: 'var(--accent)',
          color: '#fff',
          boxShadow: url.trim() ? '0 0 20px var(--accent-glow)' : 'none',
        }}
        whileHover={url.trim() && !loading ? { scale: 1.02 } : {}}
        whileTap={url.trim() && !loading ? { scale: 0.98 } : {}}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={14} />
            </motion.div>
            Scraping...
          </>
        ) : (
          <>
            <ArrowRight size={14} />
            Ingest URL
          </>
        )}
      </motion.button>
    </div>
  )
}
