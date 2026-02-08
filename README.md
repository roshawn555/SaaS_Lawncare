# SaaS Lawncare

Multi-tenant Lawncare SaaS foundation (Jobber-like) built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + Postgres
- Clerk auth
- Role-based access control (RBAC)
- Zod API validation

## Environment variables

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` Clerk frontend key
- `CLERK_SECRET_KEY` Clerk backend key
- `CLERK_WEBHOOK_SIGNING_SECRET` Clerk webhook signing secret

## Install

```bash
npm install
```

## Prisma migrations

Create the initial migration:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client manually when needed:

```bash
npm run db:generate
```

## Seed data

The seed script creates:

- organization
- owner user + owner membership
- sample customer + property
- sample quote + quote items

Run:

```bash
npm run db:seed
```

## Start development server

```bash
npm run dev
```

Sign-in/up routes:

- `/sign-in`
- `/sign-up`

## App routes

- `/dashboard`
- `/customers`
- `/quotes`
- `/schedule`
- `/invoices`
- `/settings`

## RBAC roles

- `OWNER`
- `DISPATCHER`
- `CREW_LEAD`
- `CREW_TECH`
- `CUSTOMER`

Permission checks are implemented in:

- `lib/rbac.ts`
- `lib/auth.ts`

On first authenticated request in an active Clerk organization:

- app `User` is upserted
- app `Organization` is upserted from Clerk `orgId`
- app `OrgMember` is created if missing

## API routes

- `GET/POST /api/customers`
- `GET/PATCH/DELETE /api/customers/:id`
- `GET/POST /api/quotes`
- `GET /api/quotes/:id`
- `GET /api/visits?start=ISO_DATE&end=ISO_DATE`
- `GET/POST /api/invoices`
- `GET /api/invoices/:id`
- `POST /api/webhooks/clerk`

List endpoints support pagination/filter query params and return a standardized envelope:

- success: `{ ok: true, data, meta? }`
- error: `{ ok: false, error: { code, message, details? } }`

## Tests

```bash
npm run test
```

Included test coverage:

- RBAC unit tests
- Zod validation unit tests
- API smoke tests (mocked auth + prisma)

## CI

GitHub Actions workflow:

- `.github/workflows/ci.yml`

Pipeline runs:

- Prisma validate
- Prisma generate
- lint
- tests
- build

## Deployment

Deployment checklist and production setup steps are documented in:

- `docs/deployment.md`
