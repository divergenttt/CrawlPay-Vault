"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function PageTransition() {
  const timerRef = useRef<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("page-fade-in");
    const raf = requestAnimationFrame(() => {
      root.classList.add("page-fade-in");
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        root.classList.remove("page-fade-in");
      }, 220);
    });
    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [pathname]);

  return (
    <>
      <style jsx global>{`
        @keyframes page-enter-fade {
          from {
            opacity: 0.01;
            transform: translateY(4px);
            filter: saturate(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: saturate(1);
          }
        }
        html.page-fade-in main {
          animation: page-enter-fade 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          html.page-fade-in main {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
