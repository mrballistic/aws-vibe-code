import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import InsightsPanel from "./InsightsPanel";
import type { Insight } from "@/domain";

describe("InsightsPanel", () => {
  it("renders empty state when no insights", () => {
    const markup = renderToStaticMarkup(<InsightsPanel insights={[]} />);
    expect(markup).toContain("No significant insights to display");
  });

  it("renders insights list with priorities", () => {
    const insights: Insight[] = [
      {
        type: "anomaly_spike",
        priority: "high",
        text: "Spending spike detected",
        action: "Reach out",
      },
      {
        type: "top_driver_growth",
        priority: "medium",
        text: "EC2 up",
        action: "Discuss commitments",
      },
    ];

    const markup = renderToStaticMarkup(<InsightsPanel insights={insights} />);
    expect(markup).toContain("HIGH");
    expect(markup).toContain("MEDIUM");
    expect(markup).toContain("Spending spike detected");
    expect(markup).toContain("Action:");
  });
});
