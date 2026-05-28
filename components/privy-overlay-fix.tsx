"use client";

import { useEffect } from "react";

/** Disables page backdrop-filters while Privy modal / fund UI is open (prevents blurry dialog). */
export function PrivyOverlayFix() {
  useEffect(() => {
    const sync = () => {
      const open = Boolean(
        document.getElementById("privy-dialog-backdrop")
      );
      document.body.classList.toggle("privy-overlay-open", open);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-headlessui-state", "class", "id"],
    });

    return () => {
      observer.disconnect();
      document.body.classList.remove("privy-overlay-open");
    };
  }, []);

  return null;
}
