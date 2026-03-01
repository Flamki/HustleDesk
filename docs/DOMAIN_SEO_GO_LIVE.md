# GetSoloDesk Domain + SEO Go-Live Checklist

This checklist is for cutting over `getsolodesk.com` safely on Vercel + Namecheap.

## 1) Vercel domain setup

1. In Vercel Project Settings -> Domains, add:
   - `getsolodesk.com`
   - `www.getsolodesk.com`
2. Set a single primary domain.
   - Recommended by Vercel: use `www` as primary and redirect apex to `www`.
   - Current app config uses apex canonical (`https://getsolodesk.com`) and redirects `www` -> apex in `vercel.json`.
3. Copy the exact DNS values shown by Vercel for your project.

## 2) Namecheap DNS setup (Advanced DNS)

1. Remove conflicting records first:
   - Domain URL Redirect records for `@`/`www` that point elsewhere
   - Old `A`, `CNAME`, `ALIAS` records for same hosts with different targets
2. Add apex record:
   - Type: `A Record`
   - Host: `@`
   - Value: use Vercel-provided apex target from Domains tab
3. Add `www` record:
   - Type: `CNAME Record`
   - Host: `www`
   - Value: use Vercel-provided subdomain target from Domains tab
4. Keep your email records intact:
   - Do not remove MX/TXT records used by Private Email.

## 3) Production environment variables

Set these in Vercel (Production environment):

- `VITE_AUTH_REDIRECT_ORIGIN=https://getsolodesk.com`
- `APP_BASE_URL=https://getsolodesk.com`
- `PUBLIC_APP_URL=https://getsolodesk.com`

If Supabase auth is used:
- Supabase Auth Site URL: `https://getsolodesk.com`
- Add redirect URLs for login/signup callbacks on `getsolodesk.com` and `www.getsolodesk.com` (if `www` stays live).

## 4) SEO validation

1. Confirm canonical host redirect works:
   - `www` should 301/308 to canonical host.
2. Check:
   - `https://getsolodesk.com/robots.txt`
   - `https://getsolodesk.com/sitemap.xml`
3. Submit sitemap in Google Search Console.
4. Run Google Rich Results Test on homepage and key feature pages.

## 5) Smoke tests

Run after DNS propagates:

```bash
nslookup getsolodesk.com
nslookup www.getsolodesk.com
curl -I https://getsolodesk.com
curl -I https://www.getsolodesk.com
curl -I https://getsolodesk.com/sitemap.xml
curl -I https://getsolodesk.com/robots.txt
```

Expected:
- Domain resolves to Vercel targets.
- Canonical redirect works as configured.
- Sitemap and robots return `200`.

