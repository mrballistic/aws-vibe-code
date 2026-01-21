import { SpendRow, BuildParams, BuildParamsInput } from "./types";
import { rankDrivers } from "./rankDrivers";
import { computeQoQWindows } from "./computeQoQWindows";

function sumIn(rows: SpendRow[], w: { start: string; end: string }) {
  let total = 0;
  for (const r of rows) {
    if (r.date >= w.start && r.date <= w.end) total += r.usageUsd;
  }
  return Math.round(total * 100) / 100;
}

function normalizeParams(input: BuildParamsInput): BuildParams {
  if ("asOfDate" in input && input.comparisonMode === "QoQ") {
    return computeQoQWindows(input.asOfDate);
  }
  return input as BuildParams;
}

export function buildDashboardModel(rows: SpendRow[], input: BuildParamsInput) {
  const params = normalizeParams(input);
  const currentUsd = sumIn(rows, params.current);
  const previousUsd = sumIn(rows, params.previous);

  return {
    totals: {
      currentUsd,
      previousUsd,
      deltaUsd: Math.round((currentUsd - previousUsd) * 100) / 100,
    },
    drivers: rankDrivers(rows, params),
  };
}
