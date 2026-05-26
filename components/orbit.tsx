"use client";

const SOLAR_SIZE = 560;
const SOLAR_CENTER = SOLAR_SIZE / 2;

type Planet = {
  id: string;
  r: number;
  dur: number;
  size: number;
  dir: number;
  start: number;
  tint: string;
  label: string;
  spin: number;
  trail: number;
};

const PLANETS: Planet[] = [
  { id: "GPT", r: 110, dur: 9, size: 11, dir: 1, start: 20, tint: "#c9c0ff", label: "GPT", spin: 3.0, trail: 100 },
  { id: "CGP", r: 144, dur: 14, size: 9, dir: -1, start: 90, tint: "#a89bff", label: "CGP", spin: 4.0, trail: 100 },
  { id: "CLD", r: 144, dur: 14, size: 8, dir: -1, start: 270, tint: "#9d8fff", label: "CLD", spin: 3.6, trail: 100 },
  { id: "ANT", r: 180, dur: 19, size: 7, dir: 1, start: 200, tint: "#7b6ef6", label: "ANT", spin: 2.4, trail: 100 },
  { id: "PRX", r: 180, dur: 19, size: 9, dir: 1, start: 20, tint: "#b3a8ff", label: "PRX", spin: 4.6, trail: 100 },
  { id: "GGO", r: 214, dur: 25, size: 12, dir: -1, start: 35, tint: "#9d8fff", label: "GGO", spin: 5.0, trail: 78 },
  { id: "GEX", r: 214, dur: 25, size: 8, dir: -1, start: 155, tint: "#8a7df0", label: "GEX", spin: 3.6, trail: 78 },
  { id: "CCB", r: 214, dur: 25, size: 9, dir: -1, start: 275, tint: "#a89bff", label: "CCB", spin: 4.2, trail: 78 },
  { id: "BYT", r: 248, dur: 36, size: 10, dir: 1, start: 10, tint: "#b3a8ff", label: "BYT", spin: 4.6, trail: 78 },
  { id: "META", r: 248, dur: 36, size: 9, dir: 1, start: 130, tint: "#c9c0ff", label: "META", spin: 3.4, trail: 78 },
  { id: "APL", r: 248, dur: 36, size: 8, dir: 1, start: 250, tint: "#9d8fff", label: "APL", spin: 3.8, trail: 78 },
];

const STARS = (() => {
  const out: { x: number; y: number; r: number; o: number; dur: number; delay: number }[] = [];
  let s = 7;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < 90; i++) {
    out.push({
      x: rand() * SOLAR_SIZE,
      y: rand() * SOLAR_SIZE,
      r: 0.35 + rand() * 1.1,
      o: 0.18 + rand() * 0.55,
      dur: 2 + rand() * 4,
      delay: -rand() * 4,
    });
  }
  return out;
})();

