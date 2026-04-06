// Description: Ingestion hook — handles file upload, URL scraping, text paste, and queue
// polling. Orchestrates the full ingest cycle: submit → poll status → refresh graph.
// All queue state flows through BrainContext dispatch.

import { useCallback, useEffect, useRef } from 'react'
import { useBrain } from '../context/BrainContext'
import {
  ingestFile,
  ingestURL,
  ingestText,
  fetchIngestStatus,
  deleteSource,
  fetchGraph,
} from '../api/client'

export default function useIngest() {
  const { state, dispatch } = useBrain()
  const pollingRef = useRef(null)

  const refreshGraph = useCallback(async () => {
    try {
      const res = await fetchGraph()
      dispatch({
        type: 'SET_GRAPH',
        payload: {
          nodes: res.data.nodes || [],
          edges: res.data.edges || [],
          stats: res.data.stats || {},
        },
      })
    } catch {
      // graph refresh is non-critical here
    }
  }, [dispatch])

  const uploadFile = useCallback(
    async (file) => {
      const tempId = `temp_${Date.now()}`
      const sourceType = file.name.endsWith('.pdf')
        ? 'pdf'
        : file.name.endsWith('.md') || file.name.endsWith('.markdown')
          ? 'markdown'
          : 'text'

      dispatch({
        type: 'UPDATE_QUEUE_ITEM',
        payload: {
          source_id: tempId,
          source_name: file.name,
          source_type: sourceType,
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
            source_type: res.data?.source_type || sourceType,
            stage: 'done',
            entity_count: res.data?.entity_count || 0,
            relationship_count: res.data?.relationship_count || 0,
          },
        })
        await refreshGraph()
        return res.data
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
        throw err
      }
    },
    [dispatch, refreshGraph]
  )

  const submitURL = useCallback(
    async (url, customName) => {
      const tempId = `temp_${Date.now()}`
      const displayName = customName || url

      dispatch({
        type: 'UPDATE_QUEUE_ITEM',
        payload: {
          source_id: tempId,
          source_name: displayName,
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
            source_name: displayName,
            source_type: 'url',
            stage: 'done',
            entity_count: res.data?.entity_count || 0,
            relationship_count: res.data?.relationship_count || 0,
          },
        })
        await refreshGraph()
        return res.data
      } catch (err) {
        dispatch({
          type: 'UPDATE_QUEUE_ITEM',
          payload: {
            source_id: tempId,
            source_name: displayName,
            stage: 'failed',
            error: err?.response?.data?.detail || 'URL ingestion failed',
          },
        })
        throw err
      }
    },
    [dispatch, refreshGraph]
  )

  const submitText = useCallback(
    async (content, sourceName = 'Pasted Note') => {
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
        return res.data
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
    },
    [dispatch, refreshGraph]
  )

  const removeSource = useCallback(
    async (sourceId) => {
      try {
        await deleteSource(sourceId)
        const updated = state.queue.filter((q) => q.source_id !== sourceId)
        dispatch({ type: 'SET_QUEUE', payload: updated })
        await refreshGraph()
      } catch {
        // deletion failure is non-critical for queue display
      }
    },
    [state.queue, dispatch, refreshGraph]
  )

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetchIngestStatus()
      const items = res.data?.queue || []
      if (items.length) {
        dispatch({ type: 'SET_QUEUE', payload: items })
      }
    } catch {
      // polling failure is silent
    }
  }, [dispatch])

  // Poll ingestion status while items are actively processing
  useEffect(() => {
    const hasActive = state.queue.some(
      (q) => q.stage && q.stage !== 'done' && q.stage !== 'failed'
    )

    if (hasActive && !pollingRef.current) {
      pollingRef.current = setInterval(pollStatus, 3000)
    } else if (!hasActive && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [state.queue, pollStatus])

  return {
    queue: state.queue,
    uploadFile,
    submitURL,
    submitText,
    removeSource,
    pollStatus,
  }
}
