"use client"

import { useMotherDuckClientState } from "@/lib/motherduck/context/motherduckClientContext";
import useDebounce from "./demo/hooks/debounce";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

// Dynamic imports — these components use Recharts which requires browser APIs
const RangeSweepBarChart = dynamic(() => import("./demo/viz/RangeSweepBarChart"), { ssr: false });
const SelectableBarChart = dynamic(() => import("./demo/viz/SelectableBarChart"), { ssr: false });
const KPICards = dynamic(() => import("./demo/viz/KPICards"), { ssr: false });
const DetailTable = dynamic(() => import("./demo/viz/DetailTable"), { ssr: false });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format a YYYYMM integer to "Jan 2015" */
function formatYm(ym: number): string {
  const year = Math.floor(ym / 100);
  const month = ym % 100;
  return `${MONTHS[month - 1]} ${year}`;
}

// ─── SQL Queries ─────────────────────────────────────────────────────────────
//
// The demo pattern:
//   1. CREATE RESULT caches aggregated NYPD data locally in the WASM runtime
//   2. Every subsequent query runs against this local cache (~1-5ms)
//
// This is the key value prop: one fetch from MotherDuck cloud, then
// instant interactivity with zero further network requests.
// ─────────────────────────────────────────────────────────────────────────────

// Step 1: Fetch from MotherDuck cloud → cache locally in WASM
// The `ym` column (YYYYMM int) enables fast month-level range filtering.
const CACHE_SQL = `CREATE RESULT complaints_cache AS
SELECT year(created_date)::int AS year,
       month(created_date)::int AS month,
       (year(created_date) * 100 + month(created_date))::int AS ym,
       complaint_type AS type,
       incident_zip AS zipcode,
       count(*)::int AS count
FROM sample_data.nyc.service_requests
WHERE year(created_date) < 2023
  AND agency_name = 'New York City Police Department'
GROUP BY ALL`;

// Steps 2+: All queries below run against the local cache — no network needed

const MONTH_COUNTS_SQL =
  `SELECT ym, month, sum(count)::int AS value FROM complaints_cache GROUP BY ym, month ORDER BY ym`;

const kpiSQL = (minYm: number, maxYm: number) =>
  `SELECT sum(count)::int AS total,
          count(DISTINCT type)::int AS types,
          count(DISTINCT zipcode)::int AS zipcodes
   FROM complaints_cache
   WHERE ym >= ${minYm} AND ym <= ${maxYm}`;

const topTypesSQL = (minYm: number, maxYm: number) =>
  `SELECT type AS label, sum(count)::int AS value
   FROM complaints_cache
   WHERE ym >= ${minYm} AND ym <= ${maxYm}
   GROUP BY type ORDER BY value DESC LIMIT 10`;

const detailSQL = (minYm: number, maxYm: number, type: string | null) => {
  let q = `SELECT type, zipcode, sum(count)::int AS incidents
   FROM complaints_cache
   WHERE ym >= ${minYm} AND ym <= ${maxYm}`;
  if (type) q += ` AND type = '${type.replace(/'/g, "''")}'`;
  return q + ` GROUP BY ALL ORDER BY incidents DESC LIMIT 20`;
};

// ─── Types ───────────────────────────────────────────────────────────────────

type MonthCount = { ym: number; month: number; value: number };
type TypeCount = { label: string; value: number };
type DetailRow = { type: string; zipcode: string; incidents: number };

// ─── Component ───────────────────────────────────────────────────────────────

