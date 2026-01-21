**Given a tiny set of spend rows + explicit comparison windows → compute totals + rank service drivers.**

That gives you immediate value (“what changed and why?”) *without* needing:

* QoQ quarter math yet
* budget roll-down yet
* anomalies yet
* insights yet
* loading the big JSON fixture yet

## Slice 1 (Day 1): `buildDashboardModel()` = totals + driver ranking

### What you build (minimum)

A single domain entrypoint:

```ts
buildDashboardModel(rows, params) -> {
  totals: { currentUsd, previousUsd, deltaUsd },
  drivers: Array<{ service, currentUsd, previousUsd, deltaUsd }>
}
```

### Why this is the thinnest slice

* It proves the most important “seller value”: **what moved + what drove it**
* It is **100% deterministic** and easy to fixture-test
* It sets up the rest of your domain functions naturally

---

## Files to create (minimal)

Put these in `src/domain/`:

1. `types.ts` (only what you need for slice 1)
2. `rankDrivers.ts`
3. `buildDashboardModel.ts`
4. `buildDashboardModel.test.ts`

### 1) `src/domain/types.ts`

```ts
export type SpendRow = {
  date: string;           // YYYY-MM-DD
  clientId: string;
  awsService: string;
  usageUsd: number;
};

export type Window = { start: string; end: string }; // inclusive

export type BuildParams = {
  current: Window;
  previous: Window;
};

export type Driver = {
  service: string;
  currentUsd: number;
  previousUsd: number;
  deltaUsd: number;
};
```

### 2) `src/domain/rankDrivers.ts`

```ts
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
```

### 3) `src/domain/buildDashboardModel.ts`

```ts
import { SpendRow, BuildParams } from "./types";
import { rankDrivers } from "./rankDrivers";

function sumIn(rows: SpendRow[], w: { start: string; end: string }) {
  let total = 0;
  for (const r of rows) {
    if (r.date >= w.start && r.date <= w.end) total += r.usageUsd;
  }
  return Math.round(total * 100) / 100;
}

export function buildDashboardModel(rows: SpendRow[], params: BuildParams) {
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
```

### 4) `src/domain/buildDashboardModel.test.ts` (FIRST failing test)

```ts
import { describe, it, expect } from "vitest";
import { buildDashboardModel } from "./buildDashboardModel";
import { SpendRow } from "./types";

describe("buildDashboardModel (thin slice)", () => {
  it("computes totals and ranks drivers by abs(delta) desc", () => {
    const rows: SpendRow[] = [
      // previous window: 2025-10-01..2025-10-02
      { date: "2025-10-01", clientId: "C01", awsService: "DynamoDB", usageUsd: 100 },
      { date: "2025-10-02", clientId: "C01", awsService: "DynamoDB", usageUsd: 100 },
      { date: "2025-10-01", clientId: "C01", awsService: "S3",       usageUsd: 200 },
      { date: "2025-10-02", clientId: "C01", awsService: "S3",       usageUsd: 200 },

      // current window: 2026-01-01..2026-01-02
      { date: "2026-01-01", clientId: "C01", awsService: "DynamoDB", usageUsd: 300 },
      { date: "2026-01-02", clientId: "C01", awsService: "DynamoDB", usageUsd: 300 },
      { date: "2026-01-01", clientId: "C01", awsService: "S3",       usageUsd: 150 },
      { date: "2026-01-02", clientId: "C01", awsService: "S3",       usageUsd: 150 },
    ];

    const model = buildDashboardModel(rows, {
      previous: { start: "2025-10-01", end: "2025-10-02" },
      current:  { start: "2026-01-01", end: "2026-01-02" },
    });

    expect(model.totals).toEqual({
      currentUsd: 900,    // 300+300+150+150
      previousUsd: 600,   // 100+100+200+200
      deltaUsd: 300,
    });

    // DynamoDB delta = +400 (600-200), S3 delta = -100 (300-400)
    expect(model.drivers[0]).toMatchObject({ service: "DynamoDB", deltaUsd: 400 });
    expect(model.drivers[1]).toMatchObject({ service: "S3",       deltaUsd: -100 });
  });
});
```

Run:

* `npm test` (or `npx vitest`) and get the expected red → green cycle.

---

## Slice 2 (next): add QoQ window helper (still tiny)

Once slice 1 is green, add:

* `computeQoQWindows(asOfDate)` → returns `{ current: QTD, previous: priorQTD }`
* Update `buildDashboardModel` to accept either explicit windows **or** `asOfDate` + `comparisonMode: "QoQ"`

That’s when you connect to the real dataset windows without touching UI.

---

## Slice 3 (after that): use your real synthetic JSON fixture

Then write a second test that loads the big JSON and asserts:

* the known anomaly dates exist
* top driver for a known story client is in the top N
* your driver ranking is stable

(But don’t do this until slice 1 & 2 are green.)
