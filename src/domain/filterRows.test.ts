import { describe, it, expect } from "vitest";
import { filterRows } from "./filterRows";
import { SpendRow } from "./types";

describe("filterRows", () => {
  const rows: SpendRow[] = [
    { date: "2026-01-01", clientId: "C01", awsService: "EC2", usageUsd: 100 },
    { date: "2026-01-02", clientId: "C01", awsService: "S3", usageUsd: 50 },
    { date: "2026-01-03", clientId: "C02", awsService: "EC2", usageUsd: 200 },
    { date: "2026-01-04", clientId: "C02", awsService: "Lambda", usageUsd: 75 },
    { date: "2026-01-05", clientId: "C03", awsService: "S3", usageUsd: 150 },
  ];

  it("returns all rows when no filters applied", () => {
    const result = filterRows(rows, {});
    expect(result).toEqual(rows);
  });

  it("filters by date range (inclusive)", () => {
    const result = filterRows(rows, {
      dateRange: { start: "2026-01-02", end: "2026-01-04" },
    });
    
    expect(result).toHaveLength(3);
    expect(result.map((r: SpendRow) => r.date)).toEqual([
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
  });

  it("filters by single client", () => {
    const result = filterRows(rows, {
      clientIds: ["C01"],
    });
    
    expect(result).toHaveLength(2);
    expect(result.every((r: SpendRow) => r.clientId === "C01")).toBe(true);
  });

  it("filters by multiple clients", () => {
    const result = filterRows(rows, {
      clientIds: ["C01", "C03"],
    });
    
    expect(result).toHaveLength(3);
    expect(result.map((r: SpendRow) => r.clientId)).toEqual(["C01", "C01", "C03"]);
  });

  it("filters by single service", () => {
    const result = filterRows(rows, {
      awsServices: ["EC2"],
    });
    
    expect(result).toHaveLength(2);
    expect(result.every((r: SpendRow) => r.awsService === "EC2")).toBe(true);
  });

  it("filters by multiple services", () => {
    const result = filterRows(rows, {
      awsServices: ["S3", "Lambda"],
    });
    
    expect(result).toHaveLength(3);
    expect(result.map((r: SpendRow) => r.awsService).sort()).toEqual(["Lambda", "S3", "S3"]);
  });

  it("combines multiple filters (AND logic)", () => {
    const result = filterRows(rows, {
      dateRange: { start: "2026-01-01", end: "2026-01-03" },
      clientIds: ["C01", "C02"],
      awsServices: ["EC2"],
    });
    
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ date: "2026-01-01", clientId: "C01", awsService: "EC2" });
    expect(result[1]).toMatchObject({ date: "2026-01-03", clientId: "C02", awsService: "EC2" });
  });

  it("returns empty array when no rows match filters", () => {
    const result = filterRows(rows, {
      clientIds: ["C99"],
    });
    
    expect(result).toEqual([]);
  });
});
