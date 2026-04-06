// Description: Fixed top bar — app title with brain icon, global search input that triggers
// entity search, backend health status badge, and node/edge stats. Height: 52px.

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Brain, Search, X } from 'lucide-react'
import { useBrain } from '../../context/BrainContext'
import { searchEntities } from '../../api/client'
import StatusBadge from './StatusBadge'

export default function TopBar() {
  const { state, dispatch } = useBrain()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await searchEntities(query.trim())
      setResults(res.data?.results || [])
      if (res.data?.results?.length) {
        const nodeIds = res.data.results.map((r) => r.id)
        dispatch({ type: 'HIGHLIGHT_NODES', payload: nodeIds })
      }
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [query, dispatch])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
    if (e.key === 'Escape') clearSearch()
  }

  const clearSearch = () => {
    setQuery('')
    setResults(null)
    dispatch({ type: 'CLEAR_HIGHLIGHTS' })
  }

  const handleResultClick = (entity) => {
    dispatch({ type: 'SELECT_NODE', payload: entity })
    dispatch({ type: 'HIGHLIGHT_NODES', payload: [entity.id] })
    setResults(null)
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative flex items-center justify-between px-5 flex-shrink-0 z-40"
      style={{
        height: 52,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-dim)',
      }}
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <motion.div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent)',
            boxShadow: '0 0 20px var(--accent-glow)',
          }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Brain size={18} style={{ color: 'var(--accent-bright)' }} />
        </motion.div>
        <div className="flex items-baseline gap-2">
          <h1
            className="text-[15px] font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            SecondBrain
          </h1>
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-dim)',
            }}
          >
            Knowledge Graph
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="relative flex-1 max-w-md mx-8">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-dim)',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search your knowledge graph..."
            className="flex-1 bg-transparent outline-none text-xs"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-primary)',
              caretColor: 'var(--accent-bright)',
            }}
          />
          {query && (
            <button onClick={clearSearch} className="flex-shrink-0">
              <X size={12} style={{ color: 'var(--text-dim)' }} />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {results !== null && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-dim)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {results.length === 0 ? (
              <div
                className="px-3 py-3 text-xs text-center"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-dim)',
                }}
              >
                No entities found for "{query}"
              </div>
            ) : (
              results.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => handleResultClick(entity)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100"
                  style={{ borderBottom: '1px solid var(--border-dim)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ background: `var(--entity-${entity.type?.toLowerCase()})` }}
                  />
                  <span
                    className="text-xs truncate"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {entity.name}
                  </span>
                  <span
                    className="text-[9px] uppercase ml-auto flex-shrink-0"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-dim)',
                    }}
                  >
                    {entity.type}
                  </span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </div>

      {/* Right: Stats + Health */}
      <div className="flex items-center gap-4">
        {state.stats && (
          <div
            className="flex items-center gap-3 text-[11px]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}
          >
            <span>{state.stats.total_nodes || 0} nodes</span>
            <span
              className="w-px h-3"
              style={{ background: 'var(--border-dim)' }}
            />
            <span>{state.stats.total_edges || 0} edges</span>
          </div>
        )}
        <StatusBadge />
      </div>
    </motion.header>
  )
}
