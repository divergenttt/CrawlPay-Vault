"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUi } from "@/lib/auth/auth-ui-context";

/** /dashboard → /dashboard/overview (auth gate is on overview). */
export default function DashboardIndexPage() {
  const router = useRouter();
  const { ready } = useAuthUi();

  useEffect(() => {
    if (!ready) return;
    router.replace("/dashboard/overview");
  }, [ready, router]);

  return (
    <div className="db-shell flex min-h-[40vh] items-center justify-center text-zinc-500">
      Loading…
    </div>
  );
}
