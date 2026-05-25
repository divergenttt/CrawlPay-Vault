type LogoMarkProps = {
  size?: number;
  color?: string;
};

export function LogoMark({
  size = 18,
  color = "var(--accent)",
}: LogoMarkProps) {
  return (
    <svg
      className="logo-hex"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 3 L3 12 L7 21 L11 21 L11 18 L8 18 L5 12 L8 6 L11 6 L11 3 Z"
        fill={color}
      />
      <path
        d="M17 3 L21 12 L17 21 L13 21 L13 18 L16 18 L19 12 L16 6 L13 6 L13 3 Z"
        fill={color}
      />
    </svg>
  );
}
