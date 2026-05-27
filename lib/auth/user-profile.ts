import type { User } from "@privy-io/react-auth";

export type AuthProvider = "google" | "github" | "twitter" | "telegram";

export type UserProfile = {
  displayName: string;
  subtitle: string;
  provider: AuthProvider;
  providerLabel: string;
  avatarUrl: string | null;
  initials: string;
  accentColor: string;
};

const PROVIDER_META: Record<
  AuthProvider,
  { label: string; accentColor: string }
> = {
  google: { label: "Google", accentColor: "#4285f4" },
  github: { label: "GitHub", accentColor: "#e6edf3" },
  twitter: { label: "X", accentColor: "#1d9bf0" },
  telegram: { label: "Telegram", accentColor: "#29b6f6" },
};

type LinkedAccount = {
  type?: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  profilePictureUrl?: string | null;
  photoUrl?: string | null;
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function providerFromAccountType(type: string): AuthProvider | null {
  const t = type.toLowerCase();
  if (t.includes("google")) return "google";
  if (t.includes("github")) return "github";
  if (t.includes("twitter")) return "twitter";
  if (t.includes("telegram")) return "telegram";
  return null;
}

function profileFromProvider(
  provider: AuthProvider,
  data: {
    displayName?: string | null;
    subtitle?: string | null;
    avatarUrl?: string | null;
  }
): UserProfile {
  const meta = PROVIDER_META[provider];
  const displayName =
    data.displayName?.trim() ||
    data.subtitle?.trim() ||
    meta.label;
  const subtitle = data.subtitle?.trim() || `Signed in via ${meta.label}`;

  return {
    displayName,
    subtitle,
    provider,
    providerLabel: meta.label,
    avatarUrl: data.avatarUrl ?? null,
    initials: initialsFrom(displayName),
    accentColor: meta.accentColor,
  };
}

function fromLinkedAccount(account: LinkedAccount): UserProfile | null {
  if (!account.type) return null;
  const provider = providerFromAccountType(account.type);
  if (!provider) return null;

  const username = account.username?.trim();
  const email = account.email?.trim();
  const name = account.name?.trim();
  const avatarUrl = account.profilePictureUrl ?? account.photoUrl ?? null;

  if (provider === "google") {
    return profileFromProvider(provider, {
      displayName: name || email?.split("@")[0],
      subtitle: email,
      avatarUrl,
    });
  }

  if (provider === "github" || provider === "twitter") {
    const handle = username ? `@${username.replace(/^@/, "")}` : undefined;
    return profileFromProvider(provider, {
      displayName: name || username,
      subtitle: handle ?? email,
      avatarUrl,
    });
  }

  return profileFromProvider(provider, {
    displayName: name || username,
    subtitle: username ? `@${username.replace(/^@/, "")}` : undefined,
    avatarUrl,
  });
}

/** Resolve display name, avatar, and OAuth provider from a Privy user. */
export function getPrivyUserProfile(
  user: User | null | undefined
): UserProfile | null {
  if (!user) return null;

  const u = user as User & {
    linkedAccounts?: LinkedAccount[];
    github?: {
      username?: string | null;
      name?: string | null;
      profilePictureUrl?: string | null;
    };
    twitter?: {
      username?: string | null;
      name?: string | null;
      profilePictureUrl?: string | null;
    };
    telegram?: {
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      photoUrl?: string | null;
    };
  };

  const oauthAccounts = (u.linkedAccounts ?? []).filter((a) => {
    const t = (a.type ?? "").toLowerCase();
    return (
      t.includes("oauth") ||
      t.includes("google") ||
      t.includes("github") ||
      t.includes("twitter") ||
      t.includes("telegram")
    );
  });

  for (const account of oauthAccounts) {
    const profile = fromLinkedAccount(account);
    if (profile) return profile;
  }

  if (u.google?.email || u.google?.name) {
    return profileFromProvider("google", {
      displayName: u.google.name ?? u.google.email?.split("@")[0],
      subtitle: u.google.email ?? undefined,
      avatarUrl: null,
    });
  }

  if (u.github?.username || u.github?.name) {
    const username = u.github.username ?? undefined;
    return profileFromProvider("github", {
      displayName: u.github.name ?? username,
      subtitle: username ? `@${username.replace(/^@/, "")}` : undefined,
      avatarUrl: u.github.profilePictureUrl ?? null,
    });
  }

  if (u.twitter?.username || u.twitter?.name) {
    const username = u.twitter.username ?? undefined;
    return profileFromProvider("twitter", {
      displayName: u.twitter.name ?? username,
      subtitle: username ? `@${username.replace(/^@/, "")}` : undefined,
      avatarUrl: u.twitter.profilePictureUrl ?? null,
    });
  }

  if (u.telegram?.username || u.telegram?.firstName) {
    const name = [u.telegram.firstName, u.telegram.lastName]
      .filter(Boolean)
      .join(" ");
    return profileFromProvider("telegram", {
      displayName: name || u.telegram.username,
      subtitle: u.telegram.username
        ? `@${u.telegram.username.replace(/^@/, "")}`
        : undefined,
      avatarUrl: u.telegram.photoUrl ?? null,
    });
  }

  const email = u.email?.address;
  if (email) {
    return profileFromProvider("google", {
      displayName: email.split("@")[0],
      subtitle: email,
      avatarUrl: null,
    });
  }

  return null;
}
