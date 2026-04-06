# SecondBrain

**Personal Knowledge Graph Engine** — Drop in notes, PDFs, bookmarks. Get a living map of your mind.

Built by **Swapnil Hazra** | BWU/BTA/23/568

---

## What Is This?

SecondBrain turns scattered knowledge artifacts into a **living, queryable knowledge graph**. You drop in markdown notes, PDFs, URLs, and plain text — the system extracts entities, discovers relationships, and builds a visual graph you can explore, query, and reason over.

**This is not a note-taking app.** It's an insight engine that tells you not just what you know, but what you *don't* know and how to fill it.

---

## Core Features

### Live Knowledge Graph
Interactive graph visualization powered by React Flow. Entities are color-coded by type (concepts, people, technologies, books, organizations, events). Edges show relationships with confidence scores. Drag, zoom, pan, filter — the graph is the hero.

### Multi-Format Ingestion
Drop in `.pdf`, `.md`, `.txt` files, paste raw text, or scrape any URL. The ingestion pipeline extracts text, chunks it, embeds it, and runs LLM-powered entity/relationship extraction — all in one flow.

### Semantic Chat
Conversational interface that searches your knowledge base via vector similarity, enriches with graph context, and streams responses token-by-token via SSE. Cite your own notes. Ask "What do I know about X?" and get answers grounded in your artifacts.

### Gap Detection Engine
The killer feature. An LLM reasons over your entire knowledge graph topology to identify what's *conspicuously absent* — concepts closely related to what you know but missing from your graph. Returns prioritized gaps with curated 4-step learning paths.

### Surprising Connections
Discovers non-obvious relationships between things you already know but hadn't connected. "Your note on Hebbian learning connects to your bookmark on backprop" — that kind of synthesis.

---

## Architecture

```
                    +-------------------+
                    |   React Frontend  |
                    |   (Vite + Flow)   |
                    +--------+----------+
                             |
                        HTTP / SSE
                             |
                    +--------v----------+
                    |   FastAPI Backend  |
                    +--------+----------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v---+  +------v------+  +----v--------+
     |  ChromaDB   |  |   Groq API  |  |  sentence-  |
     | (3 colls)   |  | (2 models)  |  | transformers|
     +-------------+  +-------------+  +-------------+
       - chunks          - 8b: extract     - all-MiniLM
       - entities        - 70b: chat/gaps  - local, free
       - relationships
              |
     +--------v---------+
     | networkx DiGraph  |
     | (in-memory graph) |
     +-------------------+
```

### Two-Tier LLM Strategy

| Task | Model | Why |
|---|---|---|
| Entity/relationship extraction | `llama-3.1-8b-instant` | Structured JSON output, fast, cheap — stays within free tier for bulk processing |
| Chat responses + gap detection | `llama-3.3-70b-versatile` | Genuine reasoning required — reserved for quality-critical tasks |

This cuts extraction token cost by ~85% compared to using 70b for everything.

### Three ChromaDB Collections

| Collection | Purpose |
|---|---|
| `knowledge_chunks` | Raw text chunks with embeddings for semantic search |
| `knowledge_entities` | Deduplicated entity nodes with metadata |
| `knowledge_relationships` | Persisted graph edges — survives server restarts |

The relationship collection is critical. Without it, the networkx graph loses all edges on restart. Edges are first-class citizens in this data model.

---

## Tech Stack

### Backend
- **Python 3.11+** with **FastAPI** `0.115.0`
- **ChromaDB** `0.5.23` — persistent local vector database
- **Groq API** — LLM inference (free tier compatible)
- **sentence-transformers** `3.3.1` — `all-MiniLM-L6-v2` for local embeddings
- **networkx** `3.4.2` — in-memory graph with startup rebuild from ChromaDB
- **PyMuPDF** for PDF parsing, **httpx + BeautifulSoup4** for URL scraping
- **LangChain text splitters** for chunking

### Frontend
- **React 18** + **Vite** `5.4.10`
- **@xyflow/react** `12.3.5` — graph visualization
- **@dagrejs/dagre** `1.1.4` — automatic graph layout
- **Tailwind CSS** `3.4.14` + CSS custom properties (Neural Dark theme)
- **Framer Motion** `11.11.17` — animations
- **react-markdown** `9.0.1` — chat message rendering

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### Backend Setup

```cmd
cd backend
pip install -r requirements.txt
```

Create `backend/.env` from the template:
```cmd
copy .env.example .env
```

Add your Groq API key to `.env`:
```
GROQ_API_KEY=gsk_your_key_here
```

Start the backend:
```cmd
uvicorn main:app --reload --port 8000
```

> First run downloads the `all-MiniLM-L6-v2` embedding model (~80MB). This is a one-time download cached in `~/.cache/huggingface/`.

### Frontend Setup

