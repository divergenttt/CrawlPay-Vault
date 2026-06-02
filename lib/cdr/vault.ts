import "server-only";
import { encodeAbiParameters, parseAbiParameters, toHex } from "viem";
import { getCDRClient } from "./client";

const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs";
const VAULT_IPFS_FILENAME = "crawlpay-vault-content.bin";
const STORY_TIME_CONDITION_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

/** OwnerWriteCondition on Aeneid — write slot only. */
const OWNER_WRITE_CONDITION =
  "0x4C9bFC96d7092b590D497A191826C3dA2277c34B" as const;

/** Minimal storage interface — avoids static import from @piplabs/cdr-sdk. */
interface VaultStorageProvider {
  upload(data: Uint8Array, options?: { pin?: boolean }): Promise<string>;
  download(cid: string): Promise<Uint8Array>;
}

function loadCdrSdk() {
  return import(/* webpackIgnore: true */ "@piplabs/cdr-sdk");
}

function loadCdrCrypto() {
  return import(/* webpackIgnore: true */ "@piplabs/cdr-crypto");
}

function getPinataJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error(
      "Missing PINATA_JWT — sign up at https://pinata.cloud, create an API key (JWT), and add it to .env.local"
    );
  }
  return jwt;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

class PinataStorageProvider implements VaultStorageProvider {
  private readonly authHeaders: HeadersInit;

  constructor() {
    this.authHeaders = { Authorization: `Bearer ${getPinataJwt()}` };
  }

  async upload(data: Uint8Array, _options?: { pin?: boolean }): Promise<string> {
    const formData = new FormData();
    const fileBytes = new Uint8Array(data);
    formData.append("file", new Blob([fileBytes]), VAULT_IPFS_FILENAME);
    // Pinata defaults wrapWithDirectory: true — root CID ≠ file CID and CDR CID check fails.
    formData.append(
      "pinataOptions",
      JSON.stringify({ wrapWithDirectory: false, cidVersion: 1 })
    );

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: this.authHeaders,
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Pinata upload failed: ${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`
      );
    }

    const result = (await response.json()) as { IpfsHash?: string };
    if (!result.IpfsHash) {
      throw new Error("Pinata upload response missing IpfsHash");
    }

    const cid = result.IpfsHash;

    let roundTrip: Uint8Array;
    try {
      roundTrip = await this.download(cid);
    } catch (error) {
      throw new Error(
        `IPFS pin succeeded (${cid}) but gateway read-back failed — check PINATA_GATEWAY: ${formatCause(error)}`,
        { cause: error }
      );
    }

    if (!bytesEqual(fileBytes, roundTrip)) {
      throw new Error(
        `IPFS CID mismatch after pin (got ${roundTrip.length} bytes, expected ${fileBytes.length}). ` +
          "Ensure PINATA_GATEWAY points to your Pinata dedicated gateway."
      );
    }

    return cid;
  }

  async download(cid: string): Promise<Uint8Array> {
    const gatewayKey = process.env.PINATA_GATEWAY_KEY?.trim();
    const customGateway = process.env.PINATA_GATEWAY?.trim().replace(/\/$/, "");

    const gatewayUrls: string[] = [];
    if (customGateway) {
      const gatewayBaseUrl = customGateway.startsWith("http")
        ? customGateway
        : `https://${customGateway}`;

      const base = `${gatewayBaseUrl}/ipfs/${cid}`;
      gatewayUrls.push(
        gatewayKey ? `${base}?pinataGatewayToken=${gatewayKey}` : base
      );
    }
    const defaultBase = `${PINATA_GATEWAY_URL}/${cid}`;
    gatewayUrls.push(
      gatewayKey ? `${defaultBase}?pinataGatewayToken=${gatewayKey}` : defaultBase
    );

    let lastError = "no gateway attempted";
    for (const url of gatewayUrls) {
      const headers = url.includes("pinata.cloud") ? this.authHeaders : {};
      const response = await fetch(url, { headers });
      if (response.ok) {
        return new Uint8Array(await response.arrayBuffer());
      }
      lastError = `${url} → ${response.status} ${response.statusText}`;
    }

    throw new Error(
      `Pinata gateway download failed: ${lastError}. ` +
        "Set PINATA_GATEWAY to your dedicated gateway host (e.g. xxx.mypinata.cloud from the Pinata dashboard). " +
        "If the gateway has access controls, also set PINATA_GATEWAY_KEY."
    );
  }
}

function createStorageProvider(): PinataStorageProvider {
  return new PinataStorageProvider();
}

function getStorySellerAddress(): `0x${string}` {
  const address = process.env.STORY_SELLER_ADDRESS;
  if (!address) {
    throw new Error(
      "Missing STORY_SELLER_ADDRESS — set it in .env.local for vault write access"
    );
  }
  return address as `0x${string}`;
}

