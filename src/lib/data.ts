import { z } from "zod";

export const dataLimits = {
  maxBytes: 2 * 1024 * 1024,
  maxRows: 10_000,
  maxColumns: 100,
  maxCells: 100_000,
  maxSources: 10,
  maxSnapshotBytes: 10 * 1024 * 1024,
  maxDashboardNodes: 12,
  maxFilters: 8,
  maxGroups: 100,
  maxTableRows: 100,
  maxInspectionRows: 20,
  refreshMs: 60_000,
} as const;

const idSchema = z.string().trim().min(1).max(100);
const columnNameSchema = z.string().trim().min(1).max(120);

export const cellSchema = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
export type Cell = z.infer<typeof cellSchema>;

export const columnSchema = z.object({
  key: columnNameSchema,
  kind: z.enum(["string", "number", "boolean"]),
});

export const tableSchema = z.object({
  columns: z.array(columnSchema).max(dataLimits.maxColumns),
  rows: z.array(z.array(cellSchema)).max(dataLimits.maxRows),
});
export type Table = z.infer<typeof tableSchema>;

const publicSheetOriginSchema = z.object({
  kind: z.literal("google-sheet"),
  originalUrl: z.url(),
  spreadsheetId: z.string().min(1).max(200),
  sheetId: z.number().int().nonnegative(),
  range: z.string().max(200).nullable(),
  access: z.enum(["public", "service-account"]),
});

const driveOriginSchema = z.object({
  kind: z.literal("google-drive-csv"),
  originalUrl: z.url(),
  fileId: z.string().min(1).max(200),
  resourceKey: z.string().max(200).nullable(),
  access: z.literal("service-account"),
});

const uploadOriginSchema = z.object({
  kind: z.literal("csv-upload"),
  filename: z.string().trim().min(1).max(240),
});

export const originSchema = z.discriminatedUnion("kind", [
  uploadOriginSchema,
  publicSheetOriginSchema,
  driveOriginSchema,
]);
export type Origin = z.infer<typeof originSchema>;

export const snapshotSchema = z.object({
  version: z.number().int().positive(),
  fetchedAt: z.iso.datetime(),
  digest: z.string().regex(/^[a-f0-9]{64}$/),
  table: tableSchema,
});
export type Snapshot = z.infer<typeof snapshotSchema>;

export const checkSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("success"),
    startedAt: z.iso.datetime(),
    finishedAt: z.iso.datetime(),
  }),
  z.object({
    kind: z.literal("failure"),
    startedAt: z.iso.datetime(),
    finishedAt: z.iso.datetime(),
    message: z.string().min(1).max(500),
  }),
]);
export type Check = z.infer<typeof checkSchema>;

export const sourceSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(240),
  origin: originSchema,
  revision: z.number().int().nonnegative(),
  snapshot: snapshotSchema.nullable(),
  lastCheck: checkSchema.nullable(),
});
export type Source = z.infer<typeof sourceSchema>;

export const sourceSummarySchema = sourceSchema.pick({ id: true, name: true, origin: true });
export type SourceSummary = z.infer<typeof sourceSummarySchema>;

export const sourceStatusSchema = z.object({
  id: idSchema,
  name: z.string(),
  originalUrl: z.url().nullable(),
  version: z.number().int().positive().nullable(),
  fetchedAt: z.iso.datetime().nullable(),
  checkedAt: z.iso.datetime().nullable(),
  freshness: z.enum(["uploaded", "fresh", "stale", "unavailable"]),
  error: z.string().nullable(),
});
export type SourceStatus = z.infer<typeof sourceStatusSchema>;

const measureSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("count") }),
  z.object({ operation: z.enum(["sum", "average", "min", "max"]), column: columnNameSchema }),
]);

export const filterSchema = z.object({
  column: columnNameSchema,
  operator: z.enum(["eq", "neq", "lt", "gt"]),
  value: cellSchema,
});

