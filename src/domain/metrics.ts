import type { AnomalyPoint, CurRow, DashboardModel, DriverRow, Filters, GroupByDimension, SeriesPoint } from './types';
import { addDaysUTC, maxISODate } from './date';

export type BuildDashboardArgs = {
  rangeDays: number; // e.g., 7, 14, 30
  groupBy: GroupByDimension;
  filters?: Filters;
  endDate?: string; // defaults to max date in rows
  anomalyZThreshold?: number; // defaults to 2.5
};

function isAll(v: string | undefined): boolean {
  return v === undefined || v === 'All' || v === '';
}

export function filterRows(rows: CurRow[], filters: Filters | undefined): CurRow[] {
  if (!filters) return rows;
  return rows.filter((r) => {
    if (!isAll(filters.region) && r.region !== filters.region) return false;
    if (!isAll(filters.service) && r.service !== filters.service) return false;
    if (!isAll(filters.accountId) && r.accountId !== filters.accountId) return false;
    return true;
  });
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function sum(rows: CurRow[]): number {
  return rows.reduce((acc, r) => acc + r.cost, 0);
}

export function computeTimeSeries(rows: CurRow[], start: string, end: string): SeriesPoint[] {
  const byDate = new Map<string, number>();
  for (const r of rows) {
    if (!inRange(r.date, start, end)) continue;
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.cost);
  }
  const dates = Array.from(byDate.keys()).sort();
  return dates.map((d) => ({ date: d, cost: round2(byDate.get(d) ?? 0) }));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, v) => a + v, 0) / values.length;
}

