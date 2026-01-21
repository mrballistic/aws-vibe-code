import { describe, it, expect } from "vitest";
import { buildDashboardModel } from "./buildDashboardModel";
import { detectAnomalies } from "./detectAnomalies";
import { generateInsights } from "./generateInsights";
import { SpendRow } from "./types";
import fixtureData from "../../public/data/synthetic_wellness_aws_poc_named.json";

describe("buildDashboardModel with real fixture", () => {
  const rows: SpendRow[] = fixtureData.usage_daily_usd.map((row: any) => ({
    date: row.date,
    clientId: row.client_id,
    awsService: row.aws_service,
    usageUsd: row.usage_usd,
  }));

  it("computes totals for known QoQ windows from fixture metadata", () => {
    const model = buildDashboardModel(rows, {
      asOfDate: fixtureData.meta.date_windows.current_qtd.end,
      comparisonMode: "QoQ",
    });

    // Should have computed totals (exact values depend on fixture data)
    expect(model.totals.currentUsd).toBeGreaterThan(0);
    expect(model.totals.previousUsd).toBeGreaterThan(0);
    expect(typeof model.totals.deltaUsd).toBe("number");
  });

  it("ranks drivers in stable descending order by absolute delta", () => {
    const model = buildDashboardModel(rows, {
      asOfDate: "2026-01-21",
      comparisonMode: "QoQ",
    });

    expect(model.drivers.length).toBeGreaterThan(0);
    
    // Verify sorting: each driver should have abs(delta) >= next driver's abs(delta)
    for (let i = 0; i < model.drivers.length - 1; i++) {
      const current = Math.abs(model.drivers[i].deltaUsd);
      const next = Math.abs(model.drivers[i + 1].deltaUsd);
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it("returns all 10 AWS services as drivers", () => {
    const model = buildDashboardModel(rows, {
      asOfDate: "2026-01-21",
      comparisonMode: "QoQ",
    });

    const expectedServices = fixtureData.entities.aws_services;
    expect(model.drivers.length).toBe(expectedServices.length);
    
    const driverServices = model.drivers.map(d => d.service).sort();
    const expected = [...expectedServices].sort();
    expect(driverServices).toEqual(expected);
  });

  it("computes known anomaly dates exist in dataset", () => {
    // Verify that the known anomaly dates from metadata have data
    const anomalyDates = fixtureData.meta.notes.anomalies.map((a: any) => a.date);
    
    for (const anomalyDate of anomalyDates) {
      const rowsOnDate = rows.filter(r => r.date === anomalyDate);
      expect(rowsOnDate.length).toBeGreaterThan(0);
    }
  });

  it("detects known anomalies from fixture metadata", () => {
    // Test C03 spike on 2026-01-15
    const c03Anomalies = detectAnomalies(rows, "C03", 2.5);
    const spikeAnomaly = c03Anomalies.find(a => a.date === "2026-01-15" && a.type === "spike");
    expect(spikeAnomaly).toBeDefined();

    // Test C07 dip on 2026-01-08
    const c07Anomalies = detectAnomalies(rows, "C07", 2.5);
    const dipAnomaly = c07Anomalies.find(a => a.date === "2026-01-08" && a.type === "dip");
    expect(dipAnomaly).toBeDefined();
  });

  it("generates actionable insights for fixture data", () => {
    const model = buildDashboardModel(rows, {
      asOfDate: "2026-01-21",
      comparisonMode: "QoQ",
    });

    // Get anomalies for a client with known spike
    const c03Anomalies = detectAnomalies(rows, "C03", 2.5);

    const insights = generateInsights({
      drivers: model.drivers,
      anomalies: c03Anomalies,
      totalDelta: model.totals.deltaUsd,
    });

    expect(insights.length).toBeGreaterThan(0);
    
    // Should have driver insights
    const driverInsights = insights.filter(i => 
      i.type === "top_driver_growth" || i.type === "top_driver_decline"
    );
    expect(driverInsights.length).toBeGreaterThan(0);

    // Each insight should have required fields
    for (const insight of insights) {
      expect(insight.text).toBeTruthy();
      expect(insight.action).toBeTruthy();
      expect(insight.priority).toMatch(/high|medium|low/);
    }
  });
});
