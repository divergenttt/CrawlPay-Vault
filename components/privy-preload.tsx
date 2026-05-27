"use client";

import { useEffect } from "react";

/** Warm the Privy chunk before user opens /connect (avoids multi-second wait). */
export function PrivyPreload() {
  useEffect(() => {
    void import("@privy-io/react-auth");
    void import("@/app/privy-providers");
  }, []);

  return null;
}
