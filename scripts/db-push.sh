#!/usr/bin/env bash
set -euo pipefail

# scripts/db-push.sh — apply the checked-in migration history to BOTH hosted
# Supabase projects in one shot (ADR 0003), so their histories can't drift. The
# test project (the canary) is pushed first, then production. Each push previews
# the diff before applying (ADR 0001's safety), and the whole run asks for one
# confirmation unless --yes is passed.
#
# Connection strings are OPERATOR credentials — never committed, never Vercel app
# env vars (ADR 0003):
#
#   SUPABASE_DB_URL_TEST   connection string for the mipin-test project
#   SUPABASE_DB_URL_PROD   connection string for the production project
#
# Set them once in a gitignored `.env.db` at the repo root (copy `.env.db.example`)
# and this script loads it automatically — no need to export them each run. An
# already-exported value still wins, so `SUPABASE_DB_URL_PROD=… npm run db:push`
# overrides the file for a one-off. Get each from the Supabase dashboard → Project
# Settings → Database → Connection string (percent-encode special chars).
#
# Usage:
#   npm run db:push            # preview both, confirm once, then apply
#   npm run db:push -- --yes   # skip the confirmation (non-interactive)

# Load .env.db (gitignored) if present, without clobbering values already exported.
ENV_DB_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.db"
if [ -f "$ENV_DB_FILE" ]; then
  _env_test="${SUPABASE_DB_URL_TEST:-}"
  _env_prod="${SUPABASE_DB_URL_PROD:-}"
  set -a
  # shellcheck source=/dev/null
  . "$ENV_DB_FILE"
  set +a
  [ -n "$_env_test" ] && SUPABASE_DB_URL_TEST="$_env_test"
  [ -n "$_env_prod" ] && SUPABASE_DB_URL_PROD="$_env_prod"
  unset _env_test _env_prod
fi

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
    echo "Set the connection strings for both projects before pushing. Easiest:" >&2
    echo "  cp .env.db.example .env.db   # then fill in both URLs (gitignored)" >&2
    echo "or export them for a one-off:" >&2
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
