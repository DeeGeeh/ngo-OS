"use client";

import {
  defaultGenerativeUILibrary,
  renderGenerativeUI,
  type GenerativeUILibrary,
} from "@assistant-ui/react-generative-ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  dashboardViewSchema,
  dataLimits,
  type DashboardNode,
  type DashboardView,
  type Result,
} from "@/lib/data";

export const dashboardQueryKey = (id: string) => ["dashboard", id];

const factProperties = z.object({ label: z.string(), value: z.string() });
const chartProperties = z.object({
  variant: z.enum(["bar", "line"]),
  data: z.array(z.object({ label: z.string(), value: z.number().finite() })).optional(),
  showAxis: z.boolean().optional(),
});
type FactProps = z.infer<typeof factProperties>;
type ChartProps = z.infer<typeof chartProperties>;

const EMPTY_CHART_DATA: NonNullable<ChartProps["data"]> = [];
const chartMargin = { top: 8, right: 12, bottom: 8, left: 0 };
const chartInitialDimension = { width: 480, height: 256 };
const chartTooltipContent = <ChartTooltipContent />;
const formatChartValue = (value: number) => value.toLocaleString();
const chartDot = { fill: "var(--color-value)", r: 3, strokeWidth: 0 };

const chartConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

function DashboardFact({ label, value }: Pick<FactProps, "label" | "value">) {
  return (
    <div className="flex min-h-20 items-center" data-aui="fact" aria-label={label}>
      <p className="text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

function DashboardChart({
  variant,
  data = EMPTY_CHART_DATA,
  showAxis = true,
}: Pick<ChartProps, "variant" | "data" | "showAxis">) {
  const chart =
    variant === "line" ? (
      <LineChart data={data} margin={chartMargin}>
        {showAxis && <CartesianGrid vertical={false} />}
        {showAxis && (
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={formatChartValue}
            width={48}
          />
        )}
        <XAxis axisLine={false} dataKey="label" minTickGap={20} tickLine={false} tickMargin={8} />
        <ChartTooltip cursor={false} content={chartTooltipContent} />
        <Line
          isAnimationActive={false}
          dataKey="value"
          dot={chartDot}
          stroke="var(--color-value)"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    ) : (
      <BarChart data={data} margin={chartMargin}>
        {showAxis && <CartesianGrid vertical={false} />}
        {showAxis && (
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={formatChartValue}
            width={48}
          />
        )}
        <XAxis axisLine={false} dataKey="label" minTickGap={20} tickLine={false} tickMargin={8} />
        <ChartTooltip cursor={false} content={chartTooltipContent} />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} isAnimationActive={false} />
      </BarChart>
    );

  return (
    <ChartContainer
      className="h-64 min-h-52 w-full min-w-0"
      config={chartConfig}
      initialDimension={chartInitialDimension}
    >
      {chart}
    </ChartContainer>
  );
}

const dashboardGenerativeUILibrary = {
  ...defaultGenerativeUILibrary,
  Fact: {
    description: "A metric value.",
    properties: factProperties,
    render: DashboardFact,
  },
  Chart: {
    description: "A chart of grouped values.",
    properties: chartProperties,
    render: DashboardChart,
  },
} satisfies GenerativeUILibrary;

async function fetchDashboard(id: string, force = false): Promise<DashboardView> {
  const response = await fetch(
    `/api/data/dashboards/${encodeURIComponent(id)}${force ? "?refresh=force" : ""}`,
  );
  if (!response.ok) throw new Error(await response.text());
  return dashboardViewSchema.parse(await response.json());
}

function blockSpec(node: DashboardNode, result: Result) {
  if (result.kind === "error") {
    return { $type: "Alert", tone: "error", title: node.title, children: result.message };
  }
  switch (node.$type) {
    case "Metric":
      return {
        $type: "Fact",
        label: node.title,
        value:
          result.kind === "metric" && result.value !== null
            ? result.value.toLocaleString()
            : "No data",
      };
    case "Chart":
      return {
        $type: "Chart",
        variant: node.chart,
        showAxis: true,
        data:
          result.kind === "chart"
            ? result.points
                .filter((point) => point.value !== null)
                .map((point) => ({ label: point.label, value: point.value }))
            : [],
      };
    case "Table":
      return {
        $type: "Table",
        sortable: true,
        columns:
          result.kind === "table"
            ? result.table.columns.map((column) => ({ label: column.key }))
            : [],
        rows:
          result.kind === "table"
            ? result.table.rows.map((row) => row.map((cell) => cell ?? ""))
            : [],
      };
    default: {
      const exhaustive: never = node;
      return exhaustive;
    }
  }
}

function DataBlock({ node, result }: { node: DashboardNode; result: Result | undefined }) {
  const spec = blockSpec(node, result ?? { kind: "error", message: "No result was returned." });
  const noData = result?.kind === "chart" && result.points.every((point) => point.value === null);
  const partialData =
    result?.kind === "chart" && result.points.some((point) => point.value === null) && !noData;
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{node.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto [&_[data-aui-align=end]]:text-right [&_table]:w-full [&_table]:text-sm [&_tbody_tr:last-child]:border-0 [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_tr]:border-b">
          {noData ? (
            <p className="text-sm text-muted-foreground">No numeric data for these groups.</p>
          ) : (
            renderGenerativeUI(spec, dashboardGenerativeUILibrary)
          )}
          {partialData && (
            <p className="mt-2 text-xs text-muted-foreground">Some groups have no numeric data.</p>
          )}
          {result?.kind === "table" && result.totalRows > result.table.rows.length && (
            <p className="mt-3 text-sm text-muted-foreground">
              Showing {result.table.rows.length} of {result.totalRows} rows.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function freshnessLabel(freshness: DashboardView["sources"][number]["freshness"]) {
  switch (freshness) {
    case "uploaded":
      return "Uploaded";
    case "fresh":
      return "Fresh";
    case "stale":
      return "Stale";
    case "unavailable":
      return "Unavailable";
    default: {
      const exhaustive: never = freshness;
      return exhaustive;
    }
  }
}

export function DataDashboard({ initialData }: { initialData: DashboardView }) {
  const id = initialData.definition.id;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: dashboardQueryKey(id),
    queryFn: () => fetchDashboard(id),
    initialData,
    refetchInterval: dataLimits.refreshMs,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  const view = query.data ?? initialData;
  const refresh = useCallback(
    () =>
      void queryClient
        .fetchQuery({
          queryKey: dashboardQueryKey(id),
          queryFn: () => fetchDashboard(id, true),
        })
        .catch(() => undefined),
    [id, queryClient],
  );
  const sourceLinks = useMemo(
    () => view.sources.filter((source) => source.originalUrl !== null),
    [view.sources],
  );

  return (
    <main className="min-h-svh bg-background p-5 md:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Workspace
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{view.definition.title}</h1>
          </div>
          <Button variant="outline" onClick={refresh} disabled={query.isFetching}>
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        </header>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Data sources">
          {view.sources.map((source) => (
            <Card key={source.id} size="sm">
              <CardContent className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{source.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {source.checkedAt
                      ? `Checked ${new Date(source.checkedAt).toLocaleString()}`
                      : "Not checked"}
                  </p>
                  {source.error && <p className="mt-1 text-xs text-destructive">{source.error}</p>}
                </div>
                <Badge
                  variant={
                    source.freshness === "stale" || source.freshness === "unavailable"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {freshnessLabel(source.freshness)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </section>
        {query.error && (
          <Alert variant="destructive">
            <AlertTitle>Dashboard refresh failed</AlertTitle>
            <AlertDescription>{query.error.message}</AlertDescription>
          </Alert>
        )}
        <section className="grid gap-5 md:grid-cols-2" aria-label="Dashboard blocks">
          {view.definition.nodes.map((node) => (
            <DataBlock key={node.id} node={node} result={view.results[node.id]} />
          ))}
        </section>
        {sourceLinks.length > 0 && (
          <section className="flex flex-wrap gap-3 text-sm">
            {sourceLinks.map((source) => (
              <a
                key={source.id}
                href={source.originalUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Open {source.name}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
