# Locale lives in a cookie, not the URL

mipin is bilingual (ES default / EN) but its URLs carry no locale: there is no `/es`/`/en` prefix and one canonical URL serves both languages. next-intl runs in "without i18n routing" mode, reading the locale from a cookie that is set from `Accept-Language` on first visit and overwritten by the header toggle. We chose this because the QR code encodes the bare root URL and share messages must stay short and forwardable as-is, while SEO — the main argument for locale-prefixed routes — is irrelevant for a two-week closed-community app.

## Consequences

- The locale cookie replaces localStorage as the client-side persistence of the language choice (a cookie is needed for server rendering anyway); the "copy to profile row on sign-in" step from the onboarding decision (#5) is unchanged.
- Legal and app pages get exactly one slug (in Spanish: `/terminos`, `/privacidad`, `/encuentros-seguros`); the page picks its language at render time.
- If per-language URLs are ever wanted post-Games, next-intl's routing mode is an incremental migration, not a rewrite.
