// Description: Drag-and-drop file upload zone. Accepts .pdf, .md, .txt, .markdown.
// Animated dashed border that glows on drag-over. Shows file preview card after selection.
// Calls ingestFile API and reports progress through parent callback.

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, FileCode, AlignLeft, X, CheckCircle, AlertTriangle } from 'lucide-react'

const ACCEPTED_TYPES = {
  'application/pdf': 'pdf',
  'text/markdown': 'markdown',
  'text/plain': 'text',
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.md', '.txt', '.markdown']

function getFileIcon(name) {
  if (name?.endsWith('.pdf')) return FileText
  if (name?.endsWith('.md') || name?.endsWith('.markdown')) return FileCode
  return AlignLeft
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function FileDropzone({ onUpload }) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type: ${ext}. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`
    }
    if (file.size > 50 * 1024 * 1024) {
      return 'File too large. Maximum size: 50MB'
    }
    return null
  }

  const handleFile = useCallback((file) => {
    setError(null)
    const err = validateFile(file)
    if (err) {
      setError(err)
      return
    }
    setSelectedFile(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile)
      setSelectedFile(null)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setError(null)
  }

  const FileIcon = selectedFile ? getFileIcon(selectedFile.name) : Upload

  return (
    <div className="flex flex-col gap-3">
      {/* Dropzone */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer overflow-hidden"
        style={{
          minHeight: 160,
          background: dragOver ? 'rgba(124, 58, 237, 0.06)' : 'var(--bg-elevated)',
          border: `2px dashed ${dragOver ? 'var(--accent-bright)' : 'var(--border-dim)'}`,
          transition: 'all 0.2s ease',
        }}
        animate={dragOver ? { scale: 1.01 } : { scale: 1 }}
      >
        {/* Glow ring on drag */}
        {dragOver && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              boxShadow: '0 0 40px var(--accent-glow) inset',
            }}
          />
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.txt,.markdown"
          onChange={handleInputChange}
          className="hidden"
        />

        <motion.div
          animate={dragOver ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex items-center justify-center w-12 h-12 rounded-xl"
          style={{
            background: 'var(--accent-subtle)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
          }}
        >
          <Upload size={20} style={{ color: 'var(--accent-bright)' }} />
        </motion.div>

        <div className="text-center">
          <p
            className="text-sm font-medium"
            style={{
              fontFamily: 'var(--font-display)',
              color: dragOver ? 'var(--accent-bright)' : 'var(--text-primary)',
            }}
          >
            {dragOver ? 'Drop it here' : 'Drop a file or click to browse'}
          </p>
          <p
            className="text-[11px] mt-1"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-dim)',
            }}
          >
            PDF, Markdown, or plain text
          </p>
        </div>
      </motion.div>

      {/* Error message */}
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
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--status-error)',
              }}
            >
              {error}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected file preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-glow)',
            }}
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <FileIcon size={16} style={{ color: 'var(--entity-concept)' }} />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="text-xs font-medium truncate"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-primary)',
                }}
              >
                {selectedFile.name}
              </span>
              <span
                className="text-[10px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-dim)',
                }}
              >
                {formatFileSize(selectedFile.size)}
              </span>
            </div>

            <button
              onClick={clearFile}
              className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 transition-colors duration-150"
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
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button */}
      <AnimatePresence>
        {selectedFile && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            onClick={handleUpload}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload size={14} />
            Ingest Document
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
