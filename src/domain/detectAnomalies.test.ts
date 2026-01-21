import { describe, it, expect } from "vitest";
import { detectAnomalies } from "./detectAnomalies";
import { SpendRow } from "./types";

describe("detectAnomalies", () => {
  it("detects no anomalies in stable daily spend", () => {
    const rows: SpendRow[] = [
      { date: "2026-01-01", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-02", clientId: "C01", awsService: "EC2", usageUsd: 102 },
      { date: "2026-01-03", clientId: "C01", awsService: "EC2", usageUsd: 98 },
      { date: "2026-01-04", clientId: "C01", awsService: "EC2", usageUsd: 101 },
      { date: "2026-01-05", clientId: "C01", awsService: "EC2", usageUsd: 99 },
    ];

    const result = detectAnomalies(rows, "C01", 2.5);
    expect(result).toEqual([]);
  });

  it("detects spike when z-score >= threshold", () => {
    const rows: SpendRow[] = [
      { date: "2026-01-01", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-02", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-03", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-04", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-05", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-06", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-07", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-08", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-09", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-10", clientId: "C01", awsService: "EC2", usageUsd: 1000 }, // spike
    ];

    const result = detectAnomalies(rows, "C01", 2.5);
    
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      date: "2026-01-10",
      type: "spike",
      dailyTotal: 1000,
    });
    expect(result[0].zScore).toBeGreaterThan(2.5);
  });

  it("detects dip when z-score <= -threshold", () => {
    const rows: SpendRow[] = [
      { date: "2026-01-01", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2026-01-02", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2026-01-03", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2026-01-04", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2026-01-05", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2026-01-06", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2026-01-07", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2026-01-08", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2026-01-09", clientId: "C01", awsService: "EC2", usageUsd: 500 },
      { date: "2026-01-10", clientId: "C01", awsService: "EC2", usageUsd: 10 }, // dip
    ];

    const result = detectAnomalies(rows, "C01", 2.5);
    
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      date: "2026-01-10",
      type: "dip",
      dailyTotal: 10,
    });
    expect(result[0].zScore).toBeLessThan(-2.5);
  });

  it("aggregates spend across all services for daily totals", () => {
    const rows: SpendRow[] = [
      { date: "2026-01-01", clientId: "C01", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-01", clientId: "C01", awsService: "S3", usageUsd: 50 },
      { date: "2026-01-02", clientId: "C01", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-02", clientId: "C01", awsService: "S3", usageUsd: 50 },
      { date: "2026-01-03", clientId: "C01", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-03", clientId: "C01", awsService: "S3", usageUsd: 50 },
      { date: "2026-01-04", clientId: "C01", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-04", clientId: "C01", awsService: "S3", usageUsd: 50 },
      { date: "2026-01-05", clientId: "C01", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-05", clientId: "C01", awsService: "S3", usageUsd: 50 },
      { date: "2026-01-06", clientId: "C01", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-06", clientId: "C01", awsService: "S3", usageUsd: 50 },
      { date: "2026-01-07", clientId: "C01", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-07", clientId: "C01", awsService: "S3", usageUsd: 50 },
      { date: "2026-01-08", clientId: "C01", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-08", clientId: "C01", awsService: "S3", usageUsd: 50 },
      { date: "2026-01-09", clientId: "C01", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-09", clientId: "C01", awsService: "S3", usageUsd: 50 },
      { date: "2026-01-10", clientId: "C01", awsService: "EC2", usageUsd: 500 }, // spike day
      { date: "2026-01-10", clientId: "C01", awsService: "S3", usageUsd: 500 },
    ];

    const result = detectAnomalies(rows, "C01", 2.0);
    
    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      date: "2026-01-10",
      dailyTotal: 1000, // 500 + 500
      type: "spike",
    });
  });

  it("filters rows by clientId before computing anomalies", () => {
    const rows: SpendRow[] = [
      { date: "2026-01-01", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-02", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-03", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-04", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-05", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-06", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-07", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-08", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-09", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-10", clientId: "C01", awsService: "EC2", usageUsd: 1000 }, // C01 spike
      { date: "2026-01-01", clientId: "C02", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-02", clientId: "C02", awsService: "EC2", usageUsd: 50 },
      { date: "2026-01-03", clientId: "C02", awsService: "EC2", usageUsd: 50 },
    ];

    const result = detectAnomalies(rows, "C01", 2.5);
    
    expect(result.length).toBe(1);
    expect(result[0].date).toBe("2026-01-10");
  });

  it("handles insufficient data gracefully", () => {
    const rows: SpendRow[] = [
      { date: "2026-01-01", clientId: "C01", awsService: "EC2", usageUsd: 100 },
    ];

    const result = detectAnomalies(rows, "C01", 2.5);
    expect(result).toEqual([]);
  });

  it("sorts anomalies by date ascending", () => {
    // Using a simple pattern where multiple days are clearly anomalous
    const rows: SpendRow[] = [
      { date: "2026-01-01", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-02", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-03", clientId: "C01", awsService: "EC2", usageUsd: 5000 }, // huge spike
      { date: "2026-01-04", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-05", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-06", clientId: "C01", awsService: "EC2", usageUsd: 100 },
      { date: "2026-01-07", clientId: "C01", awsService: "EC2", usageUsd: 5100 }, // huge spike
    ];

    const result = detectAnomalies(rows, "C01", 1.5); // Lower threshold
    
    // Should detect both spikes and they should be sorted
    expect(result.length).toBeGreaterThanOrEqual(2);
    
    // Verify dates are in ascending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].date.localeCompare(result[i + 1].date)).toBeLessThan(0);
    }
  });
});
