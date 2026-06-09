"use client";

import { DASHBOARD_BOTS } from "@/lib/dashboard/bots";

const GLYPH_COLORS: Record<string, string> = {
  GP: "#5e8eff",
  CU: "#5e8eff",
  CL: "#e8647a",
  AN: "#e8647a",
  GG: "#7ab3e8",
  GO: "#7ab3e8",
  GE: "#7ab3e8",
  PX: "#4af0a8",
  CC: "#9d8fff",
  BY: "#ffb86c",
  FB: "#5e8eff",
  AP: "#cfcfd6",
};

export function BotGlyph({ botName }: { botName: string }) {
  const bot =
    DASHBOARD_BOTS.find((b) => botName.includes(b.id)) ??
    DASHBOARD_BOTS.find((b) => botName.toLowerCase().includes(b.id.toLowerCase()));

  const glyph = bot?.glyph ?? botName.slice(0, 2).toUpperCase();
  const color = GLYPH_COLORS[glyph] ?? "#cfcfd6";

  return (
    <span
      className="db-bot-glyph"
      style={{
        background: `${color}22`,
        borderColor: `${color}55`,
        color,
      }}
      title={bot?.company ?? botName}
    >
      {glyph}
    </span>
  );
}
