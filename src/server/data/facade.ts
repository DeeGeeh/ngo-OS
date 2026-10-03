import "server-only";

import { createClient, type Client, type Row } from "@libsql/client";
import { randomUUID } from "node:crypto";

import { env } from "@/env";
import {
  addSourceSchema,
  dashboardDefinitionSchema,
  dataLibrarySchema,
  dataLimits,
  dashboardViewSchema,
  resultSchema,
  sourceSchema,
  sourceStatusSchema,
  sourceSummarySchema,
  type AddSource,
  type Aggregate,
  type Cell,
  type Check,
  type DashboardDefinition,
  type DashboardNode,
  type DashboardView,
  type DataLibrary,
  type Origin,
  type Result,
  type Select,
  type Snapshot,
  type Source,
  type SourceInspection,
  type SourceStatus,
  type Table,
} from "@/lib/data";

import { digestTable, driveOrigin, loadSource, parseCsv, sheetOrigin } from "./providers";

type StoredSource = {
  source: Source;
  lastSuccessAt: string | null;
};

type StoredDashboard = { id: string; title: string; nodes: DashboardDefinition["nodes"] };

async function openDataClient() {
  const client = createClient({ url: env.WORKSPACE_DATABASE_URL });
  await client.batch([
    `CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL CHECK (json_valid(data)),
      last_success_at TEXT,
      refresh_started_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS data_dashboards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      nodes TEXT NOT NULL CHECK (json_valid(nodes))
    )`,
  ]);
  return client;
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") throw new Error("The stored data record is invalid.");
  return JSON.parse(value);
}

function parseSourceRow(row: Row): StoredSource {
  const source = sourceSchema.parse(parseJson(row.data));
  const lastSuccessAt = row.last_success_at;
  return {
    source,
    lastSuccessAt: typeof lastSuccessAt === "string" ? lastSuccessAt : null,
  };
}

function parseDashboardRow(row: Row): StoredDashboard {
  return dashboardDefinitionSchema.parse({
    id: row.id,
    title: row.title,
    nodes: parseJson(row.nodes),
  });
}

