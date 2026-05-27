export default function ConnectLoading() {
  return (
    <div
      className="db-shell"
      style={{
        paddingTop: 130,
        fontFamily: "var(--font-dm-mono), monospace",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--gray)",
      }}
    >
      Loading Connect…
    </div>
  );
}