function getOwnerConditionData(sellerAddress: `0x${string}`): `0x${string}` {
  return encodeAbiParameters(parseAbiParameters("address"), [sellerAddress]);
}

function getTimeConditionData(timestamp: bigint): `0x${string}` {
  return encodeAbiParameters(parseAbiParameters("uint256"), [timestamp]);
}

function formatCause(error: unknown): string {
  const parts: string[] = [];
  let cur: unknown = error;
  for (let depth = 0; depth < 4 && cur; depth++) {
    if (cur instanceof Error) {
      if (cur.message) parts.push(cur.message);
      cur = cur.cause;
      continue;
    }
    if (cur && typeof cur === "object" && "message" in cur) {
      parts.push(String((cur as { message: unknown }).message));
    }
    break;
  }
  return parts.length > 0 ? parts.join(" — ") : String(error);
}

export async function uploadVault(
  content: string,
  validUntil?: number | bigint
): Promise<{ uuid: number; cid: string }> {
  try {
    const [{ uuidToLabel }, { encryptFile }] = await Promise.all([
      loadCdrSdk(),
      loadCdrCrypto(),
    ]);
    const client = await getCDRClient();
    const storageProvider = createStorageProvider();

    let globalPubKey;
    try {
      globalPubKey = await client.observer.getGlobalPubKey();
    } catch (error) {
      throw new Error(
        `Story DKG API failed (set STORY_API_URL to Aeneid REST, e.g. http://172.192.41.96:1317): ${formatCause(error)}`,
        { cause: error }
      );
    }

    const sellerAddress = getStorySellerAddress();
    if (
      validUntil != null &&
      STORY_TIME_CONDITION_ADDRESS ===
        "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error(
        "Time-based conditions are temporarily disabled until Story Protocol deploys the TimeReadCondition contract on Aeneid."
      );
    }
    const ownerConditionData = getOwnerConditionData(sellerAddress);
    const timeConditionData =
      validUntil != null ? getTimeConditionData(BigInt(validUntil)) : "0x";
    const readConditionAddr =
      validUntil != null ? STORY_TIME_CONDITION_ADDRESS : sellerAddress;
    const readConditionData = validUntil != null ? timeConditionData : "0x";

    console.log("Vault upload — seller address (read EOA bypass):", sellerAddress);
    console.log("Vault upload — writeConditionData:", ownerConditionData);

    const contentBytes = new TextEncoder().encode(content);
    const { ciphertext: encryptedFile, key } = encryptFile(contentBytes);

    let cid: string;
    try {
      cid = await storageProvider.upload(encryptedFile, { pin: true });
    } catch (error) {
      throw new Error(`IPFS pin failed (check PINATA_JWT): ${formatCause(error)}`, {
        cause: error,
      });
    }

    const vaultPayload = JSON.stringify({ cid, key: toHex(key) });
    const payloadBytes = new TextEncoder().encode(vaultPayload);

    let uuid: number;
    let allocateTx: string;
    try {
      ({ uuid, txHash: allocateTx } = await client.uploader.allocate({
      updatable: false,
      writeConditionAddr: OWNER_WRITE_CONDITION,
      readConditionAddr,
      writeConditionData: ownerConditionData,
      readConditionData,
      skipConditionValidation: true,
      }));
    } catch (error) {
      throw new Error(
        `Story on-chain allocate failed (check STORY_PRIVATE_KEY, gas on Aeneid): ${formatCause(error)}`,
        { cause: error }
      );
    }

    const ciphertext = await client.uploader.encryptDataKey({
      dataKey: payloadBytes,
      globalPubKey,
      label: uuidToLabel(uuid),
    });

    const { txHash: writeTx } = await client.uploader.write({
      uuid,
      accessAuxData: "0x",
      encryptedData: toHex(ciphertext.raw),
    });

    const result = {
      uuid,
      cid,
      txHashes: { allocate: allocateTx, write: writeTx },
    };

    console.log(
      "Upload result:",
      JSON.stringify(
        result,
        (_, value) => (typeof value === "bigint" ? value.toString() : value),
        2
      )
    );

    return { uuid: result.uuid, cid: result.cid };
  } catch (error) {
    throw new Error(`Failed to upload CDR vault: ${formatCause(error)}`, {
      cause: error,
    });
  }
}

export async function accessVault(uuid: number): Promise<string> {
  try {
    const client = await getCDRClient();
    const storageProvider = createStorageProvider();

    const { content } = await client.consumer.downloadFile({
      uuid,
      accessAuxData: "0x",
      storageProvider,
      timeoutMs: 120_000,
    });

    return new TextDecoder().decode(content);
  } catch (error) {
    throw new Error(
      `Failed to access CDR vault (uuid ${uuid}): ${formatCause(error)}`,
      { cause: error }
    );
  }
}
