"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Check, Loader2, Lock, Upload } from "lucide-react";

const ACCEPTED = [".json", ".csv", ".md", ".pdf"] as const;
const STEP_DELAY_MS = 1000;

type Phase = "idle" | "running" | "success";
type LogStep = 0 | 1 | 2 | 3 | 4;

function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED.some((ext) => lower.endsWith(ext));
}

function fakeIpfsCid(): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let tail = "";
  for (let i = 0; i < 44; i++) {
    tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `Qm${tail.slice(0, 4)}…${tail.slice(-4)}`;
}

function fakeStoryVaultId(): number {
  return 1000 + Math.floor(Math.random() * 1500);
}

function metaTagFor(vaultId: number): string {
  return `<meta name="x-crawlpay-vault" content="${vaultId}">`;
}

export function VaultUploader() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [logStep, setLogStep] = useState<LogStep>(0);
  const [cid, setCid] = useState<string | null>(null);
  const [vaultId, setVaultId] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

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
    setFile(next);
    setFileError(null);
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

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
  };

  const runPipeline = () => {
    if (!file || phase === "running") return;

    clearTimers();
    setPhase("running");
    setLogStep(1);
    setCid(null);
    setVaultId(null);

    schedule(() => setLogStep(2), STEP_DELAY_MS);
    schedule(() => setCid(fakeIpfsCid()), STEP_DELAY_MS * 2);
    schedule(() => setLogStep(3), STEP_DELAY_MS * 2);
    schedule(() => {
      setVaultId(fakeStoryVaultId());
      setLogStep(4);
      setPhase("success");
    }, STEP_DELAY_MS * 3);
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
      <div className="w-full max-w-xl mx-auto">
        <div className="rounded-xl border border-emerald-500/25 bg-zinc-950/80 p-6">
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
              <p className="mt-2 font-mono text-xs text-zinc-500 truncate">ipfs: {cid}</p>
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

          <button
            type="button"
            onClick={() => {
              clearTimers();
              setPhase("idle");
              setFile(null);
              setLogStep(0);
              setCid(null);
              setVaultId(null);
            }}
            className="mt-5 w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
          >
            upload another dataset
          </button>
        </div>
      </div>
    );
  }

  if (phase === "running") {
    const lines: { key: string; text: string; done: boolean; detail?: string }[] = [
      {
        key: "s1",
        text: "[1/3] reading file buffer and preparing local encryption...",
        done: logStep >= 2,
      },
      {
        key: "s2",
        text: "[2/3] content locked. streaming encrypted payload to IPFS decentralized storage...",
        done: logStep >= 3,
        detail: cid ? `cid ${cid}` : undefined,
      },
      {
        key: "s3",
        text: "[3/3] executing story client protocol... server signing access conditions on Story Aeneid testnet...",
        done: logStep >= 4,
        detail: "signer: crawlpay backend (server key) — no browser wallet required",
      },
    ];

    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Lock className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              vault pipeline · live
            </span>
          </div>
          <ul className="space-y-3 font-mono text-xs leading-relaxed">
            {lines.map((line) => {
              const firstIncomplete = lines.find((l) => !l.done)?.key;
              const active = !line.done && firstIncomplete === line.key;
              return (
                <li key={line.key} className="text-zinc-400">
                  <div className="flex items-start gap-2">
                    {line.done ? (
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : active ? (
                      <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-zinc-500" />
                    ) : (
                      <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-zinc-700" />
                    )}
                    <span className={line.done ? "text-zinc-500" : "text-zinc-300"}>
                      {line.text}
                    </span>
                  </div>
                  {line.detail ? (
                    <p className="mt-1 pl-5 text-[11px] text-zinc-600">{line.detail}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {file ? (
            <p className="mt-4 truncate border-t border-zinc-800 pt-3 font-mono text-[11px] text-zinc-600">
              file: {file.name} ({(file.size / 1024).toFixed(1)} kb)
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
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
          runPipeline();
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 py-3 font-mono text-[11px] uppercase tracking-wider text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Lock className="h-3.5 w-3.5" />
        upload to story vault
      </button>
    </div>
  );
}
