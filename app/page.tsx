"use client";

import { Nav } from "@/components/nav";
import { Hero, Stats } from "@/components/hero";
import { PageTransition } from "@/components/page-transition";
import { CtaSection, Footer } from "@/components/sections/cta-section";
import { ConnectWaysSection } from "@/components/sections/connect-ways-section";
import { FlowSection } from "@/components/sections/flow-section";
import { ProtocolSection } from "@/components/sections/protocol-section";
import { SdkSection } from "@/components/sections/sdk-section";
import { StackSection } from "@/components/sections/stack-section";
import { PrivyPreload } from "@/components/privy-preload";
import { useCursor, useFadeIn } from "@/lib/hooks";

export default function Home() {
  useCursor();
  useFadeIn();

  return (
    <>
      <PrivyPreload />
      <PageTransition />
      <div className="cursor-ring" />
      <div className="cursor-dot" />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <ProtocolSection />
        <StackSection />
        <FlowSection />
        <ConnectWaysSection />
        <SdkSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
