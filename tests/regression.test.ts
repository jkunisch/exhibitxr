import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { isAdminEmail } from "../src/lib/adminEmails";
import { getExhibitionCreationLimitError } from "../src/lib/exhibitionPlanGate";
import { buildSnapPreviewFilename, resolveSnapImageExtension } from "../src/lib/snapImage";
import { resolveVariantTargetMeshNames, type VariantMeshDescriptor } from "../src/lib/variantTargets";

const originalAdminEmails = process.env.ADMIN_EMAILS;

afterEach(() => {
  if (typeof originalAdminEmails === "string") {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  } else {
    delete process.env.ADMIN_EMAILS;
  }
});

describe("Admin email + plan limit regression", () => {
  it("uses fallback admin emails when ADMIN_EMAILS is unset", () => {
    delete process.env.ADMIN_EMAILS;

    assert.equal(isAdminEmail("jonatankunisch@gmail.com"), true);
    assert.equal(isAdminEmail("demo@exhibitxr.com"), true);
    assert.equal(isAdminEmail("someone@else.com"), false);
  });

  it("respects explicit ADMIN_EMAILS configuration", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";

    assert.equal(isAdminEmail("owner@example.com"), true);
    assert.equal(isAdminEmail("demo@exhibitxr.com"), false);
  });

  it("returns a blocking error when exhibition plan limit is reached", () => {
    const error = getExhibitionCreationLimitError({
      plan: "starter",
      currentExhibitions: 3,
      maxExhibitions: 3,
      canCreateExhibition: false,
    });

    assert.equal(
      error,
      "Plan limit reached (3/3 exhibitions on starter). Upgrade required.",
    );
  });

  it("returns null when exhibition creation is allowed", () => {
    const error = getExhibitionCreationLimitError({
      plan: "starter",
      currentExhibitions: 2,
      maxExhibitions: 3,
      canCreateExhibition: true,
    });

    assert.equal(error, null);
  });
});

describe("Variant target resolution regression", () => {
  const descriptors: VariantMeshDescriptor[] = [
    {
      meshName: "BodyMesh",
      groupNames: ["Car", "Body"],
      materialNames: ["PaintRed"],
    },
    {
      meshName: "WheelFL",
      groupNames: ["Car", "Wheels"],
      materialNames: ["Rubber"],
    },
    {
      meshName: "GlassMesh",
      groupNames: ["Car", "Windows"],
      materialNames: ["GlassClear"],
    },
  ];

  it("matches mesh/group/material targets plus auto targets", () => {
    const resolved = resolveVariantTargetMeshNames(
      descriptors,
      ["group:Wheels", "material:GlassClear", "mesh:BodyMesh"],
      ["VAR__AutoDoor"],
    );

    assert.equal(resolved.has("BodyMesh"), true);
    assert.equal(resolved.has("WheelFL"), true);
    assert.equal(resolved.has("GlassMesh"), true);
    assert.equal(resolved.has("VAR__AutoDoor"), true);
  });

  it("supports wildcard group target", () => {
    const resolved = resolveVariantTargetMeshNames(descriptors, ["group:*"]);

    assert.equal(resolved.has("BodyMesh"), true);
    assert.equal(resolved.has("WheelFL"), true);
    assert.equal(resolved.has("GlassMesh"), true);
  });
});

describe("Snap image format regression", () => {
  it("keeps AVIF extension when uploaded filename is AVIF", () => {
    assert.equal(resolveSnapImageExtension("shoe-preview.AVIF", "image/jpeg"), "avif");
    assert.equal(buildSnapPreviewFilename("shoe-preview.AVIF", "image/jpeg"), "home-preview.avif");
  });

  it("uses MIME type fallback for extensionless uploads", () => {
    assert.equal(resolveSnapImageExtension("upload", "image/avif"), "avif");
    assert.equal(buildSnapPreviewFilename("upload", "image/avif"), "home-preview.avif");
  });

  it("falls back to jpg for unknown formats", () => {
    assert.equal(resolveSnapImageExtension("upload.bin", "application/octet-stream"), "jpg");
    assert.equal(buildSnapPreviewFilename("upload.bin", "application/octet-stream"), "home-preview.jpg");
  });
});
