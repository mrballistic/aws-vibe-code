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

  it("supports QoQ comparison mode with asOfDate", () => {
    const rows: SpendRow[] = [
      // Q4 2025 (Oct 1 - Oct 2)
      { date: "2025-10-01", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2025-10-02", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      
      // Q1 2026 (Jan 1 - Jan 2)
      { date: "2026-01-01", clientId: "C01", awsService: "EC2", usageUsd: 800 },
      { date: "2026-01-02", clientId: "C01", awsService: "EC2", usageUsd: 800 },
    ];

    const model = buildDashboardModel(rows, {
      asOfDate: "2026-01-02",
      comparisonMode: "QoQ",
    });

    // Current QTD: Jan 1-2 = 1600
    // Previous QTD: Oct 1-2 = 1000
    expect(model.totals).toEqual({
      currentUsd: 1600,
      previousUsd: 1000,
      deltaUsd: 600,
    });

    expect(model.drivers[0]).toMatchObject({ 
      service: "EC2", 
      deltaUsd: 600 
    });
  });
});
