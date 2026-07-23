This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database migrations

Schema lives as checked-in SQL in `supabase/migrations/`, applied directly to
the **two hosted Supabase projects** — `mipin-test` (dev/e2e) and production —
with no local Docker DB (ADRs 0001, 0003).

**Create a migration** (hand-write the SQL into the generated file):

```bash
supabase migration new <name>
```

**Apply it to both projects** with the dual-push script — the only supported way
to push, so the two projects can't drift:

```bash
# Connection strings are operator credentials — set them in your shell, never
# commit them (get each from Supabase → Project Settings → Database).
export SUPABASE_DB_URL_TEST="postgres://...supabase.co:5432/postgres"   # mipin-test
export SUPABASE_DB_URL_PROD="postgres://...supabase.co:5432/postgres"   # production

npm run db:push            # previews both, asks once, then applies test → prod
npm run db:push -- --yes   # non-interactive (skips the confirmation)
```

The script pushes to `mipin-test` first (the canary), then production, and never
edits an already-pushed migration (migrations are append-only, ADR 0001).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
