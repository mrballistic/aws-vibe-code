import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Filters from "./Filters";

describe("Filters", () => {
  it("renders labels, selected values, and date range", () => {
    const markup = renderToStaticMarkup(
      <Filters
        clients={[
          { id: "C01", name: "Acme Health" },
          { id: "C02", name: "Beta Wellness" },
        ]}
        services={["EC2", "S3"]}
        selectedClient="all"
        selectedServices={[]}
        dateRange={{ start: "2026-01-01", end: "2026-01-21" }}
        onClientChange={() => {}}
        onServicesChange={() => {}}
        onDateRangeChange={() => {}}
      />
    );

    expect(markup).toContain("Client");
    expect(markup).toContain("Select customer to analyze");
    expect(markup).toContain("All Clients");
    expect(markup).toContain("AWS Services");
    expect(markup).toContain("All services");
    expect(markup).toContain("2026-01-01 to 2026-01-21");
  });
});
