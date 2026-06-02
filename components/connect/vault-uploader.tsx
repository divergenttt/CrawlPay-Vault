"use client";

import Link from "next/link";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { Check, Loader2, Lock, Upload } from "lucide-react";
import { VaultBotPayContext } from "@/components/connect/vault-bot-pay-demo";
import { authFetch } from "@/lib/auth/client";
import {
  shortenIpfsCid,
  VAULT_UPLOAD_MAX_BYTES,
  VAULT_UPLOAD_MAX_MB,
} from "@/lib/vault/upload-limits";

const ACCEPTED = [".json", ".csv", ".md", ".pdf"] as const;
const STEP_DELAY_MS = 600;

type Phase = "idle" | "running" | "success" | "error";
type LogStep = 0 | 1 | 2 | 3 | 4;

type UploadResponse = {
  uuid: number;
  cid: string;
};

function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED.some((ext) => lower.endsWith(ext));
}

function metaTagFor(vaultId: number): string {
  return `<meta name="x-crawlpay-vault" content="${vaultId}">`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function authErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "Not authenticated") {
      return "sign in required — use the same session as api keys";
    }
    return err.message;
  }
  return "upload failed";
}

const PIPELINE_LINES = [
  {
    key: "s1",
    text: "[1/3] reading file buffer and preparing local encryption...",
    minH: "min-h-[52px]",
    subline: null,
  },
  {
    key: "s2",
    text: "[2/3] content locked. streaming encrypted payload to IPFS decentralized storage...",
    minH: "min-h-[76px]",
    subline: "cid" as const,
  },
  {
    key: "s3",
    text: "[3/3] executing story client protocol... server signing access conditions on Story Aeneid testnet...",
    minH: "min-h-[76px]",
    subline: "signer" as const,
  },
] as const;

