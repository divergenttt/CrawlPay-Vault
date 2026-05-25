"use client";

import type { Payment } from "@/lib/types";
import { formatShortTxHash, getScannerLink } from "@/lib/utils";

const BOT_COLORS: Record<string, string> = {
  GPT: "#5e8eff",
  CLD: "#4af0a8",
  CLA: "#4af0a8",
  PRX: "#ff4d63",
  GGO: "#ffb86c",
  CCB: "#9d8fff",
  MET: "#5e8eff",
  BYT: "#4af0a8",
  ANT: "#4af0a8",
  GEX: "#ffb86c",
  CGP: "#5e8eff",
  APL: "#cfcfd6",
};

function botColor(name: string): string {
  const key = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
  return BOT_COLORS[key] ?? "#cfcfd6";
}

function formatRelativeTime(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(value) || 0;
}

type DashboardPaymentsTableProps = {
  payments: Payment[];
};

export function DashboardPaymentsTable({
  payments,
}: DashboardPaymentsTableProps) {
  const rows = payments.slice(0, 100);

  return (
    <section className="db-table-wrap">
      <div className="db-table-head">
        <div className="db-table-title">Recent Payments</div>
        <div className="db-table-sub">
          last {rows.length} · live · arc testnet
        </div>
      </div>
      <div className="db-table-scroll">
        <table className="db-table">
          <thead>
            <tr>
              <th>Bot</th>
              <th>Page</th>
              <th>Amount</th>
              <th>Tx Hash</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--gray)" }}>
                  No payments yet
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const color = botColor(p.bot_name);
                const scannerUrl = getScannerLink(p.tx_hash);
                const hashLabel = formatShortTxHash(p.tx_hash);
                return (
                  <tr key={p.id}>
                    <td>
                      <span className="cell-bot">
                        <span
                          className="bot-dot"
                          style={{
                            background: color,
                            boxShadow: `0 0 6px ${color}`,
                          }}
                        />
                        {p.bot_name}
                      </span>
                    </td>
                    <td>
                      <div className="cell-page">{p.page_url}</div>
                    </td>
                    <td>
                      <span className="cell-amount">
                        <span className="chrom">$</span>
                        {toNumber(p.amount_usdc).toFixed(3)}
                      </span>
                    </td>
                    <td>
                      {scannerUrl ? (
                        <a
                          className="cell-tx"
                          href={scannerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {hashLabel}
                          <span className="arrow">↗</span>
                        </a>
                      ) : (
                        <span className="cell-tx">{hashLabel}</span>
                      )}
                    </td>
                    <td>
                      <span className="cell-time">
                        {formatRelativeTime(p.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
