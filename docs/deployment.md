# Deployment Guide

## 1. Provision managed Postgres

Choose a managed provider (Neon, Supabase, RDS, Railway, etc.) and create a
database for production.

Required output:

- production connection string (SSL-enabled)

Set in Vercel:

- `DATABASE_URL=postgresql://...`

## 2. Configure Clerk production app

In Clerk:

1. Create or select your production instance.
2. Enable Organizations.
3. Create production API keys.
4. Configure allowed redirect URLs for your production domain.

Set in Vercel:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## 3. Configure Clerk webhook

Create a Clerk webhook endpoint:

- URL: `https://<your-domain>/api/webhooks/clerk`

Subscribe to:

- `user.created`
- `user.updated`
- `organization.created`
- `organization.updated`
- `organization.deleted`
- `organizationMembership.created`
- `organizationMembership.updated`
- `organizationMembership.deleted`

Set in Vercel:

- `CLERK_WEBHOOK_SIGNING_SECRET`

## 4. Create Vercel project

From repo root:

```bash
vercel
```

Attach project to this repo and set environment variables above for Production
(and Preview if desired).

## 5. Run migrations in deployment flow

Apply migrations in production:

```bash
npx prisma migrate deploy
```

Recommended:

- run `npx prisma migrate deploy` in CI/CD after each deploy
- run `npx prisma generate` during build

## 6. Verify after deploy

Checklist:

- sign-in and sign-up routes work
- active organization is required for app routes
- first login creates `User` and `OrgMember`
- customer/quote/invoice/schedule pages load API data
- Clerk webhook returns `200` and records sync correctly
