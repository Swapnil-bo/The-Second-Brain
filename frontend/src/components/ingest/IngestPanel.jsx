// Description: Right-side overlay panel for document ingestion. Three tabs: File, URL, Paste.
// Slides in from right as 380px overlay drawer. Framer Motion panel entrance.
// Orchestrates file upload, URL scrape, and text paste through API client.

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Globe, AlignLeft } from 'lucide-react'
import { useBrain } from '../../context/BrainContext'
import { ingestFile, ingestURL, ingestText, fetchGraph } from '../../api/client'
import FileDropzone from './FileDropzone'
import URLIngestor from './URLIngestor'
import TextPaste from './TextPaste'
import IngestQueue from './IngestQueue'

const tabs = [
  { id: 'file', label: 'File', icon: Upload },
  { id: 'url', label: 'URL', icon: Globe },
  { id: 'paste', label: 'Paste', icon: AlignLeft },
]

export default function IngestPanel() {
  const { dispatch, closePanel } = useBrain()
  const [activeTab, setActiveTab] = useState('file')

  const refreshGraph = useCallback(async () => {
    try {
      const res = await fetchGraph()
      dispatch({
        type: 'SET_GRAPH',
        payload: {
          nodes: res.data.nodes,
          edges: res.data.edges,
          stats: res.data.stats,
        },
      })
    } catch {
      // silently fail
    }
  }, [dispatch])

  const handleFileUpload = useCallback(async (file) => {
    const tempId = `temp_${Date.now()}`
    dispatch({
      type: 'UPDATE_QUEUE_ITEM',
      payload: {
        source_id: tempId,
        source_name: file.name,
        source_type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.md') || file.name.endsWith('.markdown') ? 'markdown' : 'text',
        stage: 'parsing',
      },
    })

    try {
      const res = await ingestFile(file)
      dispatch({
        type: 'UPDATE_QUEUE_ITEM',
        payload: {
          source_id: res.data?.source_id || tempId,
          source_name: file.name,
          source_type: res.data?.source_type || 'text',
          stage: 'done',
          entity_count: res.data?.entity_count || 0,
          relationship_count: res.data?.relationship_count || 0,
        },
      })
      await refreshGraph()
    } catch (err) {
      dispatch({
        type: 'UPDATE_QUEUE_ITEM',
        payload: {
          source_id: tempId,
          source_name: file.name,
          stage: 'failed',
          error: err?.response?.data?.detail || 'Upload failed',
        },
      })
    }
  }, [dispatch, refreshGraph])

  const handleURLSubmit = useCallback(async (url, customName) => {
    const tempId = `temp_${Date.now()}`
    dispatch({
      type: 'UPDATE_QUEUE_ITEM',
      payload: {
        source_id: tempId,
        source_name: customName || url,
        source_type: 'url',
        stage: 'parsing',
      },
    })

    try {
      const res = await ingestURL(url, customName)
      dispatch({
        type: 'UPDATE_QUEUE_ITEM',
        payload: {
          source_id: res.data?.source_id || tempId,
          source_name: customName || url,
          source_type: 'url',
          stage: 'done',
          entity_count: res.data?.entity_count || 0,
          relationship_count: res.data?.relationship_count || 0,
        },
      })
      await refreshGraph()
    } catch (err) {
      dispatch({
        type: 'UPDATE_QUEUE_ITEM',
        payload: {
          source_id: tempId,
          source_name: customName || url,
          stage: 'failed',
          error: err?.response?.data?.detail || 'URL ingestion failed',
        },
      })
      throw err
    }
  }, [dispatch, refreshGraph])

  const handleTextSubmit = useCallback(async (content, sourceName) => {
    const tempId = `temp_${Date.now()}`
    dispatch({
      type: 'UPDATE_QUEUE_ITEM',
      payload: {
        source_id: tempId,
        source_name: sourceName,
        source_type: 'text',
        stage: 'parsing',
      },
    })

    try {
      const res = await ingestText(content, sourceName)
      dispatch({
        type: 'UPDATE_QUEUE_ITEM',
        payload: {
          source_id: res.data?.source_id || tempId,
          source_name: sourceName,
          source_type: 'text',
          stage: 'done',
          entity_count: res.data?.entity_count || 0,
          relationship_count: res.data?.relationship_count || 0,
        },
      })
      await refreshGraph()
    } catch (err) {
      dispatch({
        type: 'UPDATE_QUEUE_ITEM',
        payload: {
          source_id: tempId,
          source_name: sourceName,
          stage: 'failed',
          error: err?.response?.data?.detail || 'Text ingestion failed',
        },
      })
      throw err
    }
  }, [dispatch, refreshGraph])

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="panel-overlay"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-dim)' }}
      >
        <h2
          className="text-sm font-semibold"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
          }}
        >
          Ingest Knowledge
        </h2>
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

      {/* Tabs */}
      <div
        className="flex items-center gap-1 px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-dim)' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                fontFamily: 'var(--font-display)',
                color: isActive ? 'var(--accent-bright)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
              }}
            >
              <Icon size={13} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="ingest-tab"
                  className="absolute bottom-0 left-2 right-2 h-px"
                  style={{ background: 'var(--accent-bright)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === 'file' && <FileDropzone onUpload={handleFileUpload} />}
        {activeTab === 'url' && <URLIngestor onSubmit={handleURLSubmit} />}
        {activeTab === 'paste' && <TextPaste onSubmit={handleTextSubmit} />}

        <IngestQueue />
      </div>
    </motion.div>
  )
}
