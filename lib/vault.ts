import type { StorageProvider } from "@piplabs/cdr-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { getCDRClient } from "./cdr-client";

const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs";

/** OwnerWriteCondition on Aeneid — used for write and read (owner-only). */
const OWNER_WRITE_CONDITION =
  "0x4C9bFC96d7092b590D497A191826C3dA2277c34B" as const;

function getPinataJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error(
      "Missing PINATA_JWT — sign up at https://pinata.cloud, create an API key (JWT), and add it to .env.local"
    );
  }
  return jwt;
}

/**
 * Pinata-backed IPFS storage (Pinata does not expose Kubo /api/v0/add).
 * Uses api.pinata.cloud for uploads and gateway.pinata.cloud for reads.
 */
class PinataStorageProvider implements StorageProvider {
  private readonly authHeaders: HeadersInit;

  constructor() {
    this.authHeaders = { Authorization: `Bearer ${getPinataJwt()}` };
  }

  async upload(data: Uint8Array): Promise<string> {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([data]),
      "crawlpay-vault-content.bin"
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

    return result.IpfsHash;
  }

  async download(cid: string): Promise<Uint8Array> {
    const response = await fetch(`${PINATA_GATEWAY_URL}/${cid}`);
    if (!response.ok) {
      throw new Error(
        `Pinata gateway download failed: ${response.status} ${response.statusText}`
      );
    }
    return new Uint8Array(await response.arrayBuffer());
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

function formatCause(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export async function uploadVault(
  content: string
): Promise<{ uuid: number; cid: string }> {
  try {
    const client = await getCDRClient();
    const storageProvider = createStorageProvider();
    const globalPubKey = await client.observer.getGlobalPubKey();
    const sellerAddress = getStorySellerAddress();
    const ownerConditionData = getOwnerConditionData(sellerAddress);

    console.log("Vault upload — seller address:", sellerAddress);
    console.log("Vault upload — ownerConditionData:", ownerConditionData);

    const result = await client.uploader.uploadFile({
      content: new TextEncoder().encode(content),
      storageProvider,
      globalPubKey,
      updatable: false,
      writeConditionAddr: OWNER_WRITE_CONDITION,
      readConditionAddr: OWNER_WRITE_CONDITION,
      writeConditionData: ownerConditionData,
      readConditionData: ownerConditionData,
      accessAuxData: "0x",
    });

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
