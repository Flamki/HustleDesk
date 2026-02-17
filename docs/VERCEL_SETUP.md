# Vercel Project Linking and Environment Setup

## 1. Install and Login
```bash
npm i -g vercel
vercel login
```

## 2. Link Local Project
From repository root:
```bash
vercel link
```

This creates local Vercel metadata in `.vercel/` (ignored by git).

## 3. Prepare Environment Variables
Copy template:
```bash
cp templates/vercel/env.production.example env.production.local
```
Fill real values in `env.production.local`.

## 4. Import Environment Variables (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File scripts/vercel/import-env.ps1 -FilePath env.production.local -Environment production
```

Optional:
- `-Environment preview`
- `-Environment development`

## 5. Deploy
```bash
vercel --prod
```

## 6. Verify
- Check deployment logs for build success.
- Confirm `/api/auth/health` with `x-health-token`.
- Confirm `X-RateLimit-Store: upstash` on protected endpoints once Upstash vars are set.
