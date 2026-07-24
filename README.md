# AI-Powered Customer Complaint Management System

An AI-assisted pharmaceutical QMS complaint intake application built for the AIVOA Round-1 Full Stack Developer Assessment. The project combines a React complaint workspace, a fixed AI copilot chat panel, FastAPI REST endpoints, LangGraph orchestration, Groq-ready extraction, structured validation, document text extraction, risk assessment, and SQLAlchemy persistence for committed complaint records.

---

## Project Overview

This application supports the customer complaint intake workflow used in pharmaceutical quality management systems. A user can paste a raw complaint, upload a complaint document, let the AI pipeline extract structured complaint fields, review and edit the generated form, ask risk-related questions, apply conversational field corrections, and commit the complaint to a QMS ledger-style database record.

The workflow is designed around a copilot experience rather than a static CRUD form. The left side contains the complaint intake form and AI risk assessment. The right side contains the AIVOA Copilot, which streams assistant responses, accepts pasted complaint text, accepts file uploads, and synchronizes AI-generated updates into Redux state.

Implemented complaint flow:

1. Paste complaint text or upload a supported document.
2. FastAPI sends the request into the LangGraph workflow.
3. The workflow detects intent, extracts or corrects fields, validates structured JSON, merges with current complaint state, generates risk assessment, generates a summary, and returns Redux sync metadata.
4. The frontend updates the complaint form, highlights changed fields, updates intake completeness, and displays the AI response in chat.
5. The user reviews the form and commits the complaint to the database through the QMS commit action.

---

## Features

### AI Features

- PDF complaint parsing through backend document extraction.
- DOCX, TXT, EML, and image upload text extraction paths.
- OCR fallback path for image uploads through `pytesseract` when available.
- AI field extraction for complaint source, customer, product, batch, quantity, dates, material impact, category, and description.
- Automatic complaint form population from structured AI output.
- Conversational field correction that patches only detected changed fields.
- AI risk assessment with severity, priority, initial risk, suggested next action, confidence score, reasoning, root-cause recommendation, suggested CAPA text, and suggested investigation text.
- AI severity classification through the risk service.
- AI complaint chat assistant with streaming response events.
- Question-answering branch for risk/severity questions.
- Complaint completeness progress based on required complaint fields.
- Groq integration through `langchain-groq` when `GROQ_API_KEY` is configured.
- Deterministic extraction fallback when no Groq key is configured or the Groq call fails.

### Frontend Features

- React 18 application built with Vite.
- TypeScript frontend.
- Redux Toolkit store with separate `complaint`, `chat`, `upload`, `ai`, and `ui` slices.
- React Router root route for the complaint workspace.
- TailwindCSS styling with shadcn-style local UI primitives.
- React Hook Form and Zod form typing/validation setup.
- Responsive two-panel complaint workspace.
- Fixed AI assistant panel with a fixed header, scrollable conversation area, and fixed input area.
- Independently scrollable complaint form panel.
- Paste complaint workflow through chat prompt suggestions and manual text input.
- Upload button for PDF, DOCX, TXT, EML, PNG, JPG/JPEG, TIFF, and BMP files.
- Upload progress indicator.
- Streaming chat token rendering.
- AI thinking indicator and workflow phase labels.
- Field highlighting after AI extraction or correction.
- Intake completeness progress bar.
- Reset workflow that clears complaint form and risk state.
- Undo workflow for in-session correction history.
- Commit to QMS button that saves the complaint through the backend.
- Auto-dismissing toast notifications with hover pause and manual close.
- Session starts fresh after full page reload; complaint state is not persisted.

### Backend Features

- FastAPI application with versioned `/api/v1` routes.
- SQLAlchemy ORM models and session management.
- Pydantic v2 request and response schemas.
- Repository and service layers for complaint persistence and business logic.
- LangGraph workflow with explicit graph nodes and conditional intent routing.
- In-memory LangGraph checkpointer through `MemorySaver`.
- Groq-ready LLM client using `gemma2-9b-it`.
- Deterministic fallback parser for local/demo operation.
- Document extraction service for PDF, DOCX, TXT, EML, and image files.
- Risk assessment service with severity, priority, confidence, summary, completeness, investigation, root-cause, and CAPA text.
- REST endpoints for chat, upload, complaints, risk, summary, and health checks.
- PostgreSQL-ready configuration through `DATABASE_URL`.
- SQLite fallback when `DATABASE_URL` is not set.
- Pytest tests for API health/risk and LangGraph extraction/correction behavior.

---

