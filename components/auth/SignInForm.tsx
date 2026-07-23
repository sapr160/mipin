"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AUTH_CALLBACK_PATH } from "@/lib/auth/routes";

/**
 * The two sign-in methods, both redirecting to the one callback handler
 * (issue #31): Google OAuth as the primary button and an email magic link as
 * the fallback.
 *
 * Google may be non-functional until the operator wires the Supabase provider;
 * the click still issues the correct `signInWithOAuth` call and simply no-ops if
 * the provider errors.
 *
 * The magic-link form flips to a generic "check your email" state as soon as the
 * request is fired, regardless of its result. That is deliberate: it avoids
 * revealing whether an address has an account (no user enumeration) and it makes
 * the confirmation state assertable in e2e without receiving — or even sending —
 * real email (AC: the magic-link e2e must not depend on real email).
 */
export function SignInForm() {
  const t = useTranslations("SignIn");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  /** Absolute callback URL; both methods must return to the same handler. */
  function callbackUrl() {
    return `${window.location.origin}${AUTH_CALLBACK_PATH}`;
  }

  function signInWithGoogle() {
    startTransition(async () => {
      try {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: callbackUrl() },
        });
      } catch {
        // Provider may be unconfigured until the operator ticket — no-op.
      }
    });
  }

  function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const supabase = createClient();
        await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: callbackUrl() },
        });
      } catch {
        // Swallow: the confirmation is intentionally generic and independent of
        // the send result (anti-enumeration; no email dependency in tests).
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div
        data-testid="magic-link-sent"
        className="flex w-full max-w-sm flex-col gap-2 rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800"
      >
        <h2 className="text-lg font-semibold">{t("checkEmailTitle")}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("checkEmailBody", { email })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {/* Primary: Google. */}
      <button
        type="button"
        data-testid="google-signin"
        onClick={signInWithGoogle}
        disabled={isPending}
        className="rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {t("google")}
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        {t("or")}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Fallback: email magic link. */}
      <form onSubmit={sendMagicLink} className="flex flex-col gap-2 text-left">
        <label htmlFor="email" className="text-sm font-medium">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-transparent dark:focus:border-zinc-100"
        />
        <button
          type="submit"
          data-testid="magic-link-submit"
          disabled={isPending}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-base font-medium transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {t("magicLink")}
        </button>
      </form>
    </div>
  );
}