function VaultUploaderShell({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-xl mx-auto min-h-[28rem]">{children}</div>;
}

/** Fixed slot = one line of text-xs / leading-relaxed — icons must not shift between states. */
const STEP_ICON_SLOT = "inline-flex h-[1.21875rem] w-3.5 shrink-0 items-center justify-center";

function StepStatusIcon({ status }: { status: "done" | "active" | "pending" }) {
  return (
    <span className={STEP_ICON_SLOT} aria-hidden>
      {status === "done" ? (
        <Check className="size-3.5 shrink-0 text-emerald-500" strokeWidth={2} />
      ) : status === "active" ? (
        <Loader2
          className="size-3.5 shrink-0 origin-center animate-spin text-zinc-400"
          strokeWidth={2}
        />
      ) : (
        <span className="size-3.5 shrink-0 rounded-full border border-zinc-700/80 box-border" />
      )}
    </span>
  );
}

function PipelinePanel({
  logStep,
  cid,
  fileName,
  fileSizeKb,
}: {
  logStep: LogStep;
  cid: string | null;
  fileName: string | null;
  fileSizeKb: string | null;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 min-h-[300px] flex flex-col">
      <div className="mb-3 flex shrink-0 items-center gap-2 border-b border-zinc-800 pb-3">
        <Lock className="h-3.5 w-3.5 text-zinc-500" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          vault pipeline · live
        </span>
      </div>
      <ul className="min-h-[228px] space-y-0 font-mono text-xs leading-relaxed">
        {PIPELINE_LINES.map((line, index) => {
          const stepNum = index + 1;
          const done = logStep > stepNum;
          const active = logStep === stepNum;
          const status: "done" | "active" | "pending" = done
            ? "done"
            : active
              ? "active"
              : "pending";

          const sublineText =
            line.subline === "cid"
              ? cid
                ? `cid ${cid}`
                : "pinning to ipfs…"
              : line.subline === "signer"
                ? "signer: crawlpay backend (server key) — no browser wallet required"
                : null;

          return (
            <li key={line.key} className={`${line.minH} py-1 text-zinc-400`}>
              <div className="flex gap-2">
                <StepStatusIcon status={status} />
                <span
                  className={`min-w-0 flex-1 pt-px leading-relaxed ${
                    done ? "text-zinc-500" : "text-zinc-300"
                  }`}
                >
                  {line.text}
                </span>
              </div>
              <p
                className={`mt-1.5 min-h-[18px] pl-[22px] text-[11px] leading-4 text-zinc-600 ${
                  line.subline ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden={line.subline ? undefined : true}
              >
                {sublineText ?? "\u00a0"}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-auto shrink-0 truncate border-t border-zinc-800 pt-3 font-mono text-[11px] text-zinc-600 min-h-[32px]">
        {fileName ? `file: ${fileName} (${fileSizeKb} kb)` : "\u00a0"}
      </p>
    </div>
  );
}

export function VaultUploader() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [logStep, setLogStep] = useState<LogStep>(0);
  const [cid, setCid] = useState<string | null>(null);
  const [fullCid, setFullCid] = useState<string | null>(null);
  const [vaultId, setVaultId] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pickFile = useCallback((next: File | null) => {
    if (!next) {
      setFile(null);
      setFileError(null);
      return;
    }
    if (!hasAcceptedExtension(next.name)) {
      setFile(null);
      setFileError("only .json, .csv, .md, or .pdf accepted");
      return;
    }
    if (next.size > VAULT_UPLOAD_MAX_BYTES) {
      setFile(null);
      setFileError(`max file size ${VAULT_UPLOAD_MAX_MB} MB`);
      return;
    }
    setFile(next);
    setFileError(null);
    setPipelineError(null);
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const resetToIdle = useCallback(() => {
    abortRef.current = true;
    setPhase("idle");
    setFile(null);
    setLogStep(0);
    setCid(null);
    setFullCid(null);
    setVaultId(null);
    setPipelineError(null);
  }, []);

  const runPipeline = async () => {
    if (!file || phase === "running") return;

    abortRef.current = false;
    setPipelineError(null);
    setPhase("running");
    setLogStep(1);
    setCid(null);
    setFullCid(null);
    setVaultId(null);

    try {
      await sleep(STEP_DELAY_MS);
      if (abortRef.current) return;
      setLogStep(2);

      await sleep(STEP_DELAY_MS);
      if (abortRef.current) return;
      setLogStep(3);

      const formData = new FormData();
      formData.append("file", file);

      const res = await authFetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });

      const body = (await res.json().catch(() => ({}))) as UploadResponse & {
        error?: string;
      };

      if (abortRef.current) return;

      if (!res.ok) {
        throw new Error(body.error ?? `upload failed (${res.status})`);
      }

      if (!Number.isFinite(body.uuid) || !body.cid) {
        throw new Error("invalid server response");
      }

      setFullCid(body.cid);
      setCid(shortenIpfsCid(body.cid));
      setVaultId(body.uuid);
      setLogStep(4);
      setPhase("success");
    } catch (err) {
      if (abortRef.current) return;
      setPipelineError(authErrorMessage(err));
      setPhase("error");
      setLogStep(0);
    }
  };

  const copyMeta = async () => {
    if (vaultId == null) return;
    const text = metaTagFor(vaultId);
    if (navigator.clipboard) await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const metaSource = vaultId != null ? metaTagFor(vaultId) : "";

  if (phase === "success" && vaultId != null) {
    return (
      <VaultUploaderShell>
        <div className="rounded-xl border border-emerald-500/25 bg-zinc-950/80 p-6 min-h-[28rem] flex flex-col">
          <div className="flex items-start gap-3 mb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <Check className="h-4 w-4 text-emerald-400" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-50 lowercase tracking-tight">
                data successfully registered on story cdr 🔒
              </p>
              <p className="mt-1 text-xs text-zinc-500 lowercase">
                humans: pass · bots: pay · asset id is numeric on story aeneid
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 mb-1">
              story asset id
            </p>
            <p className="font-mono text-2xl text-zinc-50">
              vault id: <span className="text-emerald-400">#{vaultId}</span>
            </p>
            {cid ? (
              <p className="mt-2 font-mono text-xs text-zinc-500 truncate" title={fullCid ?? cid}>
                ipfs: {cid}
              </p>
            ) : null}
          </div>

          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
            copy html tag
          </p>
          <div className="ag-codeblock">
            <div className="ag-codebar">
              <span className="ag-codebar-lang">
                <span
                  className="dot"
                  style={{ background: "#4af0a8", boxShadow: "0 0 8px #4af0a8" }}
                />
                html
              </span>
              <button
                type="button"
                className={`ag-copy${copied ? " copied" : ""}`}
                onClick={() => void copyMeta()}
              >
                {copied ? "✓ copied" : "copy"}
              </button>
            </div>
            <pre className="ag-code text-sm text-zinc-300">{metaSource}</pre>
          </div>

          <VaultBotPayContext vaultId={vaultId} className="mt-5" />

          <button
            type="button"
            onClick={resetToIdle}
            className="mt-5 w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
          >
            upload another dataset
          </button>
        </div>
      </VaultUploaderShell>
    );
  }

  if (phase === "error" && pipelineError) {
    return (
      <VaultUploaderShell>
        <div className="rounded-xl border border-red-500/25 bg-zinc-950 p-5 min-h-[28rem] flex flex-col justify-center">
          <p className="font-mono text-xs text-red-400/90 lowercase">{pipelineError}</p>
          {pipelineError.includes("sign in") ? (
            <p className="mt-3 text-xs text-zinc-500 lowercase">
              <Link href="/connect/api-keys" className="text-zinc-300 underline" data-page-link>
                → api keys / sign in
              </Link>
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setPhase("idle");
              setPipelineError(null);
            }}
            className="mt-4 w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400 hover:border-zinc-700"
          >
            try again
          </button>
        </div>
      </VaultUploaderShell>
    );
  }

  if (phase === "running") {
    return (
      <VaultUploaderShell>
        <PipelinePanel
          logStep={logStep}
          cid={cid}
          fileName={file?.name ?? null}
          fileSizeKb={file ? (file.size / 1024).toFixed(1) : null}
        />
      </VaultUploaderShell>
    );
  }

  return (
    <VaultUploaderShell>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "cursor-pointer rounded-xl border border-dashed px-6 py-12 text-center transition-colors",
          "bg-zinc-950",
          dragOver ? "border-zinc-700" : "border-zinc-800 hover:border-zinc-700",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={onInputChange}
        />
        <Upload className="mx-auto mb-4 h-8 w-8 text-zinc-600" strokeWidth={1.5} />
        <p className="text-sm text-zinc-400 lowercase">
          drop data or documentation here to lock in story vault (.json, .csv, .md, .pdf)
        </p>
        <p className="mt-2 font-mono text-[11px] text-zinc-600">or click to browse</p>
        <p className="mt-2 font-mono text-[11px] text-zinc-600 lowercase">
          only technical datasets or text documents accepted
        </p>
        {file ? (
          <p className="mt-3 font-mono text-xs text-zinc-500">{file.name}</p>
        ) : null}
        {fileError ? (
          <p className="mt-2 font-mono text-xs text-red-400/90">{fileError}</p>
        ) : null}
      </div>

      <button
        type="button"
        disabled={!file}
        onClick={(e) => {
          e.stopPropagation();
          void runPipeline();
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 py-3 font-mono text-[11px] uppercase tracking-wider text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Lock className="h-3.5 w-3.5" />
        upload to story vault
      </button>
      <p className="mt-2 text-center font-mono text-[10px] text-zinc-600 lowercase">
        requires sign-in · server encrypts &amp; registers on story aeneid
      </p>
    </VaultUploaderShell>
  );
}
