export const DEVELOPER_DOCS_URL = "https://developers.zynum.net";
const DEVELOPER_DOCS_HOST = new URL(DEVELOPER_DOCS_URL).hostname;

export function isDeveloperDocsHost(hostname?: string): boolean {
  const currentHostname = hostname
    ?? (typeof window === "undefined" ? "" : window.location.hostname);

  return currentHostname.toLowerCase() === DEVELOPER_DOCS_HOST;
}