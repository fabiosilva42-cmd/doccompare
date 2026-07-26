# Deploying DocCompare on Dokploy — Step by Step

No Docker knowledge needed. Total time: ~15 minutes.

## What you need first

- Your Dokploy server up and running (Dokploy dashboard accessible)
- This repository pushed to GitHub (branch with the latest code)
- A domain (or subdomain) pointed at your Dokploy server's IP, e.g. `doccompare.yourdomain.com`

## Step 1 — Create the service in Dokploy

1. Dokploy dashboard → **Create Project** (name: `doccompare`)
2. Inside the project → **Create Service** → type **Compose**
3. **Provider:** GitHub → select this repository and the branch to deploy
4. **Compose Path:** `docker-compose.dokploy.yml`

## Step 2 — Set the environment variables

Open the service → **Environment** tab → paste the environment block
(ask the developer for the filled-in values — they are NOT committed to git):

```
DB_PASSWORD=...            # alphanumeric only (it goes inside a URL)
DB_ROOT_PASSWORD=...
APP_ID=sk-...              # Kimi/Moonshot API key (from client)
APP_SECRET=...             # random string, signs the login tokens
APP_URL=https://doccompare.yourdomain.com
RESEND_API_KEY=re_...
MAIL_FROM=DocCompare <management@yourdomain>
MAIL_COPY_ADMINS=true
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=doccompare-uploads
```

## Step 3 — Deploy

Click **Deploy**. The first build takes 5–10 minutes (it compiles the app and
installs the Chromium engine used for PDF reports). Watch the logs — done when
you see `Server running on http://localhost:3000/`.

The database tables are created **automatically** on first boot (from
`db/init.sql`). Nothing manual to run.

## Step 4 — Attach your domain

Service → **Domains** tab → **Add Domain**:

- Host: `doccompare.yourdomain.com`
- Service: `app`
- Container Port: `3000`
- HTTPS: enabled (Let's Encrypt certificate is automatic)

## Step 5 — One-time initialization (2 commands)

Run these once from any terminal (replace the domain and the values):

```bash
# 1. Seed the 3 AI prompts
curl "https://doccompare.yourdomain.com/api/trpc/setup.seed?input=%7B%22json%22%3A%7B%22confirm%22%3A%22doccompare-setup-2025%22%7D%7D"

# 2. Create the admin account (adminKey = the APP_SECRET you set in Step 2)
curl -X POST "https://doccompare.yourdomain.com/api/trpc/auth.register" \
  -H "Content-Type: application/json" \
  -d '{"json":{"name":"Admin","email":"you@email.com","password":"YourStrongPassword1!","adminKey":"<APP_SECRET here>"}}'
```

Log in at your domain with that email/password. Done ✅

## Verifying it's healthy

- `https://yourdomain/api/health` → `{"status":"ok"}`
- `https://yourdomain/api/ready` → `{"status":"ready","db":"ok"}`
- `https://yourdomain/api/health/deep` → also checks the Kimi API

## Updating the app later

Push to the deployed branch → Dokploy → service → **Deploy** (or enable
**Auto Deploy** in the service settings so every push deploys automatically).
Database data survives redeploys (it lives in the `doccompare_mysql` volume).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails with out-of-memory | Server needs ~2 GB free RAM for the build; add swap or build once on a bigger box |
| `/api/ready` says db error | Check `DB_PASSWORD` matches in Environment (used in two places via the same variable) |
| AI analysis returns "insufficient balance" | The Moonshot account needs credit — client action, no code change |
| Emails not arriving | Check `RESEND_API_KEY` and that `MAIL_FROM` uses the verified domain |
