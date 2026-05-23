"use client";

import { useEffect, useState } from "react";
import { PaymentsTable } from "@/components/payments-table";
import RevenueChart from "@/components/revenue-chart";
import type {
  ChartDay,
  DashboardStats,
  GatewayBalance,
  Payment,
  PaymentsPage,
} from "@/lib/types";
import type { CSSProperties } from "react";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d3a 50%, #1a1a2e 100%)",
  color: "white",
  padding: "2rem",
  fontFamily: "system-ui, sans-serif",
};

const cardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  borderRadius: "16px",
  padding: "1.5rem",
  border: "1px solid rgba(255,255,255,0.08)",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "1rem",
  marginBottom: "1.5rem",
};

const balanceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "1rem",
  marginBottom: "1.5rem",
};

const sectionStyle: CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  borderRadius: "16px",
  padding: "1.5rem",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "1.5rem",
};

const titleStyle: CSSProperties = {
  fontSize: "1.875rem",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "-0.02em",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  marginBottom: "1rem",
  marginTop: 0,
  color: "rgba(255,255,255,0.7)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const cardLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.4)",
  fontSize: "0.75rem",
  marginBottom: "0.5rem",
  marginTop: 0,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 500,
};

const cardValueStyle: CSSProperties = {
  fontSize: "1.75rem",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "-0.02em",
};

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(value) || 0;
}

function formatUsdc(amount: number): string {
  return `$${amount.toFixed(3)} USDC`;
}

function formatBalanceUsdc(amount: string | undefined, hasError: boolean): string {
  if (hasError || amount == null) return "— USDC";
  return `${amount} USDC`;
}

function dateKeyLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildChartData(payments: Payment[]): ChartDay[] {
  const days: ChartDay[] = [];
  const keys: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: 0,
    });
    keys.push(dateKeyLocal(d));
  }

  const revenueByDay = new Map(keys.map((k) => [k, 0]));
  for (const p of payments) {
    const key = dateKeyLocal(new Date(p.created_at));
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + toNumber(p.amount_usdc));
    }
  }

  return days.map((day, i) => ({
    label: day.label,
    revenue: revenueByDay.get(keys[i]) ?? 0,
  }));
}

const EMPTY_STATS: DashboardStats = {
  total_earned: 0,
  total_requests: 0,
  unique_bots: 0,
  today_earned: 0,
};

export default function DashboardPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [balance, setBalance] = useState<GatewayBalance | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchBalance() {
    try {
      const res = await fetch(`/api/balance?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        console.error("Balance fetch error:", res.status, res.statusText);
        setBalance({ wallet: "0", available: "0", total: "0", withdrawing: "0", error: res.statusText });
        return;
      }
      const data: GatewayBalance = await res.json();
      setBalance(data);
    } catch (err) {
      console.error("Balance fetch error:", err);
      setBalance({
        wallet: "0",
        available: "0",
        total: "0",
        withdrawing: "0",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`/api/stats?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        console.error("Stats fetch error:", res.status, res.statusText);
        return;
      }
      const data: DashboardStats = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  }

  async function fetchData() {
    try {
      const res = await fetch(
        `/api/payments?page=1&limit=100&t=${Date.now()}`,
        {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }
      );
      if (!res.ok) {
        console.error("Fetch error:", res.status, res.statusText);
        return;
      }
      const body: PaymentsPage | Payment[] = await res.json();
      setPayments(Array.isArray(body) ? body : (body.data ?? []));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const chartData = buildChartData(payments);

  const balanceError = Boolean(balance?.error);

  const statCards = [
    { label: "Total Earned", value: formatUsdc(stats.total_earned) },
    { label: "Total Requests", value: String(stats.total_requests) },
    { label: "Unique Bots", value: String(stats.unique_bots) },
    { label: "Today", value: formatUsdc(stats.today_earned) },
  ];

  const balanceStats = [
    {
      label: "Gateway Available",
      value: formatBalanceUsdc(balance?.available, balanceError),
    },
    {
      label: "Wallet Balance",
      value: formatBalanceUsdc(balance?.wallet, balanceError),
    },
  ];

  return (
    <main style={pageStyle}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={titleStyle}>CrawlPay Dashboard</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#10B981",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#10B981",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                LIVE
              </span>
            </div>
          </div>
          <p
            style={{
              margin: 0,
              marginTop: "2px",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Arc Testnet ·{" "}
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Connecting..."}
          </p>
        </div>

        <a
          href="/"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.6)",
            padding: "0.5rem 1rem",
            borderRadius: "10px",
            textDecoration: "none",
            fontSize: "0.85rem",
            border: "1px solid rgba(255,255,255,0.1)",
            fontWeight: 500,
          }}
        >
          ← Home
        </a>
      </div>

      <div style={gridStyle}>
        {statCards.map((stat) => (
          <div key={stat.label} style={cardStyle}>
            <p style={cardLabelStyle}>{stat.label}</p>
            <p style={cardValueStyle}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={balanceGridStyle}>
        {balanceStats.map((stat) => (
          <div key={stat.label} style={cardStyle}>
            <p style={cardLabelStyle}>{stat.label}</p>
            <p style={cardValueStyle}>{stat.value}</p>
          </div>
        ))}
      </div>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Revenue — last 7 days</h2>
        <RevenueChart data={chartData} />
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Recent Payments</h2>
        <PaymentsTable payments={payments} />
      </section>
    </main>
  );
}
