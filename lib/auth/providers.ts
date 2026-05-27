export const ALLOWED_SOCIAL_PROVIDERS = [
  "google",
  "github",
  "twitter",
  "telegram",
] as const;

export type SocialProvider = (typeof ALLOWED_SOCIAL_PROVIDERS)[number];

export function isSocialProvider(value: string): value is SocialProvider {
  return (ALLOWED_SOCIAL_PROVIDERS as readonly string[]).includes(value);
}
