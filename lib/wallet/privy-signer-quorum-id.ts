import "server-only";

/** Key quorum id from Privy Dashboard (Authorization keys → quorum id, not the private key). */
export function getPrivySignerQuorumId(): string | undefined {
  return (
    process.env.PRIVY_SIGNER_QUORUM_ID?.trim() ||
    process.env.NEXT_PUBLIC_PRIVY_SIGNER_QUORUM_ID?.trim() ||
    undefined
  );
}
