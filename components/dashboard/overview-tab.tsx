"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client";
import { BotGlyph } from "@/components/dashboard/bot-glyph";
import {
  NetworkSelector,
  NetworkBadge,
  type NetworkFilter,
} from "@/components/dashboard/network-selector";
import type { Payment } from "@/lib/types";
import { resolveNetworkId } from "@/lib/networks/chains";

type OverviewPayload = {
  metrics: {
    total_earned: number;
    month_earned: number;
    total_visits: number;
  };
  payments: Payment[];
};

function formatUsdc(n: number): string {
  return n.toFixed(3);
}

function formatRelativeTime(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function MetricCard({
  label,
  value,
  foot,
}: {
  label: string;
  value: React.ReactNode;
  foot?: string;
}) {
  return (
    <div className="db-card db-cabinet-card">
      <div className="db-card-label">{label}</div>
      <div className="db-card-value">{value}</div>
      {foot ? <div className="db-card-foot">{foot}</div> : null}
    </div>
  );
}

export function OverviewTab() {
  const [networkFilter, setNetworkFilter] = useState<NetworkFilter>("all");
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const qs =
        networkFilter === "all" ? "" : `?network=${networkFilter}`;
      const res = await authFetch(`/api/dashboard/overview${qs}`);
      const body = (await res.json()) as OverviewPayload & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to load");
      setData(body);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    }
  }, [networkFilter]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const metrics = data?.metrics ?? {
    total_earned: 0,
    month_earned: 0,
    total_visits: 0,
  };
  const payments = data?.payments ?? [];

  return (
    <div className="db-cabinet-section">
      <div className="db-section-head">
        <h1 className="db-section-title">Overview</h1>
        <NetworkSelector value={networkFilter} onChange={setNetworkFilter} />
      </div>

      {error ? (
        <p className="db-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="db-grid-3">
        <MetricCard
          label="Total USDC earned"
          value={
            <>
              <span className="db-accent-coral">$</span>
              {formatUsdc(metrics.total_earned)}
            </>
          }
          foot="all time"
        />
        <MetricCard
          label="This month"
          value={
            <>
              <span className="db-accent-blue">$</span>
              {formatUsdc(metrics.month_earned)}
            </>
          }
          foot="calendar month · UTC"
        />
        <MetricCard
          label="Bot visits"
          value={metrics.total_visits.toLocaleString()}
          foot="all time"
        />
      </div>

      <section className="db-activity">
        <div className="db-table-head">
          <div className="db-table-title">Live activity</div>
          <div className="db-table-sub">poll · 5s · supabase</div>
        </div>
        <ul className="db-activity-list">
          {payments.length === 0 ? (
            <li className="db-activity-empty">No bot visits yet</li>
          ) : (
            payments.map((p) => (
              <li key={p.id} className="db-activity-row">
                <div className="db-activity-bot">
                  <BotGlyph botName={p.bot_name} />
                  <span className="db-activity-name">{p.bot_name}</span>
                </div>
                <div className="db-activity-url" title={p.page_url}>
                  {p.page_url}
                </div>
                <div className="db-activity-amount">
                  ${Number(p.amount_usdc).toFixed(3)}
                </div>
                <NetworkBadge network={resolveNetworkId(p.network ?? "base")} />
                <time className="db-activity-time">
                  {formatRelativeTime(p.created_at)}
                </time>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
