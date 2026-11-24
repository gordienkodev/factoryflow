# factoryflow

## Run the backend

Run these commands from the repository root.

```bash
cd backend
npm ci
npm run dev
```

The API base URL is `http://localhost:3000/api`. Open
<http://localhost:3000/api/health> and verify that it returns `{"status":"ok"}`.
The health endpoint works without a database connection or a generated Prisma Client.

The backend allows requests from `http://localhost:5173` by default. If the
frontend uses a different origin, set `FRONTEND_URL` in `backend/.env`.

### Connect to Neon

Create a local `backend/.env` from
[`backend/.env.example`](backend/.env.example). Ask the database owner for the
project's Neon PostgreSQL connection string and set it as `DATABASE_URL`.
Keep the connection string in your local `backend/.env` and never commit that file.

Once `DATABASE_URL` is set, run this command from the `backend` directory to
generate Prisma Client.

```bash
npx prisma generate --config prisma7.config.ts
```

## Example project structure

This tree shows the intended layout, including the planned frontend, API routes,
and CI workflow.

```text
factoryflow/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       ├── api.ts
│       ├── pages/
│       │   ├── about.ts
│       │   ├── orders.ts
│       │   ├── machines.ts
│       │   ├── schedule.ts
│       │   └── downtimes.ts
│       ├── timeline/
│       │   ├── render.ts
│       │   └── geometry.ts
│       ├── utils/
│       │   └── time.ts
│       └── style.css
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── prisma7.config.ts
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── lib/
│       │   └── prisma.ts
│       ├── routes/
│       │   ├── orders.ts
│       │   ├── machines.ts
│       │   ├── operations.ts
│       │   ├── downtimes.ts
│       │   └── schedule.ts
│       ├── services/
│       │   └── scheduling.ts
│       └── utils/
│           └── hasOverlap.ts
├── docker-compose.yml
├── README.md
└── .github/
    └── workflows/
        └── ci.yml
```
