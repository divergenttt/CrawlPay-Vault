export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { uploadVault } from "@/lib/cdr/vault";
import {
  buildVaultDatasetPayload,
  getVaultUploadExtension,
} from "@/lib/cdr/vault-upload-payload";
import { registerVaultOwner } from "@/lib/db/vault-ownership";
import { requirePrivyAuth } from "@/lib/auth/require-auth";

function envReady(): string | null {
  if (!process.env.STORY_PRIVATE_KEY?.trim()) {
    return "Story vault upload is not configured (STORY_PRIVATE_KEY).";
  }
  if (!process.env.STORY_SELLER_ADDRESS?.trim()) {
    return "Story vault upload is not configured (STORY_SELLER_ADDRESS).";
  }
  if (!process.env.PINATA_JWT?.trim()) {
    return "IPFS upload is not configured (PINATA_JWT).";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  const configError = envReady();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const entry = formData.get("file");
  if (!entry || typeof entry === "string") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const file = entry;
  const filename = file.name?.trim() || "dataset.json";
  if (!getVaultUploadExtension(filename)) {
    return NextResponse.json(
      { error: "Only .json, .csv, .md, or .pdf files are accepted" },
      { status: 400 }
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const content = buildVaultDatasetPayload(filename, bytes);
    const { uuid, cid } = await uploadVault(content);

    await registerVaultOwner(uuid, auth.session.userId, cid);

    return NextResponse.json(
      { uuid, cid },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Vault upload failed";
    console.error("Vault upload API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
