import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "./page";

describe("Page", () => {
  it("renders the main dashboard header", () => {
    const markup = renderToStaticMarkup(<Page />);
    expect(markup).toContain("AWS Usage Insights Dashboard");
    expect(markup).toContain("Service Drivers");
  });
});