## Technology Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Redux Toolkit, React Redux, React Router, TailwindCSS, React Hook Form, Zod, Lucide React |
| Backend | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2, Pydantic Settings |
| AI Workflow | LangGraph, LangChain, LangChain Groq |
| AI Models | `gemma2-9b-it` configured for Groq extraction; `llama-3.3-70b-versatile` is available as an environment variable but is not currently called by the code |
| Document Processing | pdfplumber, python-docx, Pillow, pytesseract |
| Database | PostgreSQL through SQLAlchemy; SQLite local fallback |
| Testing | Pytest, pytest-asyncio, FastAPI TestClient, Vitest |
| DevOps | Docker Compose for local PostgreSQL |

---

## Architecture

```mermaid
flowchart TD
    User["User"] --> React["React Complaint Workspace"]
    React --> Redux["Redux Toolkit Store"]
    Redux --> ChatUI["AIVOA Copilot Panel"]
    ChatUI --> API["FastAPI /api/v1"]
    API --> UploadSvc["DocumentService"]
    API --> Graph["LangGraph ComplaintGraphRunner"]
    Graph --> Intent["Intent Detection"]
    Intent --> Extract["Extraction / Correction / Upload / QA Nodes"]
    Extract --> Validation["Pydantic Structured JSON Validation"]
    Validation --> Merge["Complaint Merge"]
    Merge --> Risk["RiskService Assessment + Summary"]
    Risk --> Response["Structured ChatFinalResponse"]
    Response --> Redux
    Redux --> Form["React Complaint Form"]
    Form --> Commit["Commit to QMS"]
    Commit --> ComplaintAPI["POST /api/v1/complaints"]
    ComplaintAPI --> Repo["ComplaintRepository"]
    Repo --> DB[("PostgreSQL or SQLite")]
    Graph --> Groq["Groq LLM via langchain-groq"]
    Graph --> Fallback["Deterministic fallback extractor"]
```

The backend uses Groq only when `GROQ_API_KEY` is present. Otherwise, extraction falls back to the local heuristic parser so the demo remains runnable without external credentials.

---

## LangGraph Workflow

```mermaid
flowchart TD
    Start["START"] --> A["intent_detection"]
    A --> B{"route_by_intent"}
    B -->|"new_complaint"| C["complaint_extraction"]
    B -->|"correction"| D["correction"]
    B -->|"pdf_upload"| E["ocr_extraction"]
    B -->|"question_answering"| F["question_answering"]
    C --> G["structured_json_validation"]
    D --> G
    E --> G
    F --> G
    G --> H["complaint_merge"]
    H --> I["risk_assessment"]
    I --> J["summary_generator"]
    J --> K["redux_sync"]
    K --> End["END"]
```

Implemented graph node files:

- `backend/app/ai/graph.py`
- `backend/app/ai/nodes.py`
- `backend/app/ai/state.py`
- `backend/app/ai/clients.py`
- `backend/app/ai/heuristics.py`
- `backend/app/ai/prompts.py`

---

## Folder Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── clients.py
│   │   │   ├── graph.py
│   │   │   ├── heuristics.py
│   │   │   ├── nodes.py
│   │   │   ├── prompts.py
│   │   │   └── state.py
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── chat.py
│   │   │       ├── complaints.py
│   │   │       ├── health.py
│   │   │       └── uploads.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── models.py
│   │   │   └── session.py
│   │   ├── repositories/
│   │   │   └── complaint_repository.py
│   │   ├── schemas/
│   │   │   ├── chat.py
│   │   │   └── complaint.py
│   │   ├── services/
│   │   │   ├── complaint_service.py
│   │   │   ├── document_service.py
│   │   │   └── risk_service.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_api.py
│   │   └── test_graph.py
│   ├── .env.example
│   ├── pytest.ini
│   ├── requirements-dev.txt
│   └── requirements.txt
├── docs/
│   └── samples/
│       ├── apollo_complaint.txt
│       └── fictional_pharma_customer_email.eml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Toaster.tsx
│   │   │   └── ui/
│   │   ├── features/
│   │   │   └── complaints/
│   │   │       ├── ComplaintWorkspace.tsx
│   │   │       ├── components/
│   │   │       │   ├── ComplaintFormPanel.tsx
│   │   │       │   └── CopilotPanel.tsx
│   │   │       └── fieldUtils.test.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── schemas/
│   │   │   └── complaintSchema.ts
│   │   ├── store/
│   │   │   ├── hooks.ts
│   │   │   ├── persistence.ts
│   │   │   ├── store.ts
│   │   │   └── slices/
│   │   │       ├── aiSlice.ts
│   │   │       ├── chatSlice.ts
│   │   │       ├── complaintSlice.ts
│   │   │       ├── uiSlice.ts
│   │   │       └── uploadSlice.ts
│   │   ├── types/
│   │   │   └── complaint.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── graphs/
│   └── langgraph_workflow.md
├── prompts/
│   └── complaint_extraction.md
├── docker-compose.yml
└── README.md
```

Generated folders such as `node_modules/`, `frontend/dist/`, `backend/.venv/`, and local runtime files are intentionally excluded from the tree.

---

## Screenshots

Screenshot assets are not included in the repository. Add captured images at the following paths when preparing the GitHub submission.

### Home Screen

![Home](docs/screenshots/home.png)

### AI Complaint Extraction

![AI Complaint Extraction](docs/screenshots/ai-complaint-extraction.png)

### PDF Upload

![PDF Upload](docs/screenshots/pdf-upload.png)

### Risk Assessment

![Risk Assessment](docs/screenshots/risk-assessment.png)

### QMS Commit

![QMS Commit](docs/screenshots/qms-commit.png)

---

## Installation

### Prerequisites

- Python 3.11 or newer.
- Node.js 22 or a current LTS version compatible with Vite 6.
- npm.
- PostgreSQL, or Docker Compose if using the provided PostgreSQL service.
- Optional: Tesseract OCR installed on the system if image OCR is required.

### Clone Repository

Clone the repository from your Git remote and enter the project directory.

```bash
cd AIVOA
```

### Database Setup

The repository includes a PostgreSQL service:

```bash
docker compose up -d postgres
```

This starts PostgreSQL with:

- Database: `aivoa_complaints`
- User: `aivoa`
- Password: `aivoa`
- Port: `5432`

If PostgreSQL is not available, the backend can run with the default SQLite fallback by leaving `DATABASE_URL` unset.

### Backend Setup

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
copy .env.example .env
```

