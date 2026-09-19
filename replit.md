# Quantora AI

Quantora is a focused AI workspace for conversations, documents, and useful next steps.

## Run & Operate

- `pnpm --filter @workspace/quantora-frontend run dev` — run the Vite frontend
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/quantora-frontend run build` — production frontend build
- API defaults: `PORT` is supplied by the workflow, with `FRONTEND_URL=http://localhost:5173`
- Optional AI env: `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + esbuild
- Frontend: React 19 + Vite + TypeScript
- Database: intentionally not connected; the existing `lib/db` package is left untouched
- Authentication: signed bearer tokens and scrypt password hashes

## Where things live

- `artifacts/quantora-frontend/src/App.tsx` — primary workspace UI and user flows
- `artifacts/quantora-frontend/src/services/api.ts` — frontend API client
- `artifacts/api-server/src/routes/` — backend HTTP surface
- `artifacts/api-server/src/services/` — AI and tool logic
- `artifacts/api-server/src/lib/stores.ts` — temporary stores, intentionally not a database
- `artifacts/api-server/.env.example` — backend configuration template

## Architecture decisions

- The imported TypeScript/Express stack is preserved rather than introducing a second Python backend.
- Authentication, conversations, and file metadata are temporary in-memory stores until the database is intentionally added.
- AI responses are never mocked; missing provider configuration returns a clear API error.
- Uploaded files are validated and stored temporarily under the API artifact's `uploads` directory.

## Product

- Landing, sign-in, registration, chat, files, settings, theme switching, and responsive navigation are available.
- Email auth is connected to the API. Google/GitHub buttons explain that provider configuration is not present.
- Chat and agents use an OpenAI-compatible provider when configured.

## User preferences

- Leave the database layer alone until the user explicitly requests database work.

## Gotchas

- Chat and agent execution need `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`; health and auth do not.
- In-memory state is cleared when the API restarts.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
