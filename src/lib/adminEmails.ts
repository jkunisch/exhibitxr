const DEFAULT_ADMIN_EMAILS = [
  "jonatankunisch@gmail.com",
  "demo@exhibitxr.com",
];

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function parseAdminEmails(raw: string | undefined): Set<string> {
  const configured = (raw ?? "")
    .split(/[,\s;]+/)
    .map((entry) => normalizeEmail(entry))
    .filter((entry) => entry.length > 0);

  if (configured.length > 0) {
    return new Set(configured);
  }

  return new Set(DEFAULT_ADMIN_EMAILS.map((entry) => normalizeEmail(entry)));
}

export function getAdminEmails(raw: string | undefined = process.env.ADMIN_EMAILS): string[] {
  return [...parseAdminEmails(raw)];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (typeof email !== "string") {
    return false;
  }

  return parseAdminEmails(process.env.ADMIN_EMAILS).has(normalizeEmail(email));
}
