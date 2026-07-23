import { getTranslations } from "next-intl/server";
import { StubPage } from "@/components/StubPage";
import { signOut } from "@/app/actions/auth";

/**
 * The Perfil tab. Full profile management arrives in cluster 3.3; for now it is
 * the coming-soon stub plus the sign-out control (issue #31), whose permanent
 * home is this tab (spec #29). Sign-out is a Server Action form, so it works
 * without client JS.
 */
export default async function PerfilPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="flex flex-1 flex-col">
      <StubPage tab="perfil" />
      <div className="flex justify-center px-6 pb-10">
        <form action={signOut}>
          <button
            type="submit"
            data-testid="sign-out"
            className="rounded-lg border border-zinc-300 px-6 py-2.5 text-base font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
