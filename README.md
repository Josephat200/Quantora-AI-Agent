# Quantora AI

Quantora is a focused AI workspace for conversations, documents, and useful next steps.
This Replit project keeps the existing pnpm/TypeScript monorepo and currently runs without
a database. User accounts, conversations, and file metadata are temporary in-memory data;
uploaded bytes are temporary files in `artifacts/api-server/uploads/`.

## Run locally

Install the existing workspace dependencies:

```bash
pnpm install
```

Run the frontend and API with the configured Replit workflows, or run them separately:

```bash
PORT=5000 pnpm --filter @workspace/api-server run dev
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/quantora-frontend run dev
```

The frontend is served at `http://localhost:5173`. The API is served under
`http://localhost:5000/api/v1` when run directly.

## Configuration

Copy `artifacts/api-server/.env.example` to an environment file when running the API
outside Replit. Health, auth, tools, and file validation work without an AI provider.
Chat and agent execution require `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`; when they
are absent the API returns `AI_NOT_CONFIGURED` rather than a fake answer.

## API

- `GET /api/v1/health`
- `GET /api/v1/health/ready`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/chat`
- `GET|DELETE /api/v1/chat/conversations/:id`
- `GET /api/v1/chat/conversations`
- `GET|POST /api/v1/agents`
- `POST /api/v1/agents/run`
- `POST|GET|DELETE /api/v1/files`
- `GET /api/v1/tools`
- `POST /api/v1/tools/calculator`

FastAPI-specific endpoints from the source brief are represented by the equivalent
Express routes already used by this imported project. No database packages, connection
strings, migrations, or tables were added.

## Checks

```bash
pnpm run typecheck
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/quantora-frontend run build
```

The API server exposes the generated OpenAPI-style operational surface through its
route implementation; a future database repository can replace the in-memory stores
without changing the frontend-facing routes.