async function readSource(client: Client, id: string): Promise<StoredSource | null> {
  const result = await client.execute({
    sql: "SELECT data, last_success_at, refresh_started_at FROM data_sources WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? parseSourceRow(row) : null;
}

async function readSources(client: Client): Promise<StoredSource[]> {
  const result = await client.execute(
    "SELECT data, last_success_at, refresh_started_at FROM data_sources ORDER BY id",
  );
  return result.rows.map(parseSourceRow);
}

async function readDashboard(client: Client, id: string): Promise<StoredDashboard | null> {
  const result = await client.execute({
    sql: "SELECT id, title, nodes FROM data_dashboards WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? parseDashboardRow(row) : null;
}

async function readDashboards(client: Client): Promise<StoredDashboard[]> {
  const result = await client.execute(
    "SELECT id, title, nodes FROM data_dashboards ORDER BY title",
  );
  return result.rows.map(parseDashboardRow);
}

function sourceSummary(source: Source) {
  return sourceSummarySchema.parse({ id: source.id, name: source.name, origin: source.origin });
}

function sourceName(origin: Origin) {
  switch (origin.kind) {
    case "csv-upload":
      return origin.filename;
    case "google-sheet":
      return `Google Sheet ${origin.spreadsheetId}`;
    case "google-drive-csv":
      return `Drive CSV ${origin.fileId}`;
    default: {
      const exhaustive: never = origin;
      return exhaustive;
    }
  }
}

function originalUrl(origin: Origin): string | null {
  return origin.kind === "csv-upload" ? null : origin.originalUrl;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message.slice(0, 500)
    : "The source could not be refreshed.";
}

function now() {
  return new Date().toISOString();
}

function isRemote(source: Source) {
  return source.origin.kind !== "csv-upload";
}

function isDue(record: StoredSource, force: boolean) {
  if (!isRemote(record.source) || force) return isRemote(record.source);
  if (record.source.lastCheck?.kind === "failure") {
    return Date.parse(record.source.lastCheck.finishedAt) + dataLimits.refreshMs <= Date.now();
  }
  if (record.source.lastCheck?.kind !== "success") return true;
  return (
    !record.lastSuccessAt || Date.parse(record.lastSuccessAt) + dataLimits.refreshMs <= Date.now()
  );
}

function inferVersion(
  previous: Snapshot | null,
  table: Table,
  digest: string,
  fetchedAt: string,
): Snapshot {
  if (previous?.digest === digest) {
    return { ...previous, table };
  }
  return { version: (previous?.version ?? 0) + 1, fetchedAt, digest, table };
}

async function markRefreshStarted(client: Client, source: Source, startedAt: string) {
  const result = await client.execute({
    sql: "UPDATE data_sources SET refresh_started_at = ? WHERE id = ? AND json_extract(data, '$.revision') = ?",
    args: [startedAt, source.id, source.revision],
  });
  return result.rowsAffected === 1;
}

async function commitRefresh(
  client: Client,
  record: StoredSource,
  startedAt: string,
  snapshot: Snapshot | null,
  check: Check,
  lastSuccessAt: string | null,
) {
  const source = sourceSchema.parse({ ...record.source, snapshot, lastCheck: check });
  const result = await client.execute({
    sql: "UPDATE data_sources SET data = ?, last_success_at = ?, refresh_started_at = NULL WHERE id = ? AND json_extract(data, '$.revision') = ? AND refresh_started_at = ?",
    args: [JSON.stringify(source), lastSuccessAt, source.id, source.revision, startedAt],
  });
  return result.rowsAffected === 1;
}

async function refreshSource(
  client: Client,
  initial: StoredSource,
  force: boolean,
): Promise<StoredSource> {
  if (!isDue(initial, force)) return initial;
  const startedAt = now();
  if (!(await markRefreshStarted(client, initial.source, startedAt))) {
    return (await readSource(client, initial.source.id)) ?? initial;
  }
  try {
    const loaded = await loadSource(initial.source.origin);
    const finishedAt = now();
    const snapshot = inferVersion(
      initial.source.snapshot,
      loaded.table,
      digestTable(loaded.table),
      finishedAt,
    );
    const check: Check = { kind: "success", startedAt, finishedAt };
    await commitRefresh(client, initial, startedAt, snapshot, check, finishedAt);
    return (await readSource(client, initial.source.id)) ?? initial;
  } catch (error) {
    const finishedAt = now();
    const check: Check = {
      kind: "failure",
      startedAt,
      finishedAt,
      message: errorMessage(error),
    };
    await commitRefresh(
      client,
      initial,
      startedAt,
      initial.source.snapshot,
      check,
      initial.lastSuccessAt,
    );
    return (await readSource(client, initial.source.id)) ?? initial;
  }
}

function columnIndex(table: Table, name: string): number {
  const index = table.columns.findIndex((column) => column.key === name);
  if (index < 0) throw new Error(`Column “${name}” does not exist in this source.`);
  return index;
}

function validateFilter(table: Table, filter: { column: string; operator: string; value: Cell }) {
  const column = table.columns[columnIndex(table, filter.column)];
  if (!column) throw new Error(`Column “${filter.column}” does not exist in this source.`);
  if (filter.value === null) {
    if (filter.operator !== "eq" && filter.operator !== "neq") {
      throw new Error("Only equality filters can compare empty cells.");
    }
    return;
  }
  const expected =
    column.kind === "number" ? "number" : column.kind === "boolean" ? "boolean" : "string";
  if (typeof filter.value !== expected)
    throw new Error(`Filter value for “${filter.column}” must be ${expected}.`);
}

function matchesFilter(value: Cell, filter: { operator: "eq" | "neq" | "lt" | "gt"; value: Cell }) {
  if (filter.value === null) return filter.operator === "eq" ? value === null : value !== null;
  if (value === null || typeof value !== typeof filter.value) return false;
  switch (filter.operator) {
    case "eq":
      return value === filter.value;
    case "neq":
      return value !== filter.value;
    case "lt":
      return value < filter.value;
    case "gt":
      return value > filter.value;
    default: {
      const exhaustive: never = filter.operator;
      return exhaustive;
    }
  }
}

function filteredRows(table: Table, filters: Aggregate["filters"]) {
  for (const filter of filters ?? []) validateFilter(table, filter);
  return table.rows.filter((row) =>
    (filters ?? []).every((filter) =>
      matchesFilter(row[columnIndex(table, filter.column)] ?? null, filter),
    ),
  );
}

function numericValue(table: Table, row: Cell[], column: string) {
  const index = columnIndex(table, column);
  const definition = table.columns[index];
  if (definition?.kind !== "number")
    throw new Error(`Column “${column}” must be numeric for this aggregate.`);
  const value = row[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function aggregate(table: Table, query: Aggregate, rows = filteredRows(table, query.filters)) {
  const measure = query.measure;
  if (measure.operation === "count") return rows.length;
  const values = rows
    .map((row) => numericValue(table, row, measure.column))
    .filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  switch (measure.operation) {
    case "sum":
      return values.reduce((total, value) => total + value, 0);
    case "average":
      return values.reduce((total, value) => total + value, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
  }
  return null;
}

function evaluateAggregate(table: Table, query: Aggregate): Result {
  const rows = filteredRows(table, query.filters);
  if (!query.groupBy)
    return resultSchema.parse({ kind: "metric", value: aggregate(table, query, rows) });
  const index = columnIndex(table, query.groupBy);
  const groups = new Map<Cell, Cell[][]>();
  for (const row of rows) {
    const key = row[index] ?? null;
    const group = groups.get(key) ?? [];
    group.push(row);
    if (groups.size === dataLimits.maxGroups && !groups.has(key)) {
      throw new Error(`Charts may contain at most ${dataLimits.maxGroups} groups.`);
    }
    groups.set(key, group);
  }
  return resultSchema.parse({
    kind: "chart",
    points: [...groups].map(([label, group]) => ({
      label: label === null ? "(empty)" : String(label),
      value: aggregate(table, query, group),
    })),
  });
}

function evaluateSelect(table: Table, query: Select): Result {
  const indexes = query.columns.map((column) => columnIndex(table, column));
  const rows = filteredRows(table, query.filters);
  return resultSchema.parse({
    kind: "table",
    table: {
      columns: indexes
        .map((index) => table.columns[index])
        .filter((column): column is NonNullable<typeof column> => Boolean(column)),
      rows: rows.slice(0, query.limit).map((row) => indexes.map((index) => row[index] ?? null)),
    },
    totalRows: rows.length,
  });
}

function validateNodeAgainstSource(node: DashboardNode, source: Source) {
  if (!source.snapshot) return;
  const table = source.snapshot.table;
  if (node.$type === "Metric") {
    const query = node.query;
    if (query.measure.operation !== "count") {
      const index = columnIndex(table, query.measure.column);
      if (table.columns[index]?.kind !== "number")
        throw new Error(`Column “${query.measure.column}” must be numeric for this aggregate.`);
    }
    query.filters?.forEach((filter) => validateFilter(table, filter));
  } else if (node.$type === "Chart") {
    const query = node.query;
    if (query.measure.operation !== "count") {
      const index = columnIndex(table, query.measure.column);
      if (table.columns[index]?.kind !== "number")
        throw new Error(`Column “${query.measure.column}” must be numeric for this aggregate.`);
    }
    query.filters?.forEach((filter) => validateFilter(table, filter));
    columnIndex(table, query.groupBy);
  } else {
    node.query.columns.forEach((column) => columnIndex(table, column));
    node.query.filters?.forEach((filter) => validateFilter(table, filter));
  }
}

function evaluateNode(node: DashboardNode, source: Source): Result {
  if (!source.snapshot) return { kind: "error", message: "This source has no accepted data yet." };
  validateNodeAgainstSource(node, source);
  if (node.$type === "Metric" || node.$type === "Chart")
    return evaluateAggregate(source.snapshot.table, node.query);
  return evaluateSelect(source.snapshot.table, node.query);
}

function sourceStatus(record: StoredSource): SourceStatus {
  const source = record.source;
  const failure = source.lastCheck?.kind === "failure" ? source.lastCheck.message : null;
  const stale =
    isRemote(source) &&
    Boolean(
      failure ||
      !record.lastSuccessAt ||
      Date.parse(record.lastSuccessAt) + dataLimits.refreshMs <= Date.now(),
    );
  return sourceStatusSchema.parse({
    id: source.id,
    name: source.name,
    originalUrl: originalUrl(source.origin),
    version: source.snapshot?.version ?? null,
    fetchedAt: source.snapshot?.fetchedAt ?? null,
    checkedAt: record.lastSuccessAt,
    freshness:
      source.origin.kind === "csv-upload"
        ? "uploaded"
        : source.snapshot
          ? stale
            ? "stale"
            : "fresh"
          : "unavailable",
    error: failure,
  });
}

export async function addSource(input: AddSource): Promise<ReturnType<typeof sourceSummary>> {
  const data = addSourceSchema.parse(input);
  const client = await openDataClient();
  try {
    const existing =
      data.kind === "csv-upload" && data.id ? await readSource(client, data.id) : null;
    if (existing && existing.source.origin.kind !== "csv-upload")
      throw new Error("Only uploaded CSV sources can be replaced.");
    if (!existing) {
      const count = await client.execute("SELECT COUNT(*) AS count FROM data_sources");
      if (Number(count.rows[0]?.count ?? 0) >= dataLimits.maxSources)
        throw new Error(`You can import at most ${dataLimits.maxSources} sources.`);
    }
    let origin: Origin;
    let table: Table;
    let name: string;
    if (data.kind === "csv-upload") {
      if (data.file.size > dataLimits.maxBytes)
        throw new Error(`Sources may contain at most ${dataLimits.maxBytes} bytes.`);
      origin = { kind: "csv-upload", filename: data.file.name };
      table = parseCsv(new TextDecoder().decode(new Uint8Array(await data.file.arrayBuffer())));
      name = data.file.name;
    } else if (data.kind === "google-sheet") {
      origin = sheetOrigin(data.url, data.access);
      const loaded = await loadSource(origin);
      table = loaded.table;
      name = loaded.name;
    } else {
      origin = driveOrigin(data.url);
      const loaded = await loadSource(origin);
      table = loaded.table;
      name = loaded.name;
    }
    const timestamp = now();
    const digest = digestTable(table);
    const snapshot = inferVersion(existing?.source.snapshot ?? null, table, digest, timestamp);
    const source = sourceSchema.parse({
      id: existing?.source.id ?? (data.kind === "csv-upload" && data.id ? data.id : randomUUID()),
      name: name || sourceName(origin),
      origin,
      revision: (existing?.source.revision ?? -1) + 1,
      snapshot,
      lastCheck: {
        kind: "success",
        startedAt: timestamp,
        finishedAt: timestamp,
      },
    });
    const snapshotBytes = JSON.stringify(source.snapshot).length;
    if (snapshotBytes > dataLimits.maxSnapshotBytes)
      throw new Error("The parsed source is too large to save.");
    const totalBytes = await client.execute(
      "SELECT COALESCE(SUM(length(data)), 0) AS bytes FROM data_sources WHERE id != ?",
      [source.id],
    );
    if (
      Number(totalBytes.rows[0]?.bytes ?? 0) + JSON.stringify(source).length >
      dataLimits.maxSnapshotBytes
    ) {
      throw new Error("The combined imported sources are too large to save.");
    }
    await client.execute({
      sql: "INSERT INTO data_sources (id, data, last_success_at, refresh_started_at) VALUES (?, ?, ?, NULL) ON CONFLICT(id) DO UPDATE SET data = excluded.data, last_success_at = excluded.last_success_at, refresh_started_at = NULL",
      args: [source.id, JSON.stringify(source), timestamp],
    });
    return sourceSummary(source);
  } finally {
    client.close();
  }
}

export async function inspectSource(input: { sourceId: string }): Promise<SourceInspection> {
  const client = await openDataClient();
  try {
    const record = await readSource(client, input.sourceId);
    if (!record) throw new Error("Source does not exist.");
    const refreshed = await refreshSource(client, record, false);
    const snapshot = refreshed.source.snapshot;
    return {
      source: sourceSummary(refreshed.source),
      status: sourceStatus(refreshed),
      columns: snapshot?.table.columns ?? [],
      sample: snapshot?.table.rows.slice(0, dataLimits.maxInspectionRows) ?? [],
      rowCount: snapshot?.table.rows.length ?? 0,
    };
  } finally {
    client.close();
  }
}

export async function getDataLibrary(): Promise<DataLibrary> {
  const client = await openDataClient();
  try {
    const sources = await readSources(client);
    const dashboards = await readDashboards(client);
    return dataLibrarySchema.parse({
      sources: sources.map((record) => sourceSummary(record.source)),
      dashboards: dashboards.map((dashboard) => ({
        id: dashboard.id,
        title: dashboard.title,
        nodeCount: dashboard.nodes.length,
      })),
    });
  } finally {
    client.close();
  }
}

export async function saveDashboard(
  input: DashboardDefinition,
): Promise<{ id: string; title: string }> {
  const definition = dashboardDefinitionSchema.parse(input);
  if (new Set(definition.nodes.map((node) => node.id)).size !== definition.nodes.length)
    throw new Error("Dashboard block IDs must be unique.");
  const client = await openDataClient();
  try {
    const sources = new Map(
      (await readSources(client)).map((record) => [record.source.id, record.source]),
    );
    for (const node of definition.nodes) {
      const source = sources.get(node.query.sourceId);
      if (!source) throw new Error(`Source “${node.query.sourceId}” does not exist.`);
      if (
        node.$type === "Table" &&
        new Set(node.query.columns).size !== node.query.columns.length
      ) {
        throw new Error("Table columns must be unique.");
      }
      validateNodeAgainstSource(node, source);
    }
    await client.execute({
      sql: "INSERT INTO data_dashboards (id, title, nodes) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, nodes = excluded.nodes",
      args: [definition.id, definition.title, JSON.stringify(definition.nodes)],
    });
    return { id: definition.id, title: definition.title };
  } finally {
    client.close();
  }
}

export async function getDashboard(
  id: string,
  options: { refresh?: "due" | "force" } = {},
): Promise<DashboardView> {
  const client = await openDataClient();
  try {
    const dashboard = await readDashboard(client, id);
    if (!dashboard) throw new Error("Dashboard does not exist.");
    const sourceIds = [...new Set(dashboard.nodes.map((node) => node.query.sourceId))];
    const refreshed = await Promise.all(
      sourceIds.map(async (sourceId) => {
        const record = await readSource(client, sourceId);
        return record
          ? ([sourceId, await refreshSource(client, record, options.refresh === "force")] as const)
          : null;
      }),
    );
    const records = new Map(
      refreshed.filter((entry): entry is readonly [string, StoredSource] => entry !== null),
    );
    const results: Record<string, Result> = {};
    for (const node of dashboard.nodes) {
      const record = records.get(node.query.sourceId);
      if (!record) {
        results[node.id] = {
          kind: "error",
          message: "The source for this block no longer exists.",
        };
        continue;
      }
      try {
        results[node.id] = evaluateNode(node, record.source);
      } catch (error) {
        results[node.id] = { kind: "error", message: errorMessage(error) };
      }
    }
    return dashboardViewSchema.parse({
      definition: { id: dashboard.id, title: dashboard.title, nodes: dashboard.nodes },
      results,
      sources: sourceIds.map((sourceId) => {
        const record = records.get(sourceId);
        return record
          ? sourceStatus(record)
          : {
              id: sourceId,
              name: "Missing source",
              originalUrl: null,
              version: null,
              fetchedAt: null,
              checkedAt: null,
              freshness: "unavailable",
              error: "The source no longer exists.",
            };
      }),
    });
  } finally {
    client.close();
  }
}
