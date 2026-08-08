# AI Car Matchmaker

**Amulate Summer Hackathon 2026** — A multistep AI agent that helps users find the right car to rent or buy, with protocol-based generative UI (A2UI) and embedded MCP Apps for forms and mock checkout.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Client App                          │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ A2UI React Renderer │  │ MCP App Container            │  │
│  │ (Catalog & Status)  │  │ (Form & Checkout)            │  │
│  └──────────┬──────────┘  └──────────────┬───────────────┘  │
└─────────────┼────────────────────────────┼──────────────────┘
              │ A2UI JSON Streams          │ MCP UI Events
┌─────────────▼────────────────────────────▼──────────────────┐
│              Agentic Orchestrator Backend                    │
│         State: INTERVIEW → RESEARCH → RECOMMENDATION         │
│                        → CHECKOUT                            │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼────────┐  ┌───────▼──────────────┐
│ Marketplace │  │ MCP Apps Server │  │ OpenTelemetry /      │
│ API (120+   │  │ (Form/Checkout) │  │ Langfuse Trace       │
│ Listings)   │  │                 │  │                      │
└─────────────┘  └─────────────────┘  └──────────────────────┘
```

## Features

- **Multistep Agent State Machine**: `INTERVIEW` → `RESEARCH` → `RECOMMENDATION` → `CHECKOUT`
- **A2UI Protocol**: Streaming declarative JSON for live progress steps and catalog grids
- **MCP Apps**: Interactive preference form and safe mock checkout rendered in-chat
- **Mock Marketplace**: 200 cars across 10 categories × 10 brands (SQLite)
- **Trade-Off Matrix**: Compares top-rated vs best-value options
- **Observability**: OpenTelemetry-style logging + optional Langfuse integration

## Quick Start (Docker Compose)

### Prerequisites

- Docker & Docker Compose
- Anthropic API Key (optional for future LLM enhancements)

### Running the App

```bash
# 1. Clone and enter the project
cd ai-car-matchmaker

# 2. Configure environment variables
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=your_key_here

# 3. Build and launch containers
docker-compose up --build
```

Open **http://localhost:3000** for the frontend and **http://localhost:8000/health** for the backend health check.

### Local Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
ai-car-matchmaker/
├── .cursorrules              # Cursor development guidelines
├── backend/
│   ├── app/
│   │   ├── agent.py          # Multistep agent & state machine
│   │   ├── database.py       # SQLite 120+ car dataset
│   │   ├── main.py           # FastAPI server & /api/chat
│   │   ├── mcp_apps.py       # MCP App schemas (form & checkout)
│   │   └── observability.py  # Langfuse + OTEL tracing
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main UI with A2UI & MCP renderers
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Hackathon Submission Checklist

- [x] Multistep Agent Harness with explicit state machine
- [x] MCP Apps: Preference form + mock checkout in-chat
- [x] A2UI Protocol: Dynamic progress tracker + catalog grid
- [x] 100+ Listing Mock Marketplace (200 cars, 10 categories, 10 brands)
- [x] Full AI Observability hooks (Langfuse + OpenTelemetry logging)
- [x] Containerized Delivery via Docker Compose
- [x] README with setup instructions

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send message/form data to agent |
| GET | `/health` | Health check |
| DELETE | `/api/session/{id}` | Reset agent session |

## License

MIT — Built for Amulate Summer Hackathon 2026.
