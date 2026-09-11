# HelioDesk

HelioDesk is a clean, full-stack customer-support ticketing CRM built for the Datastraw assessment. It supports creating, browsing, live-searching, filtering, viewing, updating, and internally annotating support tickets.

## Stand-out feature: SLA health

The dashboard flags unresolved tickets that have not been updated in 24 hours, making stalled conversations immediately visible. Each ticket detail view clearly marks its SLA health. This is deliberately lightweight: it makes the product more useful for a real support team without adding a brittle notification service.

## Stack

- **Backend:** Node.js built-in HTTP server and PostgreSQL client
- **Database:** Supabase PostgreSQL
- **Frontend:** React 19 with Vite, responsive CSS, and a component-based UI

## Run locally

Requires Node.js 22.5 or newer.

```bash
pnpm install
pnpm build
pnpm start
```

First, create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor. Copy the Transaction pooler connection string from Supabase's Connect panel into a local `.env` file as `DATABASE_URL`, then expose that environment variable when starting the server. Visit `http://localhost:3000`.

For frontend development, use `pnpm dev` (Vite proxies API calls to port 3000) alongside `pnpm dev:api` in a second terminal. To change the API port, copy `.env.example` to `.env` and set `PORT`, then start the app with that environment variable.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/tickets` | Create a ticket |
| GET | `/api/tickets?status=Open&search=maya` | List, filter, or search tickets |
| GET | `/api/tickets/TKT-0001` | View a ticket and its notes |
| PUT | `/api/tickets/TKT-0001` | Update its status and/or add an internal note |

## Design decision

The API connects directly to Supabase PostgreSQL from the server, never from the browser. This keeps database credentials private while keeping Row Level Security enabled.

## Deploy

Deploy as a Node service on Railway, Render, or similar. Set the start command to `npm start` and configure a persistent disk/volume for the `data` directory so tickets survive redeployments.
