import dynamic from "next/dynamic";
import "../api-keys.css";

function ApiKeysLoading() {
  return (
    <main className="db-shell">
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--gray)",
          fontFamily: "var(--font-dm-sans, sans-serif)",
          fontSize: "14px",
        }}
      >
        Loading API Keys…
      </div>
    </main>
  );
}

const ConnectApiKeysPage = dynamic(
  () => import("./connect-api-keys-content"),
  {
    ssr: false,
    loading: () => <ApiKeysLoading />,
  }
);

export default function ApiKeysPage() {
  return <ConnectApiKeysPage />;
}
