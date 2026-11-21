# factoryflow


factoryflow/
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       ├── api.ts
│       │
│       ├── pages/
│       │   ├── about.ts
│       │   ├── orders.ts
│       │   ├── machines.ts
│       │   ├── schedule.ts
│       │   └── downtimes.ts
│       │
│       ├── timeline/
│       │   ├── render.ts
│       │   └── geometry.ts
│       │
│       ├── utils/
│       │   └── time.ts
│       │
│       └── style.css
│
├── backend/
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── src/
│       ├── server.ts
│       ├── prisma.ts
│       │
│       ├── routes/
│       │   ├── orders.ts
│       │   ├── machines.ts
│       │   ├── operations.ts
│       │   ├── downtimes.ts
│       │   └── schedule.ts
│       │
│       ├── services/
│       │   └── scheduling.ts
│       │
│       └── utils/
│           └── hasOverlap.ts
│
├── docker-compose.yml
├── README.md
└── .github/
    └── workflows/
        └── ci.yml