macOS/Linux:

```bash
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
cp .env.example .env
```

Edit `backend/.env` and set `DATABASE_URL`, `GROQ_API_KEY`, and allowed CORS origins for your local ports.

### Frontend Setup

```bash
cd frontend
npm install
```

Windows PowerShell:

```powershell
copy .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Edit `frontend/.env` if the backend is not running at the URL configured in `VITE_API_URL`.

---

## Environment Variables

### Backend

| Variable | Required | Default / Example | Description |
| --- | --- | --- | --- |
| `APP_NAME` | No | `AIVOA Complaint Copilot API` | FastAPI application display name. |
| `API_V1_PREFIX` | No | `/api/v1` | Prefix used when mounting all backend routes. |
| `DATABASE_URL` | No for local SQLite fallback, yes for PostgreSQL mode | `postgresql+psycopg://aivoa:aivoa@localhost:5432/aivoa_complaints` | SQLAlchemy database URL. The code defaults to `sqlite:///./aivoa_demo.db` when unset. |
| `GROQ_API_KEY` | No | Empty string | Enables Groq extraction when set. If missing, the deterministic fallback extractor is used. |
| `GROQ_SMALL_MODEL` | No | `gemma2-9b-it` | Groq model used by `ComplaintLLMClient` for extraction. |
| `GROQ_REASONING_MODEL` | No | `llama-3.3-70b-versatile` | Configured reasoning model value. It is available in settings but not currently called by the code. |
| `CORS_ORIGINS` | No | `["http://localhost:5173","http://127.0.0.1:5173","http://localhost:5174","http://127.0.0.1:5174"]` | JSON array of frontend origins allowed to call the API from a browser. |
| `UPLOAD_DIR` | No | `var/uploads` | Directory used by the backend to store uploaded files before text extraction. |

### Frontend

| Variable | Required | Default / Example | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:8000/api/v1` | API base URL used by the React app. Set this to match the running FastAPI port. |

---

## Running the Project

### Run Backend

From `backend/` with the virtual environment activated:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If port `8000` is already occupied:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Backend URLs:

- API health: `http://127.0.0.1:8000/api/v1/health`
- API docs: `http://127.0.0.1:8000/docs`

Use the same port in `frontend/.env`.

### Run Frontend

From `frontend/`:

```bash
npm run dev
```

If using a specific port:

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

Frontend URL:

- `http://127.0.0.1:5173` by default.
- `http://127.0.0.1:5174` when started with the explicit port above.

---

## API Overview

