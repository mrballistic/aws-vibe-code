import React from "react";
import { vi } from "vitest";

function simpleMock(name: string, render?: (props: any) => React.ReactNode) {
  return function MockComponent(props: any) {
    const content = render ? render(props) : props.children;
    const normalized = Array.isArray(content)
      ? content.map((child, index) =>
          React.createElement(React.Fragment, { key: index }, child)
        )
      : content;
    return React.createElement("div", { "data-mock": name }, normalized ?? null);
  };
}

vi.mock("@cloudscape-design/components/container", () => ({
  default: simpleMock("Container", (props) => [props.header ?? null, props.children]),
}));

vi.mock("@cloudscape-design/components/header", () => ({
  default: simpleMock("Header", (props) => [
    props.children,
    props.description ? ` ${props.description}` : "",
    props.counter ? ` ${props.counter}` : "",
  ]),
}));

vi.mock("@cloudscape-design/components/column-layout", () => ({
  default: simpleMock("ColumnLayout"),
}));

vi.mock("@cloudscape-design/components/box", () => ({
  default: simpleMock("Box", (props) => props.children),
}));

vi.mock("@cloudscape-design/components/badge", () => ({
  default: simpleMock("Badge", (props) => props.children),
}));

vi.mock("@cloudscape-design/components/space-between", () => ({
  default: simpleMock("SpaceBetween"),
}));

vi.mock("@cloudscape-design/components/grid", () => ({
  default: simpleMock("Grid"),
}));

vi.mock("@cloudscape-design/components/form-field", () => ({
  default: simpleMock("FormField", (props) => [
    props.label ? `${props.label} ` : "",
    props.description ? `${props.description} ` : "",
    props.children,
  ]),
}));

vi.mock("@cloudscape-design/components/select", () => ({
  default: simpleMock("Select", (props) =>
    props.selectedOption?.label ?? props.placeholder ?? ""
  ),
}));

vi.mock("@cloudscape-design/components/multiselect", () => ({
  default: simpleMock("Multiselect", (props) => {
    const labels = (props.selectedOptions || [])
      .map((o: any) => o.label)
      .filter(Boolean)
      .join(", ");
    return labels || props.placeholder || "";
  }),
}));

vi.mock("@cloudscape-design/components/date-range-picker", () => ({
  default: simpleMock("DateRangePicker", (props) => {
    const value = props.value;
    if (!value || value.type !== "absolute") return "";
    return `${value.startDate} to ${value.endDate}`;
  }),
}));

vi.mock("@cloudscape-design/components/table", () => ({
  default: simpleMock("Table", (props) => {
    const items = props.items || [];
    if (items.length === 0) return [props.header ?? null, props.empty ?? null];
    return [
      props.header ?? null,
      ...items.map((item: any, index: number) =>
        React.createElement(
          "div",
          { key: index, "data-row": true },
          item.service ?? item.id ?? String(index)
        )
      ),
    ];
  }),
}));

vi.mock("@cloudscape-design/components/app-layout", () => ({
  default: simpleMock("AppLayout", (props) => props.content),
}));

vi.mock("@cloudscape-design/components/top-navigation", () => ({
  default: simpleMock("TopNavigation", (props) => props.identity?.title ?? props.children),
}));

vi.mock("@cloudscape-design/components/content-layout", () => ({
  default: simpleMock("ContentLayout", (props) => [props.header ?? null, props.children]),
}));

vi.mock("@cloudscape-design/global-styles", () => ({
  applyMode: vi.fn(),
  Mode: { Light: "light", Dark: "dark" },
}));
