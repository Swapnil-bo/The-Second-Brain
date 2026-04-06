// Description: Graph data hook — fetches full graph snapshot, refreshes after ingestion,
// provides entity filtering by type, and exposes graph stats. All graph state flows
// through BrainContext dispatch.

import { useCallback, useMemo } from 'react'
import { useBrain } from '../context/BrainContext'
import { fetchGraph, fetchGraphStats, fetchEntity, searchEntities } from '../api/client'

export default function useGraph() {
  const { state, dispatch } = useBrain()

  const loadGraph = useCallback(async () => {
    dispatch({ type: 'SET_GRAPH_LOADING' })
    try {
      const res = await fetchGraph()
      const data = res.data
      dispatch({
        type: 'SET_GRAPH',
        payload: {
          nodes: data.nodes || [],
          edges: data.edges || [],
          stats: data.stats || {},
        },
      })
      return data
    } catch (err) {
      dispatch({
        type: 'SET_GRAPH_ERROR',
        payload: err?.response?.data?.detail || err.message || 'Failed to load graph',
      })
      return null
    }
  }, [dispatch])

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetchGraphStats()
      dispatch({ type: 'SET_STATS', payload: res.data })
    } catch {
      // stats refresh is non-critical
    }
  }, [dispatch])

  const getEntity = useCallback(async (name) => {
    try {
      const res = await fetchEntity(name)
      return res.data
    } catch {
      return null
    }
  }, [])

  const search = useCallback(async (query, topK = 5) => {
    try {
      const res = await searchEntities(query, topK)
      return res.data?.results || []
    } catch {
      return []
    }
  }, [])

  const highlightNodes = useCallback(
    (nodeIds) => {
      dispatch({ type: 'HIGHLIGHT_NODES', payload: nodeIds })
    },
    [dispatch]
  )

  const clearHighlights = useCallback(() => {
    dispatch({ type: 'CLEAR_HIGHLIGHTS' })
  }, [dispatch])

  const filterByType = useCallback(
    (type) => {
      if (!type) return state.nodes
      return state.nodes.filter(
        (n) => n.type?.toUpperCase() === type.toUpperCase()
      )
    },
    [state.nodes]
  )

  const stats = useMemo(() => {
    const s = state.stats || {}
    return {
      totalNodes: s.total_nodes || state.nodes.length,
      totalEdges: s.total_edges || state.edges.length,
      types: s.types || {},
    }
  }, [state.stats, state.nodes.length, state.edges.length])

  return {
    nodes: state.nodes,
    edges: state.edges,
    stats,
    loading: state.graphLoading,
    error: state.graphError,
    selectedNode: state.selectedNode,
    highlightedNodes: state.highlightedNodes,
    loadGraph,
    refreshStats,
    getEntity,
    search,
    highlightNodes,
    clearHighlights,
    filterByType,
  }
}
