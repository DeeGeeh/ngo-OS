import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

await test("data facade imports, computes, refreshes, and reopens source-bound dashboards", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "tres-data-"));
  process.env.WORKSPACE_DATABASE_URL = `file:${join(directory, "workspace.db")}`;
  const { addSource, getDashboard, getDataLibrary, inspectSource, saveDashboard, deleteDashboard } =
    await import("@/server/data/facade");
  const csv = new File(
    ["Name,Amount,Status\n", '"Food, supplies",12,paid\n', "001,8,open\n", "Empty,,open\n"],
    "donors.csv",
    { type: "text/csv" },
  );
  try {
    const source = await addSource({ kind: "csv-upload", file: csv, id: "uploaded-source" });
    assert.equal(source.origin.kind, "csv-upload");
    assert.equal("snapshot" in source, false);
    const inspection = await inspectSource({ sourceId: source.id });
    assert.deepEqual(inspection.columns, [
      { key: "Name", kind: "string" },
      { key: "Amount", kind: "number" },
      { key: "Status", kind: "string" },
    ]);
    assert.equal(inspection.sample[0]?.[0], "Food, supplies");
    assert.equal(inspection.sample[1]?.[0], "001");
    assert.equal(inspection.rowCount, 3);

    await saveDashboard({
      id: "uploaded-dashboard",
      title: "Imported donors",
      nodes: [
        {
          $type: "Metric",
          id: "total",
          title: "Total amount",
          query: {
            kind: "aggregate",
            sourceId: source.id,
            measure: { operation: "sum", column: "Amount" },
          },
        },
        {
          $type: "Chart",
          id: "by-status",
          title: "Amount by status",
          chart: "bar",
          query: {
            kind: "aggregate",
            sourceId: source.id,
            measure: { operation: "sum", column: "Amount" },
            groupBy: "Status",
          },
        },
        {
          $type: "Table",
          id: "rows",
          title: "Rows",
          query: { kind: "select", sourceId: source.id, columns: ["Name", "Amount"], limit: 100 },
        },
      ],
    });
    const view = await getDashboard("uploaded-dashboard");
    assert.deepEqual(view.results.total, { kind: "metric", value: 20 });
    assert.deepEqual(view.results["by-status"], {
      kind: "chart",
      points: [
        { label: "paid", value: 12 },
        { label: "open", value: 8 },
      ],
    });
    assert.equal(view.results.rows?.kind, "table");
    assert.equal(view.sources[0]?.freshness, "uploaded");

    const library = await getDataLibrary();
    assert.deepEqual(library.sources, [source]);
    assert.deepEqual(library.dashboards, [
      { id: "uploaded-dashboard", title: "Imported donors", nodeCount: 3 },
    ]);
    assert.equal(JSON.stringify(library).includes("Food, supplies"), false);

    await t.test("CSV replacement retains source bindings", async () => {
      await addSource({
        kind: "csv-upload",
        id: source.id,
        file: new File(["Name,Amount,Status\nReplacement,30,paid\n"], "replacement.csv", {
          type: "text/csv",
        }),
      });
      const replaced = await getDashboard("uploaded-dashboard");
      assert.deepEqual(replaced.results.total, { kind: "metric", value: 30 });
      assert.equal(replaced.sources[0]?.version, 2);
    });

    await t.test("remote refreshes preserve values when a later check fails", async () => {
      const originalFetch = globalThis.fetch;
      let responseBody = "Category,Amount\nA,5\n";
      globalThis.fetch = async () =>
        new Response(responseBody, { headers: { "content-type": "text/csv" } });
      try {
        const remote = await addSource({
          kind: "google-sheet",
          url: "https://docs.google.com/spreadsheets/d/example-sheet/edit#gid=123",
          access: "public",
        });
        await saveDashboard({
          id: "remote-dashboard",
          title: "Remote",
          nodes: [
            {
              $type: "Metric",
              id: "remote-total",
              title: "Remote total",
              query: {
                kind: "aggregate",
                sourceId: remote.id,
                measure: { operation: "sum", column: "Amount" },
              },
            },
          ],
        });
        responseBody = "Category,Amount\nA,9\n";
        const changed = await getDashboard("remote-dashboard", { refresh: "force" });
        assert.deepEqual(changed.results["remote-total"], { kind: "metric", value: 9 });
        globalThis.fetch = async () => new Response("offline", { status: 503 });
        const stale = await getDashboard("remote-dashboard", { refresh: "force" });
        assert.deepEqual(stale.results["remote-total"], { kind: "metric", value: 9 });
        assert.equal(stale.sources[0]?.freshness, "stale");
        assert.match(stale.sources[0]?.error ?? "", /503/);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    await assert.rejects(
      addSource({
        kind: "csv-upload",
        file: new File(["Name,Amount\nA,1\nB"], "invalid.csv", { type: "text/csv" }),
      }),
      /same number of columns/,
    );
    await assert.rejects(
      saveDashboard({
        id: "invalid-dashboard",
        title: "Invalid",
        nodes: [
          {
            $type: "Metric",
            id: "invalid",
            title: "Invalid",
            query: {
              kind: "aggregate",
              sourceId: source.id,
              measure: { operation: "sum", column: "Name" },
            },
          },
        ],
      }),
      /numeric/,
    );
    await deleteDashboard("uploaded-dashboard");
    await assert.rejects(getDashboard("uploaded-dashboard"), /does not exist/);
    const afterDeletion = await getDataLibrary();
    assert.equal(
      afterDeletion.dashboards.some((dashboard) => dashboard.id === "uploaded-dashboard"),
      false,
    );
    assert.equal(
      afterDeletion.sources.some((item) => item.id === source.id),
      true,
    );
    assert.equal(
      afterDeletion.dashboards.some((dashboard) => dashboard.id === "remote-dashboard"),
      true,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
