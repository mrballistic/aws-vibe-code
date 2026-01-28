import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AnomaliesPanel from "./AnomaliesPanel";
import type { Anomaly } from "@/domain";

describe("AnomaliesPanel", () => {
  it("renders anomalies for a client", () => {
    const anomalies: Anomaly[] = [
      { date: "2026-01-15", type: "spike", dailyTotal: 5000, zScore: 3.5 },
      { date: "2026-01-08", type: "dip", dailyTotal: 100, zScore: -2.8 },
    ];

    const markup = renderToStaticMarkup(
      <AnomaliesPanel anomalies={anomalies} clientName="Acme Health" />
    );

    expect(markup).toContain("Anomalies - Acme Health");
    expect(markup).toContain("SPIKE");
    expect(markup).toContain("DIP");
    expect(markup).toContain("2026-01-15");
    expect(markup).toContain("$5,000");
  });
});
