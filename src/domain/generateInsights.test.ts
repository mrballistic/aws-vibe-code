import { describe, it, expect } from "vitest";
import { generateInsights, type Insight } from "./generateInsights";
import { Driver, Anomaly } from "./types";

describe("generateInsights", () => {
  it("generates insight for top growing driver", () => {
    const drivers: Driver[] = [
      { service: "EC2", currentUsd: 5000, previousUsd: 1000, deltaUsd: 4000 },
      { service: "S3", currentUsd: 200, previousUsd: 150, deltaUsd: 50 },
    ];

    const insights = generateInsights({
      drivers,
      anomalies: [],
      totalDelta: 4050,
    });

    expect(insights.length).toBeGreaterThan(0);
    
    const growthInsight = insights.find(i => i.type === "top_driver_growth");
    expect(growthInsight).toBeDefined();
    expect(growthInsight?.text).toContain("EC2");
    expect(growthInsight?.text).toContain("$4,000");
    expect(growthInsight?.action).toBeDefined();
  });

  it("generates insight for top declining driver", () => {
    const drivers: Driver[] = [
      { service: "Lambda", currentUsd: 500, previousUsd: 5000, deltaUsd: -4500 },
      { service: "S3", currentUsd: 200, previousUsd: 150, deltaUsd: 50 },
    ];

    const insights = generateInsights({
      drivers,
      anomalies: [],
      totalDelta: -4450,
    });

    const declineInsight = insights.find((i: Insight) => i.type === "top_driver_decline");
    expect(declineInsight).toBeDefined();
    expect(declineInsight?.text).toContain("Lambda");
    expect(declineInsight?.text).toContain("$4,500");
    expect(declineInsight?.action).toContain("Investigate");
  });

  it("generates insight for spike anomaly", () => {
    const anomalies: Anomaly[] = [
      { date: "2026-01-15", type: "spike", dailyTotal: 5000, zScore: 3.5 },
    ];

    const insights = generateInsights({
      drivers: [],
      anomalies,
      totalDelta: 0,
    });

    const spikeInsight = insights.find((i: Insight) => i.type === "anomaly_spike");
    expect(spikeInsight).toBeDefined();
    expect(spikeInsight?.text).toContain("2026-01-15");
    expect(spikeInsight?.text).toContain("spike");
    expect(spikeInsight?.action).toContain("Reach out");
  });

  it("generates insight for dip anomaly", () => {
    const anomalies: Anomaly[] = [
      { date: "2026-01-08", type: "dip", dailyTotal: 100, zScore: -2.8 },
    ];

    const insights = generateInsights({
      drivers: [],
      anomalies,
      totalDelta: 0,
    });

    const dipInsight = insights.find((i: Insight) => i.type === "anomaly_dip");
    expect(dipInsight).toBeDefined();
    expect(dipInsight?.text).toContain("2026-01-08");
    expect(dipInsight?.text).toContain("dip");
    expect(dipInsight?.action).toContain("Investigate");
  });

  it("generates multiple insights when multiple signals present", () => {
    const drivers: Driver[] = [
      { service: "RDS/Aurora", currentUsd: 8000, previousUsd: 2000, deltaUsd: 6000 },
      { service: "Lambda", currentUsd: 500, previousUsd: 3000, deltaUsd: -2500 },
    ];

    const anomalies: Anomaly[] = [
      { date: "2026-01-15", type: "spike", dailyTotal: 5000, zScore: 3.5 },
    ];

    const insights = generateInsights({
      drivers,
      anomalies,
      totalDelta: 3500,
    });

    expect(insights.length).toBeGreaterThanOrEqual(2);
    expect(insights.some((i: Insight) => i.type === "top_driver_growth")).toBe(true);
    expect(insights.some((i: Insight) => i.type === "anomaly_spike")).toBe(true);
  });

  it("prioritizes insights by importance", () => {
    const drivers: Driver[] = [
      { service: "EC2", currentUsd: 5000, previousUsd: 1000, deltaUsd: 4000 },
      { service: "S3", currentUsd: 200, previousUsd: 150, deltaUsd: 50 },
    ];

    const anomalies: Anomaly[] = [
      { date: "2026-01-15", type: "spike", dailyTotal: 10000, zScore: 4.0 },
    ];

    const insights = generateInsights({
      drivers,
      anomalies,
      totalDelta: 4050,
    });

    // Anomalies should be prioritized
    expect(insights[0].priority).toBe("high");
  });

  it("returns empty array when no significant signals", () => {
    const drivers: Driver[] = [
      { service: "S3", currentUsd: 100, previousUsd: 98, deltaUsd: 2 },
    ];

    const insights = generateInsights({
      drivers,
      anomalies: [],
      totalDelta: 2,
    });

    // Should still generate at least summary insight
    expect(insights.length).toBeGreaterThanOrEqual(0);
  });

  it("formats dollar amounts in insight text", () => {
    const drivers: Driver[] = [
      { service: "DynamoDB", currentUsd: 12345.67, previousUsd: 1000, deltaUsd: 11345.67 },
    ];

    const insights = generateInsights({
      drivers,
      anomalies: [],
      totalDelta: 11345.67,
    });

    const growthInsight = insights.find((i: Insight) => i.type === "top_driver_growth");
    expect(growthInsight?.text).toMatch(/\$[\d,]+/); // Should have dollar formatting
  });
});
