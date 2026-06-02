import "server-only";

import { VAULT_UPLOAD_MAX_BYTES } from "@/lib/vault/upload-limits";

export { VAULT_UPLOAD_MAX_BYTES };

export const VAULT_UPLOAD_EXTENSIONS = [".json", ".csv", ".md", ".pdf"] as const;

export type VaultUploadExtension = (typeof VAULT_UPLOAD_EXTENSIONS)[number];

export function getVaultUploadExtension(filename: string): VaultUploadExtension | null {
  const lower = filename.toLowerCase();
  for (const ext of VAULT_UPLOAD_EXTENSIONS) {
    if (lower.endsWith(ext)) return ext;
  }
  return null;
}

export type VaultDatasetPayload = {
  type: "crawlpay-vault-dataset";
  uploadedAt: string;
  filename: string;
  mimeType: string;
  extension: VaultUploadExtension;
  encoding: "utf-8" | "base64";
  data: string;
};

/** Normalize uploaded file into JSON string for `uploadVault()`. */
export function buildVaultDatasetPayload(
  filename: string,
  bytes: Uint8Array
): string {
  const extension = getVaultUploadExtension(filename);
  if (!extension) {
    throw new Error("Unsupported file type. Use .json, .csv, .md, or .pdf");
  }

  if (bytes.byteLength > VAULT_UPLOAD_MAX_BYTES) {
    throw new Error(
      `File too large (max ${Math.round(VAULT_UPLOAD_MAX_BYTES / 1024 / 1024)} MB)`
    );
  }

  const mimeTypes: Record<VaultUploadExtension, string> = {
    ".json": "application/json",
    ".csv": "text/csv",
    ".md": "text/markdown",
    ".pdf": "application/pdf",
  };

  const encoding: VaultDatasetPayload["encoding"] =
    extension === ".pdf" ? "base64" : "utf-8";

  const data =
    encoding === "base64"
      ? Buffer.from(bytes).toString("base64")
      : new TextDecoder("utf-8", { fatal: true }).decode(bytes);

  const payload: VaultDatasetPayload = {
    type: "crawlpay-vault-dataset",
    uploadedAt: new Date().toISOString(),
    filename,
    mimeType: mimeTypes[extension],
    extension,
    encoding,
    data,
  };

  return JSON.stringify(payload);
}
