# DocCompare — Simple Setup Guide (no DevOps knowledge needed)

This guide assumes you know nothing about SQL or Docker. That's fine — you never
have to touch either one directly. Everything is copy-paste commands.

## The 3 ways to run the app

### 1. Demo mode (works right now, nothing needed)

```bash
npm install
npm run dev:mock
```

Open http://localhost:3000. No database, no API keys. Log in with any email
containing `admin`, `design`, `cq`, `atendimento` or `supervisor` to switch roles.

### 2. Full app locally (needs Docker Desktop installed once)

Step 1 — start the database (first time only takes a minute to download):

```bash
docker compose up -d db
```

Step 2 — create the tables and seed the AI prompts (first time only):

```bash
npm run db:push
npm run dev
# then in a browser or second terminal, hit this once:
# http://localhost:3000/api/trpc/setup.seed?input=%7B%22json%22%3A%7B%22confirm%22%3A%22doccompare-setup-2025%22%7D%7D
```

Step 3 — from then on, daily development is just:

```bash
docker compose up -d db   # if not already running
npm run dev
```

The AI comparison feature needs the client's Kimi key in `.env`:
replace the value of `APP_ID` with the real `sk-...` key. Everything else
works without it.

### 3. Production deploy (on any Linux VPS with Docker)

```bash
docker compose up -d --build
```

That builds the app image (including Chromium for PDF generation) and starts
app + MySQL together. App listens on port 3000. Data survives restarts in the
`mysql_data` Docker volume.

## FAQ

**Where is the database password?** In `docker-compose.yml` and `.env`. They
already match — change both if you ever rotate it (recommended before real
production, since the old docs leaked them).

**Do I need to install MySQL?** No. Docker runs it. You never open MySQL.

**Do I need to write SQL?** No. The app's code (Drizzle ORM) does all of it.

**What if I don't want Docker locally?** Create a free MySQL database at
TiDB Cloud (Serverless) or Aiven, paste the connection string they give you
into `.env` as `DATABASE_URL`, then `npm run db:push` and `npm run dev`.
