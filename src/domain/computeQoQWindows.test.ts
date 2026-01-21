import { describe, it, expect } from "vitest";
import { computeQoQWindows } from "./computeQoQWindows";

describe("computeQoQWindows", () => {
  it("computes QTD windows for Q1 asOfDate", () => {
    const result = computeQoQWindows("2026-01-21");
    
    expect(result.current).toEqual({
      start: "2026-01-01",
      end: "2026-01-21",
    });
    
    expect(result.previous).toEqual({
      start: "2025-10-01",
      end: "2025-10-21", // same number of days into prior quarter
    });
  });

  it("computes QTD windows for Q2 asOfDate", () => {
    const result = computeQoQWindows("2026-05-15");
    
    expect(result.current).toEqual({
      start: "2026-04-01",
      end: "2026-05-15",
    });
    
    expect(result.previous).toEqual({
      start: "2026-01-01",
      end: "2026-02-14", // 45 days into Q1 (Apr 1 - May 15 = 45 days)
    });
  });

  it("computes QTD windows for Q3 asOfDate", () => {
    const result = computeQoQWindows("2026-08-10");
    
    expect(result.current).toEqual({
      start: "2026-07-01",
      end: "2026-08-10",
    });
    
    expect(result.previous).toEqual({
      start: "2026-04-01",
      end: "2026-05-11", // 41 days into Q2
    });
  });

  it("computes QTD windows for Q4 asOfDate", () => {
    const result = computeQoQWindows("2026-11-30");
    
    expect(result.current).toEqual({
      start: "2026-10-01",
      end: "2026-11-30",
    });
    
    expect(result.previous).toEqual({
      start: "2026-07-01",
      end: "2026-08-30", // 61 days into Q3
    });
  });

  it("handles first day of quarter", () => {
    const result = computeQoQWindows("2026-04-01");
    
    expect(result.current).toEqual({
      start: "2026-04-01",
      end: "2026-04-01",
    });
    
    expect(result.previous).toEqual({
      start: "2026-01-01",
      end: "2026-01-01",
    });
  });

  it("handles last day of quarter", () => {
    const result = computeQoQWindows("2026-03-31");
    
    expect(result.current).toEqual({
      start: "2026-01-01",
      end: "2026-03-31",
    });
    
    expect(result.previous).toEqual({
      start: "2025-10-01",
      end: "2025-12-29", // 90 days into Q4 (Q1 has 90 days: Jan=31, Feb=28, Mar=31)
    });
  });
});