export const aggregateSchema = z.object({
  kind: z.literal("aggregate"),
  sourceId: idSchema,
  measure: measureSchema,
  filters: z.array(filterSchema).max(dataLimits.maxFilters).optional(),
  groupBy: columnNameSchema.optional(),
});
export type Aggregate = z.infer<typeof aggregateSchema>;

export const selectSchema = z.object({
  kind: z.literal("select"),
  sourceId: idSchema,
  columns: z.array(columnNameSchema).min(1).max(dataLimits.maxColumns),
  filters: z.array(filterSchema).max(dataLimits.maxFilters).optional(),
  limit: z.number().int().positive().max(dataLimits.maxTableRows),
});
export type Select = z.infer<typeof selectSchema>;

const metricQuerySchema = aggregateSchema.omit({ groupBy: true });
const chartQuerySchema = aggregateSchema.extend({ groupBy: columnNameSchema });

export const dashboardNodeSchema = z.discriminatedUnion("$type", [
  z.object({
    $type: z.literal("Metric"),
    id: idSchema,
    title: z.string().trim().min(1).max(160),
    query: metricQuerySchema,
  }),
  z.object({
    $type: z.literal("Chart"),
    id: idSchema,
    title: z.string().trim().min(1).max(160),
    chart: z.enum(["bar", "line"]),
    query: chartQuerySchema,
  }),
  z.object({
    $type: z.literal("Table"),
    id: idSchema,
    title: z.string().trim().min(1).max(160),
    query: selectSchema,
  }),
]);
export type DashboardNode = z.infer<typeof dashboardNodeSchema>;

export const dashboardDefinitionSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(160),
  nodes: z.array(dashboardNodeSchema).min(1).max(dataLimits.maxDashboardNodes),
});
export type DashboardDefinition = z.infer<typeof dashboardDefinitionSchema>;

export const resultSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("metric"), value: z.number().finite().nullable() }),
  z.object({
    kind: z.literal("chart"),
    points: z
      .array(z.object({ label: z.string(), value: z.number().finite().nullable() }))
      .max(dataLimits.maxGroups),
  }),
  z.object({
    kind: z.literal("table"),
    table: tableSchema,
    totalRows: z.number().int().nonnegative(),
  }),
  z.object({ kind: z.literal("error"), message: z.string().min(1) }),
]);
export type Result = z.infer<typeof resultSchema>;

export const dashboardViewSchema = z.object({
  definition: dashboardDefinitionSchema,
  results: z.record(z.string(), resultSchema),
  sources: z.array(sourceStatusSchema),
});
export type DashboardView = z.infer<typeof dashboardViewSchema>;

export const sourceInspectionSchema = z.object({
  source: sourceSummarySchema,
  status: sourceStatusSchema,
  columns: z.array(columnSchema),
  sample: z.array(z.array(cellSchema)).max(dataLimits.maxInspectionRows),
  rowCount: z.number().int().nonnegative(),
});
export type SourceInspection = z.infer<typeof sourceInspectionSchema>;

export const addSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("csv-upload"), file: z.instanceof(File), id: idSchema.optional() }),
  z.object({
    kind: z.literal("google-sheet"),
    url: z.url(),
    access: z.enum(["public", "service-account"]),
  }),
  z.object({
    kind: z.literal("google-drive-csv"),
    url: z.url(),
    access: z.literal("service-account"),
  }),
]);
export type AddSource = z.infer<typeof addSourceSchema>;

export const dashboardSummarySchema = z.object({
  id: idSchema,
  title: z.string(),
  nodeCount: z.number().int().nonnegative(),
});
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

export const dataLibrarySchema = z.object({
  sources: z.array(sourceSummarySchema),
  dashboards: z.array(dashboardSummarySchema),
});
export type DataLibrary = z.infer<typeof dataLibrarySchema>;

export const dataLibraryQueryKey = ["data-library"];
