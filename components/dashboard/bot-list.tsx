"use client";

import { DASHBOARD_BOTS, type BotWhitelistState } from "@/lib/dashboard/bots";
import { StatusBadge } from "@/components/dashboard/status-badge";

type BotListProps = {
  bots?: BotWhitelistState;
  onToggle?: (id: string, field: "enabled" | "free") => void;
  readOnly?: boolean;
};

/** Whitelist editor for 12 AI crawlers (Googlebot locked free). */
export function BotList({ bots, onToggle, readOnly = false }: BotListProps) {
  return (
    <ul className="db-bot-list">
      {DASHBOARD_BOTS.map((bot) => {
        const state = bots?.[bot.id] ?? { enabled: true, free: Boolean(bot.lockedFree) };
        return (
          <li key={bot.id} className="db-bot-row">
            <div className="db-bot-info">
              <span className="db-bot-label">{bot.label}</span>
              <span className="db-bot-co">{bot.company}</span>
            </div>
            {!readOnly && onToggle ? (
              <>
                <label className="db-toggle">
                  <input
                    type="checkbox"
                    checked={state.enabled}
                    disabled={bot.lockedFree}
                    onChange={() => onToggle(bot.id, "enabled")}
                  />
                  <span>Allow</span>
                </label>
                <label className="db-toggle">
                  <input
                    type="checkbox"
                    checked={state.free || bot.lockedFree}
                    disabled={bot.lockedFree}
                    onChange={() => onToggle(bot.id, "free")}
                  />
                  <span>Free</span>
                </label>
              </>
            ) : null}
            {bot.lockedFree ? (
              <StatusBadge status="free" label="Locked free" />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
