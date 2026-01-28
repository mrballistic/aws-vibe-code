import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import KPICards from "./KPICards";

describe("KPICards", () => {
  it("renders formatted totals and QoQ percent", () => {
    const markup = renderToStaticMarkup(
      <KPICards
        totals={{ currentUsd: 1000, previousUsd: 800, deltaUsd: 200 }}
      />
    );

    expect(markup).toContain("Current QTD Spend");
    expect(markup).toContain("$1,000");
    expect(markup).toContain("$800");
    expect(markup).toContain("$200");
    expect(markup).toContain("+25.0%");
  });

  it("handles previousUsd = 0 with N/A percentage", () => {
    const markup = renderToStaticMarkup(
      <KPICards
        totals={{ currentUsd: 500, previousUsd: 0, deltaUsd: 500 }}
      />
    );

    expect(markup).toContain("N/A");
  });
});
