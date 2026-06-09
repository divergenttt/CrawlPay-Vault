"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client";
import {
  DASHBOARD_BOTS,
  type BotWhitelistState,
} from "@/lib/dashboard/bots";
import { BotList } from "@/components/dashboard/bot-list";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { PerUrlRule, UserDomainRow, UserGlobalSettings } from "@/lib/dashboard/settings-types";

type SettingsPayload = {
  settings: UserGlobalSettings;
  domains: UserDomainRow[];
  wallet_address: string;
};

export function SettingsTab() {
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [price, setPrice] = useState("0.001");
  const [network, setNetwork] = useState<"base" | "polygon" | "both">("base");
  const [urlRules, setUrlRules] = useState<PerUrlRule[]>([]);
  const [bots, setBots] = useState<BotWhitelistState>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await authFetch("/api/dashboard/settings");
    const body = (await res.json()) as SettingsPayload & { error?: string };
    if (!res.ok) throw new Error(body.error ?? "Failed to load settings");
    setData(body);
    setPrice(String(body.settings.price_per_visit));
    setNetwork(body.settings.network);
    setUrlRules(body.settings.per_url_pricing ?? []);
    setBots(body.settings.bot_whitelist);
  }, []);

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : "Load failed")
    );
  }, [load]);

  async function addDomain() {
    setError(null);
    setMessage(null);
    try {
      const res = await authFetch("/api/dashboard/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_domain", domain: domainInput }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Add domain failed");
      setDomainInput("");
      await load();
      setMessage("Domain added — pending verification");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add domain failed");
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await authFetch("/api/dashboard/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_per_visit: parseFloat(price),
          per_url_pricing: urlRules,
          bot_whitelist: bots,
          network,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Save failed");
      await load();
      setMessage("Settings saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function addUrlRule() {
    setUrlRules((prev) => [...prev, { pattern: "/premium/*", price: 0.01 }]);
  }

  function updateRule(index: number, patch: Partial<PerUrlRule>) {
    setUrlRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  }

  function removeRule(index: number) {
    setUrlRules((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleBot(id: string, field: "enabled" | "free") {
    const meta = DASHBOARD_BOTS.find((b) => b.id === id);
    if (meta?.lockedFree) return;
    setBots((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field],
      },
    }));
  }

  return (
    <div className="db-cabinet-section">
      <h1 className="db-section-title">Settings</h1>

      {error ? <p className="db-error">{error}</p> : null}
      {message ? <p className="db-success">{message}</p> : null}

      <section className="db-settings-block">
        <h2 className="db-block-title">Domains</h2>
        <div className="db-domain-add">
          <input
            className="db-input"
            placeholder="mysite.com"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
          />
          <button type="button" className="db-btn" onClick={() => void addDomain()}>
            Add domain
          </button>
        </div>
        <ul className="db-domain-list">
          {(data?.domains ?? []).length === 0 ? (
            <li className="db-muted">No domains yet — add one to filter activity</li>
          ) : (
            data?.domains.map((d) => (
              <li key={d.id} className="db-domain-row">
                <span className="db-domain-name">{d.domain}</span>
                <StatusBadge
                  status={d.domain_status === "active" ? "active" : "pending"}
                />
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="db-settings-block">
        <h2 className="db-block-title">Pricing</h2>
        <label className="db-field">
          <span>Default price per visit (USDC)</span>
          <input
            className="db-input db-input--narrow"
            type="number"
            step="0.001"
            min="0.000001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <div className="db-url-rules">
          <div className="db-url-rules-head">
            <span>Per-URL pricing</span>
            <button type="button" className="db-btn db-btn--ghost" onClick={addUrlRule}>
              + Add rule
            </button>
          </div>
          {urlRules.map((rule, i) => (
            <div key={i} className="db-url-rule-row">
              <input
                className="db-input"
                value={rule.pattern}
                onChange={(e) => updateRule(i, { pattern: e.target.value })}
                placeholder="/premium/*"
              />
              <input
                className="db-input db-input--narrow"
                type="number"
                step="0.001"
                value={rule.price}
                onChange={(e) =>
                  updateRule(i, { price: parseFloat(e.target.value) || 0 })
                }
              />
              <button
                type="button"
                className="db-btn db-btn--ghost"
                onClick={() => removeRule(i)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="db-settings-block">
        <h2 className="db-block-title">Bot whitelist</h2>
        <BotList bots={bots} onToggle={toggleBot} />
      </section>

      <section className="db-settings-block">
        <h2 className="db-block-title">Network</h2>
        <div className="db-radio-group">
          {(["base", "polygon", "both"] as const).map((n) => (
            <label key={n} className="db-radio">
              <input
                type="radio"
                name="network"
                checked={network === n}
                onChange={() => setNetwork(n)}
              />
              <span>{n === "both" ? "Base + Polygon" : n.charAt(0).toUpperCase() + n.slice(1)}</span>
            </label>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="db-btn db-btn--primary"
        disabled={saving}
        onClick={() => void saveSettings()}
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
