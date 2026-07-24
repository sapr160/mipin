import {
  createUser,
  deleteUser,
  expect,
  mintSession,
  seedProfile,
  serviceClient,
  signedInClient,
  skipWithoutLiveAuth,
  test,
} from "./support/auth";
import { PHOTO_BUCKET, profilePhotoPath } from "@/lib/auth/profile-photo";

/**
 * The photo pending-model end to end (issue #36) against the real `mipin-test`
 * project, so the private bucket, the owner-only Storage RLS, the
 * `set_profile_photo` RPC, and the service-role signed-URL render path all run
 * for real. Gated behind RUN_DB_CONNECTIVITY=1 like the other live-DB specs, and
 * requires the profile-photos migration applied to mipin-test (`npm run db:push`).
 *
 * Two halves, because there is no feed/viewer page yet:
 *   - the OWNER's own transitions are driven through the Perfil tab in the browser
 *     (upload → pending badge; approved → no badge; replace → pending; rejected →
 *     placeholder + notice), with `approved`/`rejected` flipped via the service
 *     role, standing in for the Supabase dashboard until the admin panel ships;
 *   - a SECOND athlete's view is asserted at the API/RLS level — they can't read
 *     or sign the object directly (no client read policy), and the same
 *     service-minted signed URL the render path uses does fetch the bytes, which
 *     is exactly what a second athlete sees once the photo is approved.
 */

// A 1×1 transparent PNG — the smallest valid image the bucket accepts.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

function pngUpload(name = "photo.png") {
  return { name, mimeType: "image/png", buffer: PNG };
}

test.describe("profile photo pending model", () => {
  skipWithoutLiveAuth();
  test.use({ locale: "es-DO" });

  test("owner upload → pending badge; approve → no badge; replace → pending; reject → placeholder + notice", async ({
    page,
  }) => {
    const owner = await createUser();
    const svc = serviceClient();
    try {
      await seedProfile(owner.id);
      await mintSession(page, owner);
      await page.goto("/perfil");

      // No photo yet: the neutral placeholder, no image.
      await expect(page.getByTestId("profile-photo-placeholder")).toBeVisible();
      await expect(page.getByTestId("profile-photo")).toHaveCount(0);

      // Upload a photo through the Perfil form (owner's authenticated server
      // client → the owner-write Storage RLS + the set_profile_photo RPC).
      await page.getByTestId("profile-photo-input").setInputFiles(pngUpload());
      await page.getByTestId("profile-photo-submit").click();

      // The owner sees their photo with the "pending" badge.
      await expect(page.getByTestId("profile-photo-saved")).toBeVisible();
      await expect(page.getByTestId("profile-photo")).toBeVisible();
      await expect(page.getByTestId("profile-photo-pending")).toBeVisible();

      // The row records the canonical path and the pending state (only in-app
      // transition). The path MUST be `<uid>/photo`.
      const row = async () =>
        (
          await svc
            .from("profiles")
            .select("photo_path, photo_state")
            .eq("id", owner.id)
            .single()
        ).data;
      await expect.poll(async () => (await row())?.photo_state).toBe("pending");
      expect((await row())?.photo_path).toBe(profilePhotoPath(owner.id));

      // Approve by flipping the state via the service role (the dashboard stand-in).
      await svc
        .from("profiles")
        .update({ photo_state: "approved" })
        .eq("id", owner.id);
      await page.reload();
      await expect(page.getByTestId("profile-photo")).toBeVisible();
      await expect(page.getByTestId("profile-photo-pending")).toHaveCount(0);

      // Replace: overwrites the object and resets to pending (the warned
      // "photo-less until re-approval" behaviour).
      await page
        .getByTestId("profile-photo-input")
        .setInputFiles(pngUpload("replacement.png"));
      await page.getByTestId("profile-photo-submit").click();
      await expect(page.getByTestId("profile-photo-pending")).toBeVisible();
      await expect.poll(async () => (await row())?.photo_state).toBe("pending");

      // Reject via the service role: the owner sees the placeholder again and the
      // generic "try another" notice with the re-upload slot still present.
      await svc
        .from("profiles")
        .update({ photo_state: "rejected" })
        .eq("id", owner.id);
      await page.reload();
      await expect(page.getByTestId("profile-photo-placeholder")).toBeVisible();
      await expect(page.getByTestId("profile-photo-rejected")).toBeVisible();
      await expect(page.getByTestId("profile-photo")).toHaveCount(0);
      await expect(page.getByTestId("profile-photo-input")).toBeVisible();
    } finally {
      await svc.storage.from(PHOTO_BUCKET).remove([profilePhotoPath(owner.id)]);
      await deleteUser(owner.id);
    }
  });

  test("no client can read the object; a second athlete cannot write the owner's path; the service role signs it", async () => {
    const owner = await createUser();
    const other = await createUser();
    const svc = serviceClient();
    const path = profilePhotoPath(owner.id);
    try {
      await seedProfile(owner.id);

      // The app stores the photo via the SERVICE role, with the path bound to the
      // session's user id (this project's Storage API doesn't authenticate
      // end-user JWTs, so client-side writes never apply an owner policy at all).
      const { error: svcUpload } = await svc.storage
        .from(PHOTO_BUCKET)
        .upload(path, PNG, { contentType: "image/png", upsert: true });
      expect(svcUpload).toBeNull();

      // A second athlete cannot write to the owner's path...
      const otherClient = await signedInClient(other);
      const { error: crossWrite } = await otherClient.storage
        .from(PHOTO_BUCKET)
        .upload(path, PNG, { contentType: "image/png", upsert: true });
      expect(crossWrite).not.toBeNull();

      // ...and NO client can read the object directly: with no client SELECT
      // policy, neither downloading nor signing is permitted — not for a second
      // athlete, nor even for the owner. The only read path is the app's
      // service-minted signed URL.
      for (const client of [otherClient, await signedInClient(owner)]) {
        const { data: dl, error: dlErr } = await client.storage
          .from(PHOTO_BUCKET)
          .download(path);
        expect(dl).toBeNull();
        expect(dlErr).not.toBeNull();

        const { error: signErr } = await client.storage
          .from(PHOTO_BUCKET)
          .createSignedUrl(path, 60);
        expect(signErr).not.toBeNull();
      }

      // The render path — a service-role signed URL — does fetch the bytes. This
      // is exactly what a second athlete sees once the photo is approved.
      const { data: signed, error: svcSignErr } = await svc.storage
        .from(PHOTO_BUCKET)
        .createSignedUrl(path, 60);
      expect(svcSignErr).toBeNull();
      expect(signed?.signedUrl).toBeTruthy();
      const res = await fetch(signed!.signedUrl);
      expect(res.ok).toBe(true);
    } finally {
      await svc.storage.from(PHOTO_BUCKET).remove([path]);
      await deleteUser(owner.id);
      await deleteUser(other.id);
    }
  });
});
