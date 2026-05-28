import dynamic from "next/dynamic";

function ApiKeysLoading() {
  return (
    <main className="db-shell">
      <div
        className="flex min-h-[40vh] items-center justify-center"
        style={{ color: "var(--gray)" }}
      >
        Loading…
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