```cmd
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Design Language: Neural Dark

The UI follows a "deep space observatory meets hacker's second brain" aesthetic. Dark, dense, information-rich. The graph is the hero — everything else is scaffolding.

- **Color palette**: Near-black backgrounds (`#050508`), electric violet accents (`#7c3aed`), entity-type color coding
- **Typography**: Syne (display), Instrument Sans (body), JetBrains Mono (data)
- **Motion**: Spring animations on graph nodes, animated edge strokes, panel slide-ins, pulsing glow effects
- **Layout**: 240px sidebar, full-screen graph canvas, 380px overlay drawers for panels

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingest/file` | Upload PDF, MD, or TXT file |
| `POST` | `/api/ingest/url` | Scrape and ingest a URL |
| `POST` | `/api/ingest/text` | Ingest raw pasted text |
| `GET` | `/api/ingest/status` | Current ingestion queue status |
| `DELETE` | `/api/ingest/{source_id}` | Remove a source + entities + edges |
| `GET` | `/api/graph` | Full graph snapshot (nodes + edges) |
| `GET` | `/api/graph/stats` | Entity counts by type |
| `GET` | `/api/graph/entity/{name}` | Single entity + neighbors |
| `POST` | `/api/graph/search` | Semantic entity search |
| `POST` | `/api/chat` | Conversational query (SSE streaming) |
| `POST` | `/api/gaps` | Gap detection with cache |
| `GET` | `/api/health` | Backend health + ChromaDB status |

---

## Project Structure

```
secondbrain/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, startup event
│   ├── config.py                # Env vars, constants, model names
│   ├── requirements.txt         # Pinned Python dependencies
│   ├── .env.example             # Safe environment template
│   ├── routers/
│   │   ├── ingest.py            # Ingestion endpoints
│   │   ├── query.py             # Chat SSE streaming endpoint
│   │   ├── graph.py             # Graph data endpoints
│   │   └── gaps.py              # Gap detection endpoint
│   ├── services/
│   │   ├── extractor.py         # LLM entity + relationship extraction
│   │   ├── embedder.py          # sentence-transformers singleton
│   │   ├── chroma_service.py    # ChromaDB CRUD (3 collections)
│   │   ├── graph_service.py     # networkx graph + startup rebuild
│   │   ├── ingestor.py          # 10-step ingestion pipeline
│   │   ├── pdf_parser.py        # PyMuPDF PDF extraction
│   │   ├── url_scraper.py       # httpx + BS4 URL scraping
│   │   └── gap_detector.py      # Gap detection + cache
│   └── models/
│       ├── schemas.py           # Pydantic request/response models
│       └── graph_models.py      # Entity, Relationship models
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json             # Pinned versions
│   └── src/
│       ├── main.jsx             # Entry point
│       ├── App.jsx              # Root with BrainProvider + panels
│       ├── context/
│       │   └── BrainContext.jsx  # Global state (useReducer + Context)
│       ├── api/
│       │   └── client.js        # Axios instance + API functions
│       ├── hooks/
│       │   ├── useGraph.js      # Graph fetch, refresh, filter
│       │   ├── useIngest.js     # File upload, queue polling
│       │   ├── useChat.js       # SSE stream reader (native fetch)
│       │   └── useGaps.js       # Gap detection + cache check
│       ├── components/
│       │   ├── graph/           # KnowledgeGraph, EntityNode, edges
│       │   ├── layout/          # TopBar, Sidebar, StatusBadge
│       │   ├── ingest/          # FileDropzone, URLIngestor, TextPaste
│       │   ├── chat/            # ChatPanel, ChatMessage, SSE consumer
│       │   ├── gaps/            # GapPanel, GapCard, LearningPath
│       │   └── shared/          # LoadingSpinner, EmptyState, ErrorBoundary
│       ├── utils/
│       │   ├── graphLayout.js   # @dagrejs/dagre layout
│       │   ├── entityColors.js  # Entity type color mapping
│       │   └── formatters.js    # Time, confidence, token formatters
│       └── styles/
│           └── globals.css      # Tailwind + Neural Dark variables
│
├── .gitignore
└── README.md
```

---

## Key Design Decisions

**Why ChromaDB for relationships?**
An in-memory networkx graph doesn't survive server restarts. Persisting edges in a dedicated ChromaDB collection with a startup rebuild event ensures the graph is always consistent. No external database needed.

**Why two LLM models?**
Groq's free tier is ~6000 TPM on 70b. A 20-page PDF generates 40+ extraction calls. Using `llama-3.1-8b-instant` for structured JSON extraction keeps costs down. `llama-3.3-70b-versatile` is reserved for tasks requiring genuine reasoning.

**Why SSE for chat?**
Token-by-token streaming gives instant feedback. The backend yields events via FastAPI `StreamingResponse`, the frontend consumes with native `fetch` + `ReadableStream`. No WebSocket overhead, no polling.

**Why local embeddings?**
`all-MiniLM-L6-v2` runs entirely on CPU with no API cost. 384-dim vectors are compact and fast. No data leaves the machine for embedding.

---

## Performance Targets

| Metric | Target |
|---|---|
| File ingest (1-page PDF) | < 8s end-to-end |
| Graph load (100 nodes) | < 500ms |
| Chat first token (SSE) | < 1.5s |
| Gap detection (cold) | < 10s |
| Gap detection (cache hit) | < 50ms |
| Server restart + graph rebuild | < 3s (1000 entities) |

---

## License

MIT

---

*Built with obsession. One file at a time.*
