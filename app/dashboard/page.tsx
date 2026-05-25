"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { DashboardPaymentsTable } from "@/components/dashboard/dashboard-payments-table";
import { LogoMark } from "@/components/logo-mark";
import { PageTransition } from "@/components/page-transition";
import { useClock, useCursor } from "@/lib/hooks";
import type {
  ChartDay,
  DashboardStats,
  GatewayBalance,
  Payment,
  PaymentsPage,
} from "@/lib/types";

const EMPTY_STATS: DashboardStats = {
  total_earned: 0,
  total_requests: 0,
  unique_bots: 0,
  today_earned: 0,
};

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : parseFloat(value) || 0;
}

function formatUsdc(amount: number): string {
  return amount.toFixed(3);
}

function formatBalanceUsdc(
  amount: string | undefined,
  hasError: boolean
): string {
  if (hasError || amount == null) return "—";
  return amount;
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
      revenueByDay.set(
        key,
        (revenueByDay.get(key) ?? 0) + toNumber(p.amount_usdc)
      );
    }
  }

  return days.map((day, i) => ({
    label: day.label,
    revenue: revenueByDay.get(keys[i]) ?? 0,
  }));
}

function fmtTime(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

function DashboardHeader({ lastUpdated }: { lastUpdated: Date | null }) {
  const t = useClock();
  return (
    <header className="db-header">
      <div className="db-header-left">
        <Link href="/" className="db-brand" data-page-link>
          <LogoMark size={18} color="#fff" />
          <span>CrawlPay</span>
        </Link>
        <div className="db-sub">
          <span>Arc Testnet</span>
          <span className="sep">·</span>
          <span>
            Updated {lastUpdated ? fmtTime(lastUpdated) : fmtTime(t)}
          </span>
        </div>
      </div>
      <div className="db-header-right">
        <span className="db-live">
          <span className="db-live-dot" />
          <span>LIVE</span>
        </span>
        <Link href="/" className="db-back" data-page-link>
          ← HOME
        </Link>
      </div>
    </header>
  );
}

export default function DashboardPage() {
  useCursor();

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
        setBalance({
          wallet: "0",
          available: "0",
          total: "0",
          withdrawing: "0",
          error: res.statusText,
        });
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
  const totalEarned = formatUsdc(stats.total_earned);
  const todayEarned = formatUsdc(stats.today_earned);

  const statCards = [
    {
      label: "Total Earned",
      value: (
        <>
          <span className="chrom">$</span>
          {totalEarned}
        </>
      ),
      foot: <>USDC on Arc</>,
    },
    {
      label: "Total Requests",
      value: stats.total_requests.toLocaleString(),
      foot: <>all time</>,
    },
    {
      label: "Unique Bots",
      value: (
        <>
          {stats.unique_bots}
          <span className="chrom">/11</span>
        </>
      ),
      foot: <>detected crawlers</>,
    },
    {
      label: "Today",
      value: (
        <>
          <span className="chrom">$</span>
          {todayEarned}
        </>
      ),
      foot: <>last 24h</>,
    },
  ];

  const balanceStats = [
    {
      label: "Gateway Available",
      value: (
        <>
          <span className="chrom">$</span>
          {formatBalanceUsdc(balance?.available, balanceError)}
        </>
      ),
      foot: "Ready to settle to wallet",
    },
    {
      label: "Wallet Balance",
      value: (
        <>
          <span className="grn">$</span>
          {formatBalanceUsdc(balance?.wallet, balanceError)}
        </>
      ),
      foot: balanceError ? "unavailable" : "USDC · gateway wallet",
    },
  ];

  return (
    <>
      <PageTransition />
      <div className="cursor-ring" />
      <div className="cursor-dot" />
      <main className="db-shell">
        <DashboardHeader lastUpdated={lastUpdated} />
        <div className="db-grid-4">
          {statCards.map((c, i) => (
            <div className="db-card" key={i}>
              <div className="db-card-label">{c.label}</div>
              <div className="db-card-value">{c.value}</div>
              <div className="db-card-foot">{c.foot}</div>
            </div>
          ))}
        </div>
        <div className="db-grid-2">
          {balanceStats.map((c, i) => (
            <div className="db-card" key={i}>
              <div className="db-card-label">{c.label}</div>
              <div className="db-card-value">{c.value}</div>
              <div className="db-card-foot">{c.foot}</div>
            </div>
          ))}
        </div>
        <DashboardChart data={chartData} />
        <DashboardPaymentsTable payments={payments} />
      </main>
    </>
  );
}