All routes are mounted under `API_V1_PREFIX`, which defaults to `/api/v1`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Returns backend health status. |
| `POST` | `/api/v1/chat` | Streams NDJSON chat events for complaint extraction, correction, upload branch responses, and risk Q&A. |
| `POST` | `/api/v1/upload` | Accepts an uploaded file, extracts text, runs the upload branch of the graph, and returns structured complaint output. |
| `POST` | `/api/v1/complaints` | Saves a complaint record. |
| `POST` | `/api/v1/complaint` | Alias for saving a complaint record. |
| `GET` | `/api/v1/complaints/{complaint_id}` | Fetches a saved complaint record. |
| `GET` | `/api/v1/complaint/{complaint_id}` | Alias for fetching a saved complaint record. |
| `PUT` | `/api/v1/complaints/{complaint_id}` | Updates an existing complaint record. |
| `PUT` | `/api/v1/complaint/{complaint_id}` | Alias for updating an existing complaint record. |
| `POST` | `/api/v1/risk` | Generates a structured risk assessment from complaint fields. |
| `POST` | `/api/v1/summary` | Generates a structured complaint summary and completeness report from complaint fields. |

### Chat Stream Events

`POST /api/v1/chat` returns `application/x-ndjson` lines with these event types:

- `status`
- `typing`
- `token`
- `final`

The `final` event contains `conversation_id`, `intent`, `assistant_response`, `complaint`, `risk`, `summary`, `updated_fields`, `status`, and `redux_sync`.

---

## AI Workflow

### Paste Complaint Flow

```mermaid
flowchart TD
    A["Paste complaint text"] --> B["POST /api/v1/chat"]
    B --> C["Intent: new_complaint"]
    C --> D["ComplaintLLMClient extraction"]
    D --> E["Pydantic structured validation"]
    E --> F["Merge extracted fields"]
    F --> G["RiskService assessment"]
    G --> H["Summary + completeness"]
    H --> I["NDJSON final event"]
    I --> J["Redux applyAiResult"]
    J --> K["Form auto population + field highlighting"]
```

### Upload Flow

```mermaid
flowchart TD
    A["Upload PDF/DOCX/TXT/EML/Image"] --> B["POST /api/v1/upload"]
    B --> C["DocumentService extracts text"]
    C --> D["Intent: pdf_upload"]
    D --> E["ocr_extraction node"]
    E --> F["Structured field patch"]
    F --> G["Risk assessment"]
    G --> H["Summary + completeness"]
    H --> I["Frontend syncs form and chat"]
```

### Correction Flow

```mermaid
flowchart TD
    A["User sends correction"] --> B["Intent: correction"]
    B --> C["extract_correction_patch"]
    C --> D["Validate patch"]
    D --> E["Merge patch with current complaint"]
    E --> F["Return updated_fields"]
    F --> G["Redux updates only changed fields"]
```

---

## Database

The backend uses SQLAlchemy ORM and creates tables through `Base.metadata.create_all()` during FastAPI startup.

Supported database modes:

- PostgreSQL through `DATABASE_URL`.
- SQLite fallback through `sqlite:///./aivoa_demo.db` when `DATABASE_URL` is unset.

### Main Tables

| Table | Purpose |
| --- | --- |
| `customers` | Stores customer name and source type. |
| `complaints` | Stores complaint intake fields, status, completeness score, duplicate score, timestamps, and customer relationship. |
| `conversations` | Schema exists for conversation memory linked to complaints. |
| `ai_messages` | Schema exists for AI/user messages linked to conversations. |
| `risk_assessments` | Stores risk assessment output for saved complaints. |
| `attachments` | Schema exists for uploaded attachment metadata and extracted text. |
| `audit_logs` | Stores before/after JSON for complaint update operations. |

### Entity Relationships

```mermaid
erDiagram
    CUSTOMERS ||--o{ COMPLAINTS : submits
    COMPLAINTS ||--o{ CONVERSATIONS : has
    CONVERSATIONS ||--o{ AI_MESSAGES : contains
    COMPLAINTS ||--o{ RISK_ASSESSMENTS : receives
    COMPLAINTS ||--o{ ATTACHMENTS : includes
    COMPLAINTS ||--o{ AUDIT_LOGS : records
```

Note: the upload endpoint currently extracts file text and returns the AI result. Attachment rows are modeled but are not inserted by the current upload route.

---

## Design Decisions

### FastAPI

FastAPI provides typed request/response handling, automatic OpenAPI documentation, async upload support, and straightforward dependency injection for SQLAlchemy sessions.

### Redux Toolkit

Redux keeps complaint form state, chat history, AI loading state, upload progress, toast notifications, and undo history explicit and inspectable. This is useful because AI field updates must synchronize predictably into the form.

### LangGraph

LangGraph is used to model the complaint workflow as explicit nodes rather than a single LLM call. The implemented graph separates intent detection, extraction, correction, upload processing, validation, merge, risk assessment, summary generation, and Redux sync.

### PostgreSQL