export function Orbit() {
  const cx = SOLAR_CENTER;
  const cy = SOLAR_CENTER;
  const orbitRadii = Array.from(new Set(PLANETS.map((p) => p.r)));

  return (
    <div
      className="orbit-wrap"
      style={{ width: SOLAR_SIZE, height: SOLAR_SIZE }}
    >
      <svg
        width={SOLAR_SIZE}
        height={SOLAR_SIZE}
        viewBox={`0 0 ${SOLAR_SIZE} ${SOLAR_SIZE}`}
        style={{ position: "absolute", inset: 0, display: "block" }}
      >
        <defs>
          <radialGradient id="sun-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sun-corona" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="planet-grad" cx="32%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#c8c8d0" />
            <stop offset="100%" stopColor="#2a2a35" />
          </radialGradient>
          <filter id="head-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {STARS.map((s, i) => (
          <circle key={`st-${i}`} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o}>
            <animate
              attributeName="opacity"
              values={`${s.o};${(s.o * 0.25).toFixed(2)};${s.o}`}
              dur={`${s.dur}s`}
              begin={`${s.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {orbitRadii.map((r) => (
          <circle
            key={`orb-${r}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeDasharray="1.5 5"
          />
        ))}

        <circle cx={cx} cy={cy} r={102} fill="url(#sun-corona)" />

        {[0, 1.5, 3.0].map((delay, i) => (
          <circle
            key={`rip-${i}`}
            cx={cx}
            cy={cy}
            r="52"
            fill="none"
            stroke="#ffffff"
            opacity="0"
          >
            <animate attributeName="r" values="52;104" dur="4.5s" begin={`${delay}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0" dur="4.5s" begin={`${delay}s`} repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="1.4;0.3" dur="4.5s" begin={`${delay}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {PLANETS.map((p) => {
          const C = 2 * Math.PI * p.r;
          const T_LONG = p.trail;
          const planetDeg = p.dir === 1 ? T_LONG : 0;
          const rad = (planetDeg * Math.PI) / 180;
          const px = cx + p.r * Math.cos(rad);
          const py = cy + p.r * Math.sin(rad);
          const fromAng = p.start;
          const toAng = p.start + 360 * p.dir;
          const labFrom = -p.start;
          const labTo = -p.start - 360 * p.dir;
          const L_long = T_LONG / 360 * C;

          return (
            <g key={`pl-${p.id}`}>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`${fromAng} ${cx} ${cy}`}
                to={`${toAng} ${cx} ${cy}`}
                dur={`${p.dur}s`}
                repeatCount="indefinite"
              />
              <circle
                cx={cx}
                cy={cy}
                r={p.r}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray={`${L_long} ${C - L_long}`}
                strokeDashoffset={0}
                opacity="0.32"
                strokeLinecap="round"
              />
              <g transform={`translate(${px.toFixed(2)},${py.toFixed(2)})`}>
                <circle r={p.size + 8} fill={p.tint} opacity="0.18" />
                <circle r={p.size + 3} fill={p.tint} opacity="0.28" filter="url(#head-glow)" />
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur={`${p.spin}s`}
                    repeatCount="indefinite"
                  />
                  <circle r={p.size} fill="url(#planet-grad)" stroke={p.tint} strokeWidth="0.6" />
                  <ellipse
                    cx={-p.size * 0.35}
                    cy={-p.size * 0.35}
                    rx={p.size * 0.32}
                    ry={p.size * 0.22}
                    fill="white"
                    opacity="0.45"
                  />
                  <ellipse
                    cx={p.size * 0.45}
                    cy={p.size * 0.35}
                    rx={p.size * 0.18}
                    ry={p.size * 0.12}
                    fill="#1a1a2e"
                    opacity="0.35"
                  />
                </g>
                {p.label && (
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`${labFrom}`}
                      to={`${labTo}`}
                      dur={`${p.dur}s`}
                      repeatCount="indefinite"
                    />
                    <text
                      x="0"
                      y={p.size + 14}
                      textAnchor="middle"
                      fontFamily="var(--font-dm-mono), ui-monospace, monospace"
                      fontSize="9"
                      fill="#cfcfd6"
                      style={{ letterSpacing: "0.1em" }}
                    >
                      {p.label}
                    </text>
                  </g>
                )}
              </g>
            </g>
          );
        })}

        <g transform={`translate(${cx},${cy})`}>
          <circle r="78" fill="url(#sun-core)" opacity="0.5" filter="url(#sun-glow)">
            <animate attributeName="r" values="74;84;74" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle r="56" fill="url(#sun-core)">
            <animate attributeName="opacity" values="0.85;1;0.85" dur="2.6s" repeatCount="indefinite" />
          </circle>
          <circle r="53" fill="#000000" stroke="#ffffff" strokeWidth="1.4">
            <animate attributeName="stroke-width" values="1.2;2;1.2" dur="3s" repeatCount="indefinite" />
          </circle>
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fontFamily="var(--font-dm-mono), ui-monospace, monospace"
            fontSize="17"
            fontWeight="500"
            fill="#ffffff"
            style={{ letterSpacing: "0.02em" }}
          >
            $0.001
          </text>
        </g>
      </svg>
      <div className="orbit-caption">11 AI crawlers · orbiting your paywall</div>
    </div>
  );
}