function std(values: number[], m: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function detectAnomalies(series: SeriesPoint[], zThreshold = 2.5): AnomalyPoint[] {
  const values = series.map((p) => p.cost);
  const m = mean(values);
  const s = std(values, m);
  if (s === 0) return [];

  const anomalies: AnomalyPoint[] = [];
  for (const p of series) {
    const z = (p.cost - m) / s;
    if (Math.abs(z) >= zThreshold) {
      anomalies.push({ date: p.date, cost: p.cost, zScore: round2(z) });
    }
  }
  // Sort by absolute z descending
  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

function keyFor(row: CurRow, groupBy: GroupByDimension): string {
  switch (groupBy) {
    case 'service':
      return row.service;
    case 'region':
      return row.region;
    case 'account':
      return `${row.accountName} (${row.accountId})`;
    default:
      return row.service;
  }
}

export function rankDrivers(
  rows: CurRow[],
  groupBy: GroupByDimension,
  currentStart: string,
  currentEnd: string,
  prevStart: string,
  prevEnd: string
): DriverRow[] {
  const cur = new Map<string, number>();
  const prev = new Map<string, number>();

  for (const r of rows) {
    const key = keyFor(r, groupBy);
    if (inRange(r.date, currentStart, currentEnd)) {
      cur.set(key, (cur.get(key) ?? 0) + r.cost);
    } else if (inRange(r.date, prevStart, prevEnd)) {
      prev.set(key, (prev.get(key) ?? 0) + r.cost);
    }
  }

  const keys = new Set<string>([...cur.keys(), ...prev.keys()]);
  const out: DriverRow[] = [];
  for (const k of keys) {
    const c = round2(cur.get(k) ?? 0);
    const p = round2(prev.get(k) ?? 0);
    const d = round2(c - p);
    const dp = p === 0 ? null : d / p;
    out.push({ name: k, current: c, previous: p, delta: d, deltaPct: dp });
  }

  // Sort by absolute delta desc, then name.
  out.sort((a, b) => {
    const ad = Math.abs(a.delta);
    const bd = Math.abs(b.delta);
    if (bd !== ad) return bd - ad;
    return a.name.localeCompare(b.name);
  });

  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildDashboardModel(allRows: CurRow[], args: BuildDashboardArgs): DashboardModel {
  const {
    rangeDays,
    groupBy,
    filters,
    endDate,
    anomalyZThreshold = 2.5
  } = args;

  if (!Number.isFinite(rangeDays) || rangeDays <= 0) {
    throw new Error(`rangeDays must be > 0. Got: ${rangeDays}`);
  }

  const rows = filterRows(allRows, filters);

  const resolvedEnd = endDate ?? maxISODate(rows.map((r) => r.date));
  const rangeEnd = resolvedEnd;
  const rangeStart = addDaysUTC(rangeEnd, -(rangeDays - 1));

  const prevEnd = addDaysUTC(rangeStart, -1);
  const prevStart = addDaysUTC(prevEnd, -(rangeDays - 1));

  const curRows = rows.filter((r) => inRange(r.date, rangeStart, rangeEnd));
  const prevRows = rows.filter((r) => inRange(r.date, prevStart, prevEnd));

  const totalCost = round2(sum(curRows));
  const prevCost = round2(sum(prevRows));
  const delta = round2(totalCost - prevCost);
  const deltaPct = prevCost === 0 ? null : delta / prevCost;

  const series = computeTimeSeries(rows, rangeStart, rangeEnd);
  const anomalies = detectAnomalies(series, anomalyZThreshold);

  const drivers = rankDrivers(rows, groupBy, rangeStart, rangeEnd, prevStart, prevEnd);
  const topDriver = drivers[0];

  const insights = generateInsights({
    rangeStart,
    rangeEnd,
    prevStart,
    prevEnd,
    totalCost,
    prevCost,
    delta,
    deltaPct,
    topDriver,
    anomalies
  });

  const summaryMarkdown = generateSummaryMarkdown({
    rangeStart,
    rangeEnd,
    prevStart,
    prevEnd,
    totalCost,
    prevCost,
    delta,
    deltaPct,
    topDriver,
    insights
  });

  return {
    rangeStart,
    rangeEnd,
    prevStart,
    prevEnd,
    kpis: {
      totalCost,
      prevCost,
      delta,
      deltaPct,
      anomalyDays: anomalies.length,
      topDriverName: topDriver?.name ?? null,
      topDriverDelta: topDriver?.delta ?? null
    },
    series,
    drivers,
    anomalies,
    insights,
    summaryMarkdown
  };
}

type InsightInputs = {
  rangeStart: string;
  rangeEnd: string;
  prevStart: string;
  prevEnd: string;
  totalCost: number;
  prevCost: number;
  delta: number;
  deltaPct: number | null;
  topDriver: DriverRow | undefined;
  anomalies: AnomalyPoint[];
};

export function generateInsights(i: InsightInputs): string[] {
  const bullets: string[] = [];

  const pct = i.deltaPct === null ? 'n/a' : `${(i.deltaPct * 100).toFixed(1)}%`;
  const sign = i.delta >= 0 ? '+' : '';
  bullets.push(
    `Total cost is ${formatUsd(i.totalCost)} (${sign}${formatUsd(i.delta)} / ${pct}) vs previous period (${i.prevStart} → ${i.prevEnd}).`
  );

  if (i.topDriver) {
    const dSign = i.topDriver.delta >= 0 ? '+' : '';
    const dPct = i.topDriver.deltaPct === null ? 'n/a' : `${(i.topDriver.deltaPct * 100).toFixed(1)}%`;
    bullets.push(
      `Top driver by change: **${i.topDriver.name}** (${dSign}${formatUsd(i.topDriver.delta)} / ${dPct}).`
    );
  } else {
    bullets.push('No drivers found for the selected filters/range.');
  }

  if (i.anomalies.length > 0) {
    const top = i.anomalies[0];
    bullets.push(`Anomaly detected on **${top.date}** (z=${top.zScore}): ${formatUsd(top.cost)} total cost that day.`);
  } else {
    bullets.push('No statistically significant anomaly days detected in the selected range.');
  }

  // Recommendation: keep it explainable. Map a few common drivers; otherwise generic.
  const recommendation = recommendNextAction(i.topDriver?.name);
  bullets.push(`Recommended next step: ${recommendation}`);

  return bullets;
}

function recommendNextAction(topDriverName: string | undefined): string {
  switch (topDriverName) {
    case 'NAT Gateway':
      return 'review NAT Gateway traffic patterns, evaluate VPC endpoints where appropriate, and validate routing/NAT architecture.';
    case 'EC2':
      return 'review instance sizing and schedules, confirm autoscaling policies, and look for idle/over-provisioned capacity.';
    case 'S3':
      return 'review storage class distribution, lifecycle policies, and large-prefix access patterns driving request costs.';
    case 'CloudFront':
      return 'review cache hit ratio, origin configuration, and any sudden traffic changes impacting egress.';
    case 'Lambda':
      return 'review invocation spikes, timeouts/retries, and high-duration functions that may benefit from optimization.';
    case 'DynamoDB':
      return 'review read/write capacity mode, hot partitions, and traffic changes; validate autoscaling settings.';
    default:
      return 'validate the top driver with usage metrics and change history, then identify quick wins (tag hygiene, right-sizing, guardrails).';
  }
}

type SummaryInputs = {
  rangeStart: string;
  rangeEnd: string;
  prevStart: string;
  prevEnd: string;
  totalCost: number;
  prevCost: number;
  delta: number;
  deltaPct: number | null;
  topDriver: DriverRow | undefined;
  insights: string[];
};

export function generateSummaryMarkdown(s: SummaryInputs): string {
  const pct = s.deltaPct === null ? 'n/a' : `${(s.deltaPct * 100).toFixed(1)}%`;
  const sign = s.delta >= 0 ? '+' : '';

  const lines: string[] = [];
  lines.push(`# Cost & Usage Insights`);
  lines.push('');
  lines.push(`**Range:** ${s.rangeStart} → ${s.rangeEnd}`);
  lines.push(`**Previous:** ${s.prevStart} → ${s.prevEnd}`);
  lines.push('');
  lines.push(`- **Total:** ${formatUsd(s.totalCost)}`);
  lines.push(`- **Change:** ${sign}${formatUsd(s.delta)} (${pct})`);
  if (s.topDriver) {
    const dSign = s.topDriver.delta >= 0 ? '+' : '';
    const dPct = s.topDriver.deltaPct === null ? 'n/a' : `${(s.topDriver.deltaPct * 100).toFixed(1)}%`;
    lines.push(`- **Top driver:** ${s.topDriver.name} (${dSign}${formatUsd(s.topDriver.delta)} / ${dPct})`);
  }
  lines.push('');
  lines.push('## Key insights');
  for (const b of s.insights) {
    lines.push(`- ${b}`);
  }
  lines.push('');
  return lines.join('\n');
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}
