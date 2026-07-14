# Milestone

Plataforma de gestión de objetivos, proyectos y tiempo.

**Stack:** Next.js 16 + NestJS 11 + Prisma 7 + PostgreSQL + Tailwind CSS 4

## Arquitectura

```
milestone/
├── packages/
│   ├── api/          # Backend REST (NestJS + Prisma)
│   ├── web/          # Frontend (Next.js App Router)
│   └── shared/       # Schemas y tipos compartidos (Zod)
├── turbo.json        # Orquestación de tareas (Turborepo)
└── package.json      # Workspace root (npm workspaces)
```

### Modelo de datos

```
User → LifeArea → Goal → Project → Activity → Event
                                             → TimeSession
```

## Requisitos

- Node.js >= 20
- PostgreSQL >= 15
- npm >= 11

## Instalación

```bash
# Instalar dependencias
npm install

# Generar Prisma Client
npm run prisma:generate --workspace=@milestone/api

# Ejecutar migraciones
npm run prisma:migrate --workspace=@milestone/api

# (Opcional) Poblar base de datos con datos demo
npm run prisma:seed --workspace=@milestone/api
# Demo: demo@milestone.app / demo1234
```

## Desarrollo

```bash
# Iniciar backend (http://localhost:3001)
npm run dev --workspace=@milestone/api

# Iniciar frontend (http://localhost:3000)
npm run dev --workspace=@milestone/web

# O ambos con turbo
npm run dev
```

## Scripts

| Script              | Descripción                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Inicia backend + frontend (turbo) |
| `npm run build`     | Compila todos los paquetes        |
| `npm run lint`      | ESLint en todos los paquetes      |
| `npm run typecheck` | TypeScript type checking          |
| `npm test`          | Ejecuta tests unitarios           |
| `npm run format`    | Formatea código con Prettier      |

## Variables de entorno

Copiar `packages/api/.env.example` → `packages/api/.env` y ajustar:

| Variable       | Descripción                              | Default               |
| -------------- | ---------------------------------------- | --------------------- |
| `DATABASE_URL` | Conexión a PostgreSQL                    | requerida             |
| `JWT_SECRET`   | Secreto para firmar JWTs (mín. 32 chars) | requerida             |
| `PORT`         | Puerto del API                           | 3001                  |
| `CORS_ORIGIN`  | Origen permitido para CORS               | http://localhost:3000 |

Copiar `packages/web/.env.example` → `packages/web/.env`:

| Variable              | Descripción      | Default                   |
| --------------------- | ---------------- | ------------------------- |
| `NEXT_PUBLIC_API_URL` | URL base del API | http://localhost:3001/api |

## API (34 endpoints)

| Módulo       | Endpoints                                                  |
| ------------ | ---------------------------------------------------------- |
| Auth         | POST `/api/auth/register`, `/login`, `/refresh`, `/logout` |
| Usuario      | GET/PATCH `/api/me`                                        |
| LifeAreas    | CRUD `/api/life-areas`                                     |
| Goals        | CRUD `/api/goals`                                          |
| Projects     | CRUD `/api/projects`                                       |
| Activities   | CRUD `/api/activities`                                     |
| Events       | CRUD `/api/events` (paginado)                              |
| TimeSessions | CRUD `/api/time-sessions`                                  |
| Sync         | POST `/api/sync/push`, `/api/sync/pull`                    |
| Health       | GET `/api/health`                                          |

## Deploy

### Docker (recomendado)

Imágenes publicadas en GHCR por `.github/workflows/docker.yml` (`milestone-api`, `milestone-web`).

```bash
# Build local
docker compose -f docker-compose.prod.yml build

# Arranque (requiere POSTGRES_PASSWORD y JWT_SECRET)
POSTGRES_PASSWORD=... JWT_SECRET=... docker compose -f docker-compose.prod.yml up -d
```

Variables clave: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL` (build-arg del frontend).

### Alternativas

- **Backend:** Railway (Nixpacks)
- **Frontend:** Vercel (Next.js standalone)
- **Base de datos:** Supabase / PostgreSQL
