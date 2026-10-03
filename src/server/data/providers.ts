import "server-only";

import { google } from "googleapis";
import Papa from "papaparse";
import { createHash } from "node:crypto";
import { z } from "zod";

import { env } from "@/env";
import { dataLimits, type Cell, type Origin, type Table, tableSchema } from "@/lib/data";

const numberPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
const booleanPattern = /^(true|false)$/i;

google.options({
  timeout: 10_000,
  maxContentLength: dataLimits.maxBytes,
});

export type LoadedSource = { table: Table; name: string };

function fail(message: string): never {
  throw new Error(message);
}

function checkTableLimits(columns: string[], rows: string[][]) {
  if (columns.length === 0) fail("The source must contain at least one column.");
  if (columns.length > dataLimits.maxColumns)
    fail(`Sources may contain at most ${dataLimits.maxColumns} columns.`);
  if (rows.length > dataLimits.maxRows)
    fail(`Sources may contain at most ${dataLimits.maxRows} rows.`);
  if (rows.length * columns.length > dataLimits.maxCells) {
    fail(`Sources may contain at most ${dataLimits.maxCells} cells.`);
  }
}

function inferCell(value: string): Cell {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (booleanPattern.test(trimmed)) return trimmed.toLowerCase() === "true";
  if (numberPattern.test(trimmed) && !/^0\d+/.test(trimmed)) {
    const number = Number(trimmed);
    if (Number.isFinite(number)) return number;
  }
  return value;
}

function inferKind(values: Cell[]): "string" | "number" | "boolean" {
  const present = values.filter((value): value is Exclude<Cell, null> => value !== null);
  if (present.length > 0 && present.every((value) => typeof value === "number")) return "number";
  if (present.length > 0 && present.every((value) => typeof value === "boolean")) return "boolean";
  return "string";
}

export function parseCsv(text: string): Table {
  const normalized = text.replace(/^\uFEFF/, "");
  const parsed = Papa.parse<string[]>(normalized, {
    delimiter: ",",
    skipEmptyLines: "greedy",
  });
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    fail(`The CSV could not be parsed${first?.message ? `: ${first.message}` : "."}`);
  }
  const rows = parsed.data;
  const headers = (rows[0] ?? []).map((header) => header.trim());
  if (headers.some((header) => header.length === 0)) fail("CSV headers cannot be blank.");
  if (new Set(headers).size !== headers.length) fail("CSV headers must be unique.");
  const body = rows.slice(1);
  checkTableLimits(headers, body);
  if (body.some((row) => row.length !== headers.length)) {
    fail("CSV rows must all contain the same number of columns.");
  }
  const inferred = body.map((row) => row.map(inferCell));
  const kinds = headers.map((key, index) => inferKind(inferred.map((row) => row[index] ?? null)));
  const values = body.map((row) =>
    row.map((value, index) =>
      kinds[index] === "string" ? (value === "" ? null : value) : inferCell(value),
    ),
  );
  const columns = headers.map((key, index) => ({
    key,
    kind: kinds[index] ?? "string",
  }));
  const table = tableSchema.parse({ columns, rows: values });
  if (JSON.stringify(table).length > dataLimits.maxSnapshotBytes)
    fail("The parsed source is too large to save.");
  return table;
}

function parseSheetUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname !== "docs.google.com" || !parsed.pathname.startsWith("/spreadsheets/d/")) {
    fail("Use a Google Sheets sharing URL.");
  }
  const spreadsheetId = parsed.pathname.split("/")[3];
  if (!spreadsheetId) fail("The Google Sheet URL is missing its spreadsheet ID.");
  const gid = parsed.searchParams.get("gid") ?? parsed.hash.match(/gid=(\d+)/)?.[1] ?? "0";
  if (!/^\d+$/.test(gid)) fail("The Google Sheet tab ID must be numeric.");
  return { spreadsheetId, sheetId: Number(gid) };
}

function parseDriveUrl(url: string) {
  const parsed = new URL(url);
  const fileId = parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? parsed.searchParams.get("id");
  if (parsed.hostname !== "drive.google.com" || !fileId) fail("Use a Google Drive file URL.");
  return { fileId, resourceKey: parsed.searchParams.get("resourcekey") };
}

async function readResponse(response: Response): Promise<string> {
  if (!response.ok) fail(`The source could not be fetched (${response.status}).`);
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > dataLimits.maxBytes)
    fail(`Sources may contain at most ${dataLimits.maxBytes} bytes.`);
  if (response.headers.get("content-type")?.includes("text/html")) {
    fail("The source returned an HTML login page. Check that the Google Sheet is public.");
  }
  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > dataLimits.maxBytes) {
      fail(`Sources may contain at most ${dataLimits.maxBytes} bytes.`);
    }
    return text;
  }
  const readChunks = async (chunks: Uint8Array[], size: number): Promise<Uint8Array[]> => {
    const next = await reader.read();
    if (next.done) return chunks;
    const nextSize = size + next.value.byteLength;
    if (nextSize > dataLimits.maxBytes) {
      await reader.cancel();
      fail(`Sources may contain at most ${dataLimits.maxBytes} bytes.`);
    }
    return readChunks(chunks.concat(next.value), nextSize);
  };
  const chunks = await readChunks([], 0);
  const size = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function responseFilename(response: Response): string | null {
  const header = response.headers.get("content-disposition");
  if (!header) return null;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded.replaceAll('"', ""));
  return (
    header.match(/filename="([^"]+)"/i)?.[1] ??
    header.match(/filename=([^;]+)/i)?.[1]?.trim() ??
    null
  );
}

