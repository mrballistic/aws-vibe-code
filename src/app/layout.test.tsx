import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("wraps children with html and body", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>Dashboard Content</div>
      </RootLayout>
    );

    expect(markup).toContain("<html");
    expect(markup).toContain("lang=\"en\"");
    expect(markup).toContain("Dashboard Content");
  });
});
