export const googleConnectionPath = "/dashboard/integrations";

export const googleScopes = {
  calendar: ["https://www.googleapis.com/auth/calendar.events.readonly"],
  files: [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
};

export type GoogleCapability = keyof typeof googleScopes;

const scopeAlternatives: Record<string, string[]> = {
  "https://www.googleapis.com/auth/calendar.events.readonly": [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar",
  ],
  "https://www.googleapis.com/auth/spreadsheets.readonly": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
  "https://www.googleapis.com/auth/drive.readonly": ["https://www.googleapis.com/auth/drive"],
};

export function hasGoogleAccess(scopes: string[], capability: GoogleCapability) {
  return googleScopes[capability].every((scope) =>
    [scope, ...(scopeAlternatives[scope] ?? [])].some((candidate) => scopes.includes(candidate)),
  );
}