PostgreSQL is the assignment-target database and is supported through SQLAlchemy and `DATABASE_URL`. The repository includes a Docker Compose PostgreSQL service for local setup.

### SQLite Fallback

SQLite is configured as the default fallback so the demo can run locally without Docker or PostgreSQL. This does not change the SQLAlchemy models or API behavior.

### Groq

Groq support is implemented through `langchain-groq`. The app uses `gemma2-9b-it` for extraction when a Groq API key exists, with a deterministic fallback for offline/local demo usage.

### Fixed AI Panel

The fixed copilot panel keeps the input visible while the complaint form scrolls independently. This matches the intended copilot workflow and prevents the user from losing the message input while reviewing long forms.

### Auto-Dismiss Notifications

Toasts auto-dismiss after four seconds, pause on hover, and remain manually dismissible. This prevents stacked notifications from covering the workspace during repeated AI operations.

### Separate Frontend and Backend

The project separates React UI concerns from FastAPI, LangGraph, document extraction, database, and risk logic. This makes each layer easier to test, replace, and explain during assessment review.

---

## Testing

### Backend

```bash
cd backend
pytest
```

Implemented backend tests cover:

- API health endpoint.
- Risk endpoint returning structured severity and confidence.
- LangGraph new complaint extraction for the demo complaint.
- LangGraph correction behavior that changes only targeted fields.

### Frontend

```bash
cd frontend
npm test
npm run build
```

Implemented frontend test coverage currently verifies the complaint field model includes the required editable complaint fields.

---

## Future Improvements

- Add authentication and reviewer roles.
- Add role-based access control for QA users, supervisors, and administrators.
- Persist conversation records and AI messages through the existing conversation/message tables.
- Insert attachment records from the upload endpoint.
- Add database migrations with Alembic instead of startup-time table creation.
- Add production OCR configuration and deployment instructions for Tesseract.
- Add duplicate complaint detection backed by embeddings or database similarity search.
- Add a dedicated CAPA recommendation workflow and UI.
- Add email inbox integration for complaint intake.
- Add analytics dashboard for complaint trends, risk categories, and closure metrics.
- Add audit-ready export packages for committed complaints.

---

## Assignment Mapping

| Assignment Requirement | Status | Implementation |
| --- | --- | --- |
| React frontend | Done | `frontend/src/` React 18 application. |
| Redux state management | Done | Redux Toolkit store with complaint, chat, upload, AI, and UI slices. |
| FastAPI backend | Done | `backend/app/main.py` and `/api/v1` routes. |
| LangGraph workflow | Done | `backend/app/ai/graph.py` and graph nodes. |
| Groq API integration | Done | `ComplaintLLMClient` uses `langchain-groq` when `GROQ_API_KEY` is set. |
| `gemma2-9b-it` model | Done | Configured as `GROQ_SMALL_MODEL` and used by the Groq extraction client. |
| `llama-3.3-70b-versatile` model | Configured | Available as `GROQ_REASONING_MODEL`; current code does not call it. |
| PostgreSQL | Done | PostgreSQL `DATABASE_URL` and Docker Compose service are provided. |
| PDF parsing | Done | PDF text extraction implemented with `pdfplumber`. |
| DOCX/TXT/EML/image upload handling | Done | Implemented in `DocumentService`. |
| AI complaint assistant | Done | Fixed copilot panel with chat history and streaming events. |
| Paste complaint workflow | Done | Chat input and prompt suggestion call `/chat`. |
| Upload complaint workflow | Done | Upload button calls `/upload`. |
| Automatic form population | Done | `applyAiResult` updates complaint fields from structured response. |
| Conversational correction | Done | Correction intent returns targeted patches and `updated_fields`. |
| Field highlighting | Done | Updated fields animate on the form. |
| Risk assessment | Done | `RiskService.assess()` and `/risk` endpoint. |
| Severity classification | Done | Risk service returns `Critical`, `Major`, or `Moderate`. |
| Suggested next action | Done | Risk service returns `suggested_next_action`. |
| Confidence score | Done | Risk service returns `confidence_score`. |
| Completeness checker | Done | Summary includes completeness score and missing fields. |
| Commit workflow | Done | Frontend saves via `POST /api/v1/complaints`. |
| Reset workflow | Done | Reset button clears complaint and risk state. |
| Undo corrections | Done | In-session undo history stored in complaint slice. |
| Loading indicators | Done | AI thinking indicator, streaming tokens, skeleton risk card, upload progress. |
| README | Done | This file documents actual implementation and setup. |

---

## Author

**Ashwin Jaiswal**

GitHub profile: Not provided in repository metadata.

LinkedIn: Not provided in repository metadata.

