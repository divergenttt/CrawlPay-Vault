import type { StorageProvider } from "@piplabs/cdr-sdk";
import { uuidToLabel } from "@piplabs/cdr-sdk";
import { encryptFile } from "@piplabs/cdr-crypto";
import { encodeAbiParameters, parseAbiParameters, toHex } from "viem";
import { getCDRClient } from "./client";

const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs";

/** OwnerWriteCondition on Aeneid — write slot only. */
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

  async upload(data: Uint8Array, _options?: { pin?: boolean }): Promise<string> {
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
    const gatewayKey = process.env.PINATA_GATEWAY_KEY?.trim();
    const customGateway = process.env.PINATA_GATEWAY?.trim().replace(/\/$/, "");

    const gatewayUrls: string[] = [];
    if (customGateway) {
      const base = `${customGateway}/ipfs/${cid}`;
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
      const response = await fetch(url, { headers: this.authHeaders });
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

    console.log("Vault upload — seller address (read EOA bypass):", sellerAddress);
    console.log("Vault upload — writeConditionData:", ownerConditionData);

    const contentBytes = new TextEncoder().encode(content);
    const { ciphertext: encryptedFile, key } = encryptFile(contentBytes);
    const cid = await storageProvider.upload(encryptedFile, { pin: true });

    const vaultPayload = JSON.stringify({ cid, key: toHex(key) });
    const payloadBytes = new TextEncoder().encode(vaultPayload);

    // uploadFile() does not forward skipConditionValidation to allocate() in SDK 0.2.1.
    const { uuid, txHash: allocateTx } = await client.uploader.allocate({
      updatable: false,
      writeConditionAddr: OWNER_WRITE_CONDITION,
      readConditionAddr: sellerAddress,
      writeConditionData: ownerConditionData,
      readConditionData: "0x",
      skipConditionValidation: true,
    });

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