function serviceAccount() {
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    fail(
      "Private Google sources need GOOGLE_SERVICE_ACCOUNT_JSON and a file shared with that account.",
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch {
    fail("GOOGLE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON.");
  }
  const record = z
    .object({ client_email: z.string().min(1), private_key: z.string().min(1) })
    .safeParse(parsed);
  if (!record.success)
    fail("GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key.");
  return record.data;
}

async function loadPrivateSheet(
  origin: Extract<Origin, { kind: "google-sheet" }>,
): Promise<LoadedSource> {
  const credentials = serviceAccount();
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: origin.spreadsheetId,
    fields: "properties.title,sheets.properties(sheetId,title)",
  });
  const metadataSheets: unknown[] = z.array(z.unknown()).parse(metadata.data.sheets ?? []);
  const selected = metadataSheets
    .map((sheet) =>
      z
        .object({ properties: z.object({ sheetId: z.number(), title: z.string() }) })
        .safeParse(sheet),
    )
    .find((sheet) => sheet.success && sheet.data.properties.sheetId === origin.sheetId);
  if (!selected || !selected.success) fail("The selected Google Sheet tab does not exist.");
  const title = selected.data.properties.title.replaceAll("'", "''");
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: origin.spreadsheetId,
    range: origin.range ?? `'${title}'`,
    majorDimension: "ROWS",
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const values: unknown[][] = z.array(z.array(z.unknown())).parse(response.data.values ?? []);
  return {
    table: parseValues(values),
    name: metadata.data.properties?.title ?? `Google Sheet ${origin.spreadsheetId}`,
  };
}

function parseValues(values: unknown[][]): Table {
  const rows = values.map((row) =>
    row.map((value) => {
      if (value === null || value === undefined) return "";
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
        return String(value);
      return JSON.stringify(value);
    }),
  );
  const width = Math.max(...rows.map((row) => row.length), 0);
  const normalized = rows.map((row) =>
    row.concat(Array.from({ length: width - row.length }, () => "")),
  );
  return parseCsv(Papa.unparse(normalized));
}

async function loadDriveCsv(
  origin: Extract<Origin, { kind: "google-drive-csv" }>,
): Promise<LoadedSource> {
  const credentials = serviceAccount();
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });
  const metadata = await drive.files.get({
    fileId: origin.fileId,
    fields: "id,name,mimeType",
    ...(origin.resourceKey ? { resourceKey: origin.resourceKey } : {}),
  });
  if (metadata.data.mimeType !== "text/csv" && metadata.data.mimeType !== "application/csv") {
    fail("The Drive file must be a CSV.");
  }
  const response = await drive.files.get(
    {
      fileId: origin.fileId,
      alt: "media",
      ...(origin.resourceKey ? { resourceKey: origin.resourceKey } : {}),
    },
    { responseType: "arraybuffer" },
  );
  const bytes = new Uint8Array(z.instanceof(ArrayBuffer).parse(response.data));
  if (bytes.byteLength > dataLimits.maxBytes)
    fail(`Sources may contain at most ${dataLimits.maxBytes} bytes.`);
  return {
    table: parseCsv(new TextDecoder().decode(bytes)),
    name: metadata.data.name ?? `Drive CSV ${origin.fileId}`,
  };
}

export async function loadSource(origin: Origin): Promise<LoadedSource> {
  switch (origin.kind) {
    case "csv-upload":
      fail("CSV uploads are parsed before their origin is persisted.");
    case "google-sheet":
      if (origin.access === "service-account") return loadPrivateSheet(origin);
      {
        const { spreadsheetId, sheetId } = parseSheetUrl(origin.originalUrl);
        const response = await fetch(
          `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/export?format=csv&gid=${sheetId}`,
          { signal: AbortSignal.timeout(10_000) },
        );
        return {
          table: parseCsv(await readResponse(response)),
          name: responseFilename(response) ?? `Google Sheet ${spreadsheetId}`,
        };
      }
    case "google-drive-csv":
      return loadDriveCsv(origin);
    default: {
      const exhaustive: never = origin;
      return exhaustive;
    }
  }
}

export function digestTable(table: Table): string {
  return createHash("sha256").update(JSON.stringify(table)).digest("hex");
}

export function sheetOrigin(
  url: string,
  access: "public" | "service-account",
): Extract<Origin, { kind: "google-sheet" }> {
  const { spreadsheetId, sheetId } = parseSheetUrl(url);
  return { kind: "google-sheet", originalUrl: url, spreadsheetId, sheetId, range: null, access };
}

export function driveOrigin(url: string): Extract<Origin, { kind: "google-drive-csv" }> {
  const { fileId, resourceKey } = parseDriveUrl(url);
  return {
    kind: "google-drive-csv",
    originalUrl: url,
    fileId,
    resourceKey,
    access: "service-account",
  };
}
