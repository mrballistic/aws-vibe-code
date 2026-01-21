import { SpendRow, BuildParams, Driver } from "./types";

function inWindow(dateStr: string, w: { start: string; end: string }) {
  return dateStr >= w.start && dateStr <= w.end; // works for ISO YYYY-MM-DD
}

export function rankDrivers(rows: SpendRow[], params: BuildParams): Driver[] {
  const byService = new Map<string, { cur: number; prev: number }>();

  for (const r of rows) {
    const entry = byService.get(r.awsService) ?? { cur: 0, prev: 0 };

    if (inWindow(r.date, params.current)) entry.cur += r.usageUsd;
    if (inWindow(r.date, params.previous)) entry.prev += r.usageUsd;

    byService.set(r.awsService, entry);
  }

  const drivers: Driver[] = [...byService.entries()].map(([service, v]) => ({
    service,
    currentUsd: round2(v.cur),
    previousUsd: round2(v.prev),
    deltaUsd: round2(v.cur - v.prev),
  }));

  // Contract: sort by abs(delta) desc; stable tie-breakers
  drivers.sort((a, b) => {
    const ad = Math.abs(a.deltaUsd);
    const bd = Math.abs(b.deltaUsd);
    if (bd !== ad) return bd - ad;
    if (b.currentUsd !== a.currentUsd) return b.currentUsd - a.currentUsd;
    return a.service.localeCompare(b.service);
  });

  return drivers;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
