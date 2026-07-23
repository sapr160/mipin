#!/usr/bin/env bash
set -euo pipefail

# scripts/db-push.sh — apply the checked-in migration history to BOTH hosted
# Supabase projects in one shot (ADR 0003), so their histories can't drift. The
# test project (the canary) is pushed first, then production. Each push previews
# the diff before applying (ADR 0001's safety), and the whole run asks for one
# confirmation unless --yes is passed.
#
# Connection strings are OPERATOR credentials — read from the environment, never
# committed, never Vercel app env vars:
#
#   SUPABASE_DB_URL_TEST   connection string for the mipin-test project
#   SUPABASE_DB_URL_PROD   connection string for the production project
#
# Get each from the Supabase dashboard → Project Settings → Database →
# Connection string (percent-encode any special characters in the password).
#
# Usage:
#   npm run db:push            # preview both, confirm once, then apply
#   npm run db:push -- --yes   # skip the confirmation (non-interactive)

ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    -y | --yes) ASSUME_YES=1 ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

require_env() {
  if [ -z "${!1:-}" ]; then
    echo "Missing required env var: $1" >&2
    echo "Set the connection strings for both projects before pushing:" >&2
    echo "  export SUPABASE_DB_URL_TEST=postgres://...   # mipin-test" >&2
    echo "  export SUPABASE_DB_URL_PROD=postgres://...   # production" >&2
    exit 1
  fi
}

require_env SUPABASE_DB_URL_TEST
require_env SUPABASE_DB_URL_PROD

echo "==> Preview: mipin-test"
supabase db push --db-url "$SUPABASE_DB_URL_TEST" --dry-run
echo
echo "==> Preview: production"
supabase db push --db-url "$SUPABASE_DB_URL_PROD" --dry-run
echo

if [ "$ASSUME_YES" -ne 1 ]; then
  printf "Apply these migrations to BOTH projects (mipin-test, then production)? [y/N] "
  read -r reply
  case "$reply" in
    y | Y | yes | YES) ;;
    *)
      echo "Aborted; nothing was applied."
      exit 1
      ;;
  esac
fi

echo "==> Applying: mipin-test (canary)"
supabase db push --db-url "$SUPABASE_DB_URL_TEST" --yes
echo "==> Applying: production"
supabase db push --db-url "$SUPABASE_DB_URL_PROD" --yes
echo "==> Done: both projects are at the same migration head."
