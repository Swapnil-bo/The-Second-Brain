// Description: Axios instance + all API call functions. Every non-SSE endpoint goes
// through this module. SSE chat uses native fetch (see useChat hook).

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// --- Health ---
export const checkHealth = () => api.get('/api/health')

// --- Graph ---
export const fetchGraph = () => api.get('/api/graph')
export const fetchGraphStats = () => api.get('/api/graph/stats')
export const fetchEntity = (name) => api.get(`/api/graph/entity/${encodeURIComponent(name)}`)
export const searchEntities = (query, topK = 5) =>
  api.post('/api/graph/search', { query, top_k: topK })

// --- Ingestion ---
export const ingestFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/ingest/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
}

export const ingestURL = (url, customName = null) =>
  api.post('/api/ingest/url', { url, custom_name: customName })

export const ingestText = (content, sourceName = 'Pasted Note') =>
  api.post('/api/ingest/text', { content, source_name: sourceName })

export const fetchIngestStatus = () => api.get('/api/ingest/status')
export const deleteSource = (sourceId) => api.delete(`/api/ingest/${sourceId}`)

// --- Gaps ---
export const analyzeGaps = (focusQuery = null) =>
  api.post('/api/gaps', { focus_query: focusQuery })

// --- Chat (SSE URL — used by useChat with native fetch) ---
export const CHAT_URL = `${API_URL}/api/chat`

export default api
