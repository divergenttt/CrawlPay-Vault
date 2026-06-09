"use client";

import { useEffect, useState } from "react";
import { useFundWallet } from "@privy-io/react-auth";
import { isAddress } from "viem";
import { base } from "viem/chains";
import { DepositWidget } from "@/components/connect/deposit-widget";
import { authFetch } from "@/lib/auth/client";
import { formatUsdcBalance } from "@/lib/wallet/arc-usdc";
import { useEmbeddedWalletAddress } from "@/lib/wallet/use-embedded-wallet-address";
import { useArcUsdcBalance } from "@/lib/wallet/use-arc-usdc-balance";
import { CRAWLPAY_NETWORKS } from "@/lib/networks/chains";

export function WalletTab() {
  const walletAddress = useEmbeddedWalletAddress();
  const { balanceUsdc, loading, error, refresh } = useArcUsdcBalance(walletAddress);
  const { fundWallet } = useFundWallet();

  const [baseBal, setBaseBal] = useState<number | null>(null);
  const [polygonBal, setPolygonBal] = useState<number | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("0.001");
  const [withdrawNet, setWithdrawNet] = useState<"base" | "polygon">("base");
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);
  const [withdrawErr, setWithdrawErr] = useState<string | null>(null);

  async function loadBothBalances() {
    if (!walletAddress) return;
    setBalLoading(true);
    try {
      const res = await authFetch(
        `/api/dashboard/wallet-balances?t=${Date.now()}`
      );
      const body = (await res.json()) as {
        base?: number;
        polygon?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error);
      setBaseBal(body.base ?? null);
      setPolygonBal(body.polygon ?? null);
    } catch {
      setBaseBal(null);
      setPolygonBal(null);
    } finally {
      setBalLoading(false);
    }
  }

  useEffect(() => {
    void loadBothBalances();
  }, [walletAddress]);

  async function onFund() {
    if (!walletAddress) return;
    await fundWallet({
      address: walletAddress,
      options: { chain: { id: base.id } },
    });
    void refresh();
    void loadBothBalances();
  }

  async function withdraw() {
    setWithdrawMsg(null);
    setWithdrawErr(null);
    if (!isAddress(withdrawTo)) {
      setWithdrawErr("Invalid recipient address");
      return;
    }
    const amount = parseFloat(withdrawAmt);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawErr("Invalid amount");
      return;
    }
    try {
      const res = await authFetch("/api/dashboard/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: withdrawTo,
          amount_usdc: amount,
          network: withdrawNet,
        }),
      });
      const body = (await res.json()) as { tx_hash?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Withdraw failed");
      setWithdrawMsg(`Sent · ${body.tx_hash?.slice(0, 10)}…`);
      void loadBothBalances();
      void refresh();
    } catch (err) {
      setWithdrawErr(err instanceof Error ? err.message : "Withdraw failed");
    }
  }

  return (
    <div className="db-cabinet-section">
      <h1 className="db-section-title">Wallet</h1>
      <p className="db-muted">Privy embedded wallet · USDC on Base and Polygon</p>

      <div className="db-grid-2">
        <div className="db-card db-cabinet-card">
          <div className="db-card-label">Base USDC</div>
          <div className="db-card-value">
            {balLoading && baseBal == null
              ? "…"
              : formatUsdcBalance(baseBal ?? balanceUsdc ?? 0)}
          </div>
          <div className="db-card-foot">{CRAWLPAY_NETWORKS.base.name} mainnet</div>
        </div>
        <div className="db-card db-cabinet-card">
          <div className="db-card-label">Polygon USDC</div>
          <div className="db-card-value">
            {balLoading && polygonBal == null
              ? "…"
              : formatUsdcBalance(polygonBal ?? 0)}
          </div>
          <div className="db-card-foot">{CRAWLPAY_NETWORKS.polygon.name} PoS</div>
        </div>
      </div>

      <section className="db-settings-block">
        <h2 className="db-block-title">Deposit</h2>
        <DepositWidget
          balanceUsdc={balanceUsdc}
          balanceLoading={loading}
          balanceError={error}
          onRefreshBalance={() => {
            void refresh();
            void loadBothBalances();
          }}
        />
        <button type="button" className="db-btn mt-3" onClick={() => void onFund()}>
          Fund via Privy
        </button>
      </section>

      <section className="db-settings-block">
        <h2 className="db-block-title">Withdraw USDC</h2>
        <div className="db-withdraw-form">
          <select
            className="db-input"
            value={withdrawNet}
            onChange={(e) => setWithdrawNet(e.target.value as "base" | "polygon")}
          >
            <option value="base">Base</option>
            <option value="polygon">Polygon</option>
          </select>
          <input
            className="db-input"
            placeholder="0x recipient"
            value={withdrawTo}
            onChange={(e) => setWithdrawTo(e.target.value)}
          />
          <input
            className="db-input db-input--narrow"
            type="number"
            step="0.001"
            value={withdrawAmt}
            onChange={(e) => setWithdrawAmt(e.target.value)}
          />
          <button type="button" className="db-btn db-btn--primary" onClick={() => void withdraw()}>
            Withdraw
          </button>
        </div>
        {withdrawMsg ? <p className="db-success">{withdrawMsg}</p> : null}
        {withdrawErr ? <p className="db-error">{withdrawErr}</p> : null}
      </section>
    </div>
  );
}
