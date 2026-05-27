export type ApiKeyRecord = {
  id: string;
  name: string;
  /** Full secret — only shown while `revealed` is true */
  token: string;
  createdAt: Date;
  revealed: boolean;
};

export function generateKeyId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `key_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function generateMockToken(): string {
  const hex = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
  return `cr_live_${hex}`;
}

export function maskToken(token: string): string {
  const suffix = token.replace(/^cr_live_/, "").slice(-4);
  return `cr_live_••••••••••••••••${suffix}`;
}

export function formatCreatedAt(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function nextKeyName(existingCount: number): string {
  return `Agent_Key_${existingCount + 1}`;
}
