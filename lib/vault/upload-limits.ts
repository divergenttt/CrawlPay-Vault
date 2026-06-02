/** Shared limits for vault file upload (client + server). */
export const VAULT_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const VAULT_UPLOAD_MAX_MB = VAULT_UPLOAD_MAX_BYTES / 1024 / 1024;

export function shortenIpfsCid(cid: string): string {
  if (cid.length <= 14) return cid;
  return `${cid.slice(0, 6)}…${cid.slice(-4)}`;
}
