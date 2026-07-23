# Two hosted Supabase projects (prod + test), still no local DB

Amends ADR 0001. Once real user data exists, developing and running Playwright against the production database is untenable — a leaked test user appears in the live feed. Instead of reversing 0001 into local Docker, we add a second free hosted project, `mipin-test`: local dev and e2e point at it via env vars, production env vars live only in Vercel, and the same checked-in migration history is pushed to both projects by one script so they cannot drift silently.

## Consequences

- Every `db push` goes to both projects via the script; pushing to one by hand reintroduces drift.
- Playwright's global setup uses the test project's service role to create users and mint sessions programmatically — no email round-trips or OAuth dances in tests.
- The browser-injection seam remains for UI-only behavior, but server-enforced flows (auth gate, RLS, deletion) are tested against the real test project.
