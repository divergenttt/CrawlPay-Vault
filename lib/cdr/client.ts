import "server-only";
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { storyAeneid } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Story-API REST base URL for CDR DKG reads (global pub key, threshold, etc.).
 * Aeneid testnet default per Story CDR docs — not api.story.foundation.
 * @see https://docs.story.foundation/developers/cdr-sdk/advanced-configuration
 */
const STORY_API_URL_TESTNET = "http://172.192.41.96:1317";

const STORY_API_URL =
  process.env.STORY_API_URL?.trim() || STORY_API_URL_TESTNET;

const STORY_RPC_URL = process.env.STORY_RPC_URL || "https://aeneid.storyrpc.io";

type CDRSdkModule = typeof import("@piplabs/cdr-sdk");
type CDRClientInstance = InstanceType<CDRSdkModule["CDRClient"]>;

let wasmInit: Promise<void> | null = null;
let client: CDRClientInstance | null = null;

/** Runtime-only load — webpack must not bundle this package (Vercel). */
function loadCdrSdk(): Promise<CDRSdkModule> {
  return import(/* webpackIgnore: true */ "@piplabs/cdr-sdk");
}

function ensureWasmInitialized(): Promise<void> {
  if (!wasmInit) {
    wasmInit = loadCdrSdk().then(({ initWasm }) => initWasm());
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

export async function getCDRClient(): Promise<CDRClientInstance> {
  await ensureWasmInitialized();

  if (!client) {
    const { CDRClient } = await loadCdrSdk();
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
