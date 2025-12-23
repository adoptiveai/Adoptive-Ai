# PolyRAG Next.js Client

A Next.js front end that mirrors the Streamlit experience for PolyRAG. It provides authentication, conversation management, file uploads, PDF inspection with annotations, SQL and graph tooling, plus feedback capture – all backed by the existing agent service.

## Prerequisites

- Node.js 20+
- Access to the PolyRAG API (default `http://localhost:8080`)
- PostgreSQL credentials if authentication is enabled (`DATABASE_URL`, optional `EMAIL_DOMAIN`)
- Optional SendGrid credentials for automatic password e-mails (`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`)

## Environment variables

Create `next-frontend/.env.local` and set the values you need:

```bash
NEXT_PUBLIC_AGENT_URL=http://localhost:8080
# Allow bypassing auth (mirrors NO_AUTH in Streamlit)
NEXT_PUBLIC_NO_AUTH=false
# Optional defaults
NEXT_PUBLIC_DEFAULT_AGENT=pg_rag_assistant

# Required when NO_AUTH=false
DATABASE_URL=postgresql://user:pass@host:5432/dbname
EMAIL_DOMAIN=@example.com          # optional domain guard for new accounts
SENDGRID_API_KEY=...               # optional
SENDGRID_FROM_EMAIL=...            # optional
```

## Install & run

```bash
cd next-frontend
npm install
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Useful scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm run start` – run the compiled app
- `npm run lint` – TypeScript/ESLint checks (already passing)

## Major features

- **Authentication** – login, self-service registration, password resets (or bypass with `NEXT_PUBLIC_NO_AUTH=true`).
- **Conversation workspace** – create, rename, delete conversations; persists titles via the agent API.
- **Streaming chat** – live responses, tool call status messages, automatic rendering for SQL, graphs (Plotly) and PDF viewers.
- **File uploads** – multiple attachments per message, stored through the agent upload endpoint.
- **PDF viewer** – opens documents returned by the agent, fetches annotations for highlighted blocks.
- **Feedback** – star rating and free-form comments recorded through the `/feedback` endpoint.
- **Global pages** – top navigation for the chat, feedback form, and profile/logout.

## Notes

- The PDF route (`/api/pdf/file`) reads files from disk; paths outside the repository root are rejected.
- Graph rendering expects the agent to return Plotly JSON via `/graph/{graph_id}`.
- SQL tool output should match the semicolon-delimited format produced by the Streamlit app.

## Testing

Run `npm run lint` to verify lint and type checks (already executed during implementation).