export default function WasmDemo() {
  const { safeEvaluateQuery } = useMotherDuckClientState();
  const initRef = useRef(false);

  // Cache state
  const [cacheReady, setCacheReady] = useState(false);
  const [cacheTimeMs, setCacheTimeMs] = useState(0);

  // Interactive selection state — ym values (YYYYMM integers)
  const [ymRange, setYmRange] = useState<[number, number]>([201501, 202012]);
  const debouncedRange = useDebounce(ymRange, 60);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Data + query timing for each panel
  const [monthCounts, setMonthCounts] = useState<{ data: MonthCount[]; ms: number }>({ data: [], ms: 0 });
  const [kpis, setKpis] = useState({ total: 0, types: 0, zipcodes: 0, ms: 0 });
  const [topTypes, setTopTypes] = useState<{ data: TypeCount[]; ms: number }>({ data: [], ms: 0 });
  const [details, setDetails] = useState<{ data: DetailRow[]; ms: number }>({ data: [], ms: 0 });

  // Helper: run a query and measure execution time
  const timedQuery = useCallback(
    async (sql: string) => {
      const t0 = performance.now();
      const result = await safeEvaluateQuery(sql);
      const ms = Math.round((performance.now() - t0) * 10) / 10;
      if (result.status === "error") throw new Error(String(result.err));
      return { rows: result.result.data.toRows(), ms };
    },
    [safeEvaluateQuery],
  );

  // Step 1: Create local cache via CREATE RESULT (runs once on mount)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      const t0 = performance.now();
      const result = await safeEvaluateQuery(CACHE_SQL);
      const ms = performance.now() - t0;
      if (result.status === "success") {
        setCacheTimeMs(Math.round(ms));
        setCacheReady(true);
      } else {
        console.error("Cache creation failed:", result.err);
      }
    })();
  }, [safeEvaluateQuery]);

  // Step 2: Fetch monthly counts from local cache (once after cache is ready)
  useEffect(() => {
    if (!cacheReady) return;
    timedQuery(MONTH_COUNTS_SQL)
      .then(({ rows, ms }) => setMonthCounts({ data: rows as MonthCount[], ms }))
      .catch(console.error);
  }, [cacheReady, timedQuery]);

  // Step 3: Fetch KPIs, top types, and detail breakdown — all reactive to brush/click
  useEffect(() => {
    if (!cacheReady) return;
    const [minYm, maxYm] = debouncedRange;

    Promise.all([
      timedQuery(kpiSQL(minYm, maxYm)),
      timedQuery(topTypesSQL(minYm, maxYm)),
      timedQuery(detailSQL(minYm, maxYm, selectedType)),
    ])
      .then(([kpiRes, typesRes, detailRes]) => {
        const row = kpiRes.rows[0] as { total: number; types: number; zipcodes: number } | undefined;
        setKpis({
          total: row?.total ?? 0,
          types: row?.types ?? 0,
          zipcodes: row?.zipcodes ?? 0,
          ms: kpiRes.ms,
        });
        setTopTypes({ data: typesRes.rows as TypeCount[], ms: typesRes.ms });
        setDetails({ data: detailRes.rows as DetailRow[], ms: detailRes.ms });
      })
      .catch(console.error);
  }, [cacheReady, debouncedRange, selectedType, timedQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          NYPD Complaints Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive analytics powered by in-browser SQL &mdash; drag, click,
          and explore with zero network latency
        </p>
      </div>

      {/* Cache status banner */}
      <div
        className={`rounded-lg border px-4 py-3 text-sm font-mono transition-colors ${
          cacheReady
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
            : "border-border bg-card text-muted-foreground"
        }`}
      >
        {cacheReady ? (
          <>
            <span className="font-semibold">CREATE RESULT</span>
            {" \u2014 "}data cached locally in{" "}
            {cacheTimeMs < 1000
              ? `${cacheTimeMs}ms`
              : `${(cacheTimeMs / 1000).toFixed(1)}s`}
            {" \u00b7 "}all queries below run in-browser
          </>
        ) : (
          <span className="animate-pulse">
            Connecting to MotherDuck and caching data locally&hellip;
          </span>
        )}
      </div>

      {/* KPI cards */}
      <KPICards
        kpis={{ total: kpis.total, types: kpis.types, zipcodes: kpis.zipcodes }}
        rangeLabel={`${formatYm(debouncedRange[0])} \u2013 ${formatYm(debouncedRange[1])}`}
        loading={!cacheReady}
      />

      {/* Monthly trend chart with brush */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold">Complaints by Month</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums font-mono">
              {formatYm(ymRange[0])} &ndash; {formatYm(ymRange[1])}
            </span>
            {monthCounts.ms > 0 && <QueryBadge ms={monthCounts.ms} />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Drag the brush below to filter all panels by date range
        </p>
        <RangeSweepBarChart
          data={monthCounts.data}
          selectedRange={ymRange}
          onRangeChange={setYmRange}
        />
      </div>

      {/* Bottom grid: top types chart + detail table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top complaint types (clickable) */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">Top Complaint Types</h2>
            {topTypes.ms > 0 && <QueryBadge ms={topTypes.ms} />}
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Click a bar to filter the table
          </p>
          <SelectableBarChart
            data={topTypes.data}
            onBarClick={setSelectedType}
            selectedBar={selectedType}
          />
        </div>

        {/* Detail breakdown table */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">
              {selectedType ? selectedType : "Breakdown by Zipcode"}
            </h2>
            {details.ms > 0 && <QueryBadge ms={details.ms} />}
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {formatYm(debouncedRange[0])} &ndash; {formatYm(debouncedRange[1])}
            {selectedType && ` \u00b7 filtered by ${selectedType}`}
          </p>
          <DetailTable data={details.data} />
        </div>
      </div>
    </div>
  );
}

// ─── Query timing badge ──────────────────────────────────────────────────────

function QueryBadge({ ms }: { ms: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-mono text-emerald-400 tabular-nums">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {ms < 1 ? "<1" : ms.toFixed(0)}ms
    </span>
  );
}
