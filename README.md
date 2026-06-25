# English Dictionary API

A robust REST API for managing an English dictionary, offering search capabilities, user accounts, search history, and favorite words lists.

## Features

- **Layered Architecture**: Strictly separates concerns across controllers, services, repositories, provider abstractions, and middleware.
- **Robust Caching**: Cache-aside implementation using Redis (24-hour TTL) to minimize external API latency.
- **Asynchronous Processing**: Search history is recorded asynchronously (fire-and-forget) to ensure fast client response times.
- **Resilient Integrations**: Decoupled HTTP dictionary provider (`DictionaryProvider` interface) with timeout control, explicit error mapping, and retry policies.
- **Cursor Pagination**: Supports both offset-based and cursor-based (lexicographical) pagination for scalability.
- **Structured Logging**: JSON logging using `pino` and `pino-pretty` to capture server logs, latency, cache performance, and failures without leaking sensitive credentials.
- **Self-Documented**: Interactive Swagger/OpenAPI documentation at `/docs`.
- **Graceful Shutdown**: Automatically releases DB connections, cache handles, and shuts down Express safely on termination signals.
- **Containerized**: Production-grade multi-stage Docker build and Docker Compose orchestrating API, PostgreSQL, and Redis.

---

## Technology Stack

- **Runtime**: Node.js (LTS 20)
- **Framework**: Express + TypeScript
- **ORM**: Prisma + Prisma Migrate + PostgreSQL
- **Cache**: Redis
- **Logger**: Pino
- **Validator**: Zod
- **Documentation**: Swagger UI Express + OpenAPI 3.0
- **Testing**: Vitest + Supertest

---

## Folder Structure

```text
src/
  app.ts
  server.ts
  config/               # Environment variables Zod schema parser
    env.ts
    swagger.ts          # OpenAPI specification config
  database/             # Prisma client setup
    prisma.ts
  cache/                # Redis connection and functions
    redis.ts
  logger/               # Pino structured logger config
    index.ts
  middlewares/          # Global and authentication middlewares
    auth.middleware.ts
    error.middleware.ts
    response-time.middleware.ts
    validate.middleware.ts
  integrations/         # Decoupled external API providers
    dictionary/
      DictionaryProvider.ts
      FreeDictionaryProvider.ts
  modules/              # Domain modules
    auth/               # Authentication (signup, signin)
    users/              # Profile, user search history, user favorites
    entries/            # Listing, details, favorites/history db operations
  routes/               # Route endpoints mapping mount
    index.ts
  types/                # Global type overrides
    express.d.ts
  utils/                # Error wrappers and utility helpers
    errors.ts
scripts/
  import-dictionary.ts  # Idempotent batch JSON importer
prisma/
  schema.prisma         # Prisma schema and relationship definitions
tests/
  dictionary.test.ts    # Test suite
```

---

## Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP Port for the API server | `3000` |
| `NODE_ENV` | Environment state (`development`, `production`, `test`) | `development` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/dictionary` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Secret token used to sign/verify JWT credentials | *Required* |
| `FREE_DICTIONARY_API_URL` | API base URL for external definitions | `https://api.dictionaryapi.dev/api/v2/entries/en` |

---

## Quick Start (with Docker Compose)

The easiest way to boot the entire stack (PostgreSQL + Redis + API) is using Docker:

1. **Verify ports 3000, 5432, and 6379 are free**.
2. **Build and start services**:
   ```bash
   docker compose up --build -d
   ```
3. **Execute Prisma Migrations inside the API container**:
   ```bash
   docker compose exec api npx prisma migrate deploy
   ```
4. **Seed the database wordlist**:
   ```bash
   docker compose exec api npm run import:dictionary
   ```
5. The API is now live at `http://localhost:3000` and Swagger docs at `http://localhost:3000/docs`.

---

## Local Development Execution

If you prefer to run the Node server outside Docker:

1. **Spin up database and cache services only**:
   ```bash
   docker compose up postgres redis -d
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run migrations to set up PostgreSQL database tables**:
   ```bash
   npx prisma migrate dev
   ```
4. **Seed the wordlist locally**:
   ```bash
   npm run import:dictionary
   ```
5. **Start dev server with live-reloads**:
   ```bash
   npm run dev
   ```

---

## Testing

Run unit and integration tests using Vitest (which automatically mocks database and cache connections):

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## API Endpoints

### Public Paths
- `GET /` - Check system message.
- `GET /health` - Healthcheck endpoint.
- `GET /docs` - Interactive Swagger UI.
- `POST /auth/signup` - Register a new account.
- `POST /auth/signin` - Signin and fetch bearer token.
- `GET /entries/en` - List/Search words (supports query parameters `search`, `limit`, `page`, and `cursor`).

### Authenticated Paths (Header `Authorization: Bearer <token>`)
- `GET /entries/en/:word` - Find definition of a word (returns definition, headers `x-cache` and `x-response-time`).
- `POST /entries/en/:word/favorite` - Add word to favorites.
- `DELETE /entries/en/:word/unfavorite` - Remove word from favorites.
- `GET /user/me` - Profile information.
- `GET /user/me/history` - User search history log.
- `GET /user/me/favorites` - User favorites list.
