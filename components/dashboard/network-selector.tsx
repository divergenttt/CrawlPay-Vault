"use client";

import {
  CRAWLPAY_NETWORKS,
  type CrawlPayNetworkId,
} from "@/lib/networks/chains";

export type NetworkFilter = "all" | CrawlPayNetworkId;

type NetworkSelectorProps = {
  value: NetworkFilter;
  onChange: (value: NetworkFilter) => void;
};

const OPTIONS: { id: NetworkFilter; label: string }[] = [
  { id: "all", label: "All networks" },
  { id: "base", label: CRAWLPAY_NETWORKS.base.name },
  { id: "polygon", label: CRAWLPAY_NETWORKS.polygon.name },
];

export function NetworkSelector({ value, onChange }: NetworkSelectorProps) {
  return (
    <div className="db-network-select" role="group" aria-label="Filter by network">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`db-network-opt${value === opt.id ? " is-active" : ""}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function NetworkBadge({ network }: { network?: string | null }) {
  const id = network?.trim().toLowerCase() === "polygon" ? "polygon" : "base";
  const meta = CRAWLPAY_NETWORKS[id];
  return (
    <span className={`db-network-badge db-network-badge--${id}`} title={meta.name}>
      {meta.name}
    </span>
  );
}
