"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function PageTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    document.documentElement.classList.remove("page-leaving");
    overlay.classList.remove("leaving");
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add("ready"));
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest(
        "a[data-page-link]"
      ) as HTMLAnchorElement | null;
      if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "" && a.target !== "_self") return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      e.preventDefault();
      document.documentElement.classList.add("page-leaving");
      overlay.classList.remove("ready");
      overlay.classList.add("leaving");
      window.setTimeout(() => router.push(href), 520);
    };

    // Capture phase ensures we intercept Link clicks before Next.js handles them.
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <>
      <style jsx global>{`
        .page-transition {
          position: fixed;
          inset: 0;
          background: #06060a;
          z-index: 100000;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .page-transition.ready {
          opacity: 0;
        }
        .page-transition.leaving {
          opacity: 1;
          pointer-events: auto;
        }
        .page-transition::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 56px;
          height: 56px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow:
            -3px 0 18px rgba(255, 77, 99, 0.4),
            3px 0 18px rgba(94, 142, 255, 0.4);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .page-transition.leaving::before {
          opacity: 1;
        }
        html.page-leaving {
          overflow: hidden;
        }
        html.page-leaving body {
          pointer-events: none;
        }
      `}</style>
      <div
        ref={overlayRef}
        className="page-transition ready"
        aria-hidden="true"
      />
    </>
  );
}
