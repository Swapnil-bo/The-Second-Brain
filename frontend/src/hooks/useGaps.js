// Description: Gap detection hook — triggers POST /api/gaps, parses gap analysis results,
// tracks cache hits, and manages loading state. Provides entity click handler
// for highlighting gap-connected nodes on the graph.

import { useCallback } from 'react'
import { useBrain } from '../context/BrainContext'
import { analyzeGaps } from '../api/client'

export default function useGaps() {
  const { state, dispatch } = useBrain()

  const analyze = useCallback(
    async (focusQuery = null) => {
      dispatch({ type: 'SET_GAP_LOADING', payload: true })

      try {
        const res = await analyzeGaps(focusQuery)
        dispatch({ type: 'SET_GAP_RESULT', payload: res.data })
        return res.data
      } catch (err) {
        dispatch({ type: 'SET_GAP_LOADING', payload: false })
        throw err
      }
    },
    [dispatch]
  )

  const highlightConnectedEntities = useCallback(
    (entityNames) => {
      if (!entityNames?.length) return

      // Find node IDs matching the entity names (case-insensitive)
      const matchedIds = state.nodes
        .filter((n) =>
          entityNames.some(
            (name) => n.name?.toLowerCase() === name?.toLowerCase()
          )
        )
        .map((n) => n.id)

      if (matchedIds.length) {
        dispatch({ type: 'HIGHLIGHT_NODES', payload: matchedIds })
      }
    },
    [state.nodes, dispatch]
  )

  const selectGapEntity = useCallback(
    (name) => {
      dispatch({
        type: 'SELECT_NODE',
        payload: { name, type: 'CONCEPT' },
      })

      // Also highlight on graph if it exists
      const match = state.nodes.find(
        (n) => n.name?.toLowerCase() === name?.toLowerCase()
      )
      if (match) {
        dispatch({ type: 'HIGHLIGHT_NODES', payload: [match.id] })
      }
    },
    [state.nodes, dispatch]
  )

  return {
    result: state.gapResult,
    loading: state.gapLoading,
    gaps: state.gapResult?.gaps || [],
    surprisingConnections: state.gapResult?.surprising_connections || [],
    cacheHit: state.gapResult?.cache_hit || false,
    analyze,
    highlightConnectedEntities,
    selectGapEntity,
  }
}
