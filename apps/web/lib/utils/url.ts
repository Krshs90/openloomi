export function normalizeHttpUrl(
  value: string | undefined | null,
): string | null {
  if (!value) return null;

  const trimmed = value
    .trim()
    .replace(/&amp;/gu, "&")
    .replace(/[\[)\],.;，。；]+$/u, "");

  if (!/^https?:\/\//i.test(trimmed)) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;

  const hostname = parsed.hostname.trim().toLowerCase();
  if (!hostname) return null;
  if (/[()[\]\s]/u.test(hostname)) return null;

  const labels = hostname.split(".");
  if (
    labels.some(
      (label) =>
        !label ||
        !/^(?:xn--)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/iu.test(label),
    )
  ) {
    return null;
  }

  return parsed.toString();
}
