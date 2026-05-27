"use client";

const CACHE_MS = 2 * 60_000;
let verifiedUntil = 0;

export function isSessionVerifyCached(): boolean {
  return Date.now() < verifiedUntil;
}

export function markSessionVerified(): void {
  verifiedUntil = Date.now() + CACHE_MS;
}

export function clearSessionVerifyCache(): void {
  verifiedUntil = 0;
}
