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

## API routes

- `GET/POST /api/customers`
- `GET/PATCH/DELETE /api/customers/:id`
- `GET/POST /api/quotes`
- `GET /api/quotes/:id`
- `GET /api/visits?start=ISO_DATE&end=ISO_DATE`
- `GET/POST /api/invoices`
- `GET /api/invoices/:id`
