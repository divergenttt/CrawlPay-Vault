"use client";

import type { ChartDay } from "@/lib/types";

type DashboardChartProps = {
  data: ChartDay[];
};

export function DashboardChart({ data }: DashboardChartProps) {
  const W = 1200;
  const H = 240;
  const PAD = { l: 56, r: 16, t: 20, b: 30 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const buckets = data.map((d) => ({
    label: d.label.toUpperCase(),
    count: Math.max(0, Math.round(d.revenue / 0.001)),
    earned: d.revenue.toFixed(3),
  }));
  const n = buckets.length || 1;
  const slot = innerW / n;
  const barW = Math.min(56, slot * 0.55);
  const chartMax = Math.max(1, ...buckets.map((d) => d.count));
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((chartMax / ticks) * i)
  );

  return (
    <section className="db-chart">
      <div className="db-chart-head">
        <div className="db-chart-title">Revenue · Last 7 Days</div>
        <div className="db-chart-sub">USD · per page · arc testnet</div>
      </div>
      <svg
        className="db-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="bar-grad-hot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4d63" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5e8eff" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {tickVals.map((v, i) => {
          const y = PAD.t + innerH - (v / chartMax) * innerH;
          return (
            <g key={i}>
              <line
                x1={PAD.l}
                y1={y}
                x2={W - PAD.r}
                y2={y}
                className="db-grid-line"
              />
              <text
                x={PAD.l - 12}
                y={y + 4}
                className="db-axis-text"
                textAnchor="end"
              >
                {v}
              </text>
            </g>
          );
        })}

        {buckets.map((d, i) => {
          const cx = PAD.l + slot * i + slot / 2;
          const h = (d.count / chartMax) * innerH;
          const x = cx - barW / 2;
          const y = PAD.t + innerH - h;
          const isToday = i === buckets.length - 1;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                className="db-bar"
                style={{
                  fill: isToday ? "url(#bar-grad-hot)" : "url(#bar-grad)",
                }}
                rx={4}
                ry={4}
              />
              <text
                x={cx}
                y={y - 8}
                className="db-bar-label"
                textAnchor="middle"
              >
                {d.count}
              </text>
              <text
                x={cx}
                y={H - 10}
                className="db-axis-text"
                textAnchor="middle"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
