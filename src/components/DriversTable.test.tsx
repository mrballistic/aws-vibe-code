import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DriversTable from "./DriversTable";
import type { Driver } from "@/domain";

describe("DriversTable", () => {
  it("sorts by deltaUsd descending by default", () => {
    const drivers: Driver[] = [
      { service: "S3", currentUsd: 200, previousUsd: 210, deltaUsd: -10 },
      { service: "EC2", currentUsd: 500, previousUsd: 400, deltaUsd: 100 },
      { service: "Lambda", currentUsd: 50, previousUsd: 60, deltaUsd: -10 },
      { service: "RDS", currentUsd: 100, previousUsd: 90, deltaUsd: 10 },
    ];

    const markup = renderToStaticMarkup(<DriversTable drivers={drivers} />);

    const ec2Index = markup.indexOf("EC2");
    const rdsIndex = markup.indexOf("RDS");
    const s3Index = markup.indexOf("S3");

    expect(ec2Index).toBeGreaterThan(-1);
    expect(rdsIndex).toBeGreaterThan(-1);
    expect(s3Index).toBeGreaterThan(-1);
    expect(ec2Index).toBeLessThan(rdsIndex);
    expect(rdsIndex).toBeLessThan(s3Index);
  });

  it("renders empty state when no drivers", () => {
    const markup = renderToStaticMarkup(<DriversTable drivers={[]} />);
    expect(markup).toContain("No service drivers to display");
  });
});
