"use client";

import { getAccessToken } from "@privy-io/react-auth";
import {
  clearSessionVerifyCache,
  isSessionVerifyCached,
  markSessionVerified,
} from "@/lib/auth/session-cache";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { clearSessionVerifyCache };

let inflightVerify: Promise<ServerSessionResult> | null = null;

/** Attach Privy access token for server-verified API calls. */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
  });
}

export type ServerSessionResult =
  | { ok: true }
  | { ok: false; message: string };

async function verifyOnce(token: string): Promise<ServerSessionResult> {
  try {
      const res = await fetch("/api/auth/session", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "same-origin",
      });

    if (res.ok) {
      markSessionVerified();
      return { ok: true };
    }

    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const detail = body.error ?? `HTTP ${res.status}`;
    return {
      ok: false,
      message: `Server rejected session (${detail}). Check PRIVY_APP_SECRET matches your app.`,
    };
  } catch {
    return { ok: false, message: "Could not reach auth session API." };
  }
}

/**
 * Confirm JWT with the server. Deduped + cached — safe to call from multiple hooks.
 */
export async function verifyServerSession(
  attempts = 3,
  delayMs = 20
): Promise<ServerSessionResult> {
  if (isSessionVerifyCached()) {
    return { ok: true };
  }

  if (inflightVerify) {
    return inflightVerify;
  }

  inflightVerify = (async () => {
    for (let i = 0; i < attempts; i++) {
      const token = await getAccessToken();
      if (!token) {
        if (i < attempts - 1) {
          await sleep(delayMs);
          continue;
        }
        return {
          ok: false,
          message:
            "Sign-in succeeded but session token is not ready yet. Try again.",
        };
      }

      const result = await verifyOnce(token);
      if (result.ok) return result;

      if (i < attempts - 1) {
        await sleep(delayMs);
        continue;
      }
      return result;
    }

    return { ok: false, message: "Session verification timed out." };
  })().finally(() => {
    inflightVerify = null;
  });

  return inflightVerify;
}
