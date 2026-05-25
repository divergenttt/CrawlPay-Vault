import { CDRClient, initWasm } from "@piplabs/cdr-sdk";
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { storyAeneid } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

/** Story-API REST endpoint for DKG state (Aeneid testnet). */
const STORY_API_URL = "http://172.192.41.96:1317";

const STORY_RPC_URL = process.env.STORY_RPC_URL || "https://aeneid.storyrpc.io";

let wasmInit: Promise<void> | null = null;
let client: CDRClient | null = null;

function ensureWasmInitialized(): Promise<void> {
  if (!wasmInit) {
    wasmInit = initWasm();
  }
  return wasmInit;
}

function getStoryPrivateKey(): `0x${string}` {
  const privateKey = process.env.STORY_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "Missing STORY_PRIVATE_KEY — set it in .env.local for Story Aeneid / CDR"
    );
  }
  return privateKey as `0x${string}`;
}

function createStoryClients(): {
  publicClient: PublicClient;
  walletClient: WalletClient;
} {
  const account = privateKeyToAccount(getStoryPrivateKey());
  const transport = http(STORY_RPC_URL);

  const publicClient = createPublicClient({
    chain: storyAeneid,
    transport,
  });

  const walletClient = createWalletClient({
    account,
    chain: storyAeneid,
    transport,
  });

  return { publicClient, walletClient };
}

export async function getCDRClient(): Promise<CDRClient> {
  await ensureWasmInitialized();

  if (!client) {
    const { publicClient, walletClient } = createStoryClients();

    client = new CDRClient({
      network: "testnet",
      publicClient,
      walletClient,
      apiUrl: STORY_API_URL,
    });
  }

  return client;
}
