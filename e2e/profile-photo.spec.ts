import { expect, test } from "@playwright/test";
import {
  photoDisposition,
  profilePhotoPath,
  photoPlaceholder,
  validatePhotoUpload,
  PHOTO_BUCKET,
  MAX_PHOTO_BYTES,
  ALLOWED_PHOTO_TYPES,
} from "@/lib/auth/profile-photo";

/**
 * The photo pending-model's pure logic (issue #36), asserted directly like
 * profile-edit.spec.ts — no page, no database, no Storage. This is the source of
 * truth for the render decision (owner sees pending/approved, everyone else only
 * approved), the upload validation, and the storage path scheme. The signed-URL
 * helper, the RLS, and the upload flow are exercised by the live e2e; every
 * decision those make about *what* to render funnels through `photoDisposition`
 * here.
 */

test.describe("photoDisposition", () => {
  test("shows an approved photo to everyone, no pending badge", () => {
    expect(photoDisposition("approved", true)).toEqual({
      render: "photo",
      pending: false,
    });
    expect(photoDisposition("approved", false)).toEqual({
      render: "photo",
      pending: false,
    });
  });

  test("shows a pending photo to its owner with the badge, placeholder to others", () => {
    expect(photoDisposition("pending", true)).toEqual({
      render: "photo",
      pending: true,
    });
    expect(photoDisposition("pending", false)).toEqual({
      render: "placeholder",
      rejected: false,
    });
  });

  test("hides a rejected photo from everyone; only the owner learns it was rejected", () => {
    expect(photoDisposition("rejected", true)).toEqual({
      render: "placeholder",
      rejected: true,
    });
    expect(photoDisposition("rejected", false)).toEqual({
      render: "placeholder",
      rejected: false,
    });
  });

  test("shows the neutral placeholder when there is no photo (null state)", () => {
    expect(photoDisposition(null, true)).toEqual({
      render: "placeholder",
      rejected: false,
    });
    expect(photoDisposition(null, false)).toEqual({
      render: "placeholder",
      rejected: false,
    });
  });
});

test.describe("the storage path scheme", () => {
  test("is a single fixed path per user, folder-scoped by their id", () => {
    // The first path segment is the auth user id — the exact thing the storage
    // RLS keys the owner-write policy on, and the RPC that records the path
    // recomputes independently. They MUST agree; this pins the app's half.
    expect(profilePhotoPath("11111111-2222-3333-4444-555555555555")).toBe(
      "11111111-2222-3333-4444-555555555555/photo",
    );
  });

  test("names the private bucket the whole feature reads and writes through", () => {
    expect(PHOTO_BUCKET).toBe("profile-photos");
  });
});

test.describe("validatePhotoUpload", () => {
  const jpeg = (bytes: number, type = "image/jpeg") =>
    new File([new Uint8Array(bytes)], "photo.jpg", { type });

  test("reports no file when the input is empty or absent (optional upload)", () => {
    // An untouched <input type=file> submits a zero-byte File; an absent field
    // is null. Both mean 'no photo to upload' — not an error — so the optional
    // onboarding upload just skips it.
    expect(validatePhotoUpload(new File([], ""))).toEqual({
      ok: true,
      file: null,
    });
    expect(validatePhotoUpload(null)).toEqual({ ok: true, file: null });
  });

  test("accepts a JPEG, PNG or WebP within the size limit", () => {
    for (const type of ALLOWED_PHOTO_TYPES) {
      const file = jpeg(1024, type);
      expect(validatePhotoUpload(file)).toEqual({ ok: true, file });
    }
  });

  test("rejects a disallowed content type", () => {
    expect(validatePhotoUpload(jpeg(1024, "image/gif")).ok).toBe(false);
    expect(validatePhotoUpload(jpeg(1024, "application/pdf")).ok).toBe(false);
  });

  test("rejects a file over the size limit, accepts one exactly at it", () => {
    expect(validatePhotoUpload(jpeg(MAX_PHOTO_BYTES + 1)).ok).toBe(false);
    expect(validatePhotoUpload(jpeg(MAX_PHOTO_BYTES)).ok).toBe(true);
  });
});

test.describe("photoPlaceholder", () => {
  test("takes the first letter of the name, uppercased, ignoring surrounding space", () => {
    expect(photoPlaceholder("Pincoya").initial).toBe("P");
    expect(photoPlaceholder("  ana ").initial).toBe("A");
  });

  test("falls back to a neutral glyph when there is no usable name", () => {
    expect(photoPlaceholder("").initial).toBe("?");
    expect(photoPlaceholder("   ").initial).toBe("?");
  });

  test("gives a stable in-range hue for the same name (same athlete, same disc)", () => {
    const a = photoPlaceholder("Pincoya");
    const b = photoPlaceholder("Pincoya");
    expect(a.hue).toBe(b.hue);
    expect(Number.isInteger(a.hue)).toBe(true);
    expect(a.hue).toBeGreaterThanOrEqual(0);
    expect(a.hue).toBeLessThan(360);
  });

  test("spreads different names across different hues (not a constant colour)", () => {
    const names = ["Pincoya", "Ana", "Beto", "Cami", "Dani", "Eli"];
    const hues = new Set(names.map((n) => photoPlaceholder(n).hue));
    expect(hues.size).toBeGreaterThan(1);
  });
});
