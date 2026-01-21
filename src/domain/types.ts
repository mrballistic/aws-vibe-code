export type SpendRow = {
  date: string;           // YYYY-MM-DD
  clientId: string;
  awsService: string;
  usageUsd: number;
};

export type Window = { start: string; end: string }; // inclusive

export type BuildParams = {
  current: Window;
  previous: Window;
};

export type BuildParamsInput =
  | BuildParams
  | { asOfDate: string; comparisonMode: "QoQ" };

export type Driver = {
  service: string;
  currentUsd: number;
  previousUsd: number;
  deltaUsd: number;
};

export type FilterOptions = {
  dateRange?: { start: string; end: string };
  clientIds?: string[];
  awsServices?: string[];
};

export type Anomaly = {
  date: string;
  type: "spike" | "dip";
  dailyTotal: number;
  zScore: number;
};

export type Insight = {
  type: "top_driver_growth" | "top_driver_decline" | "anomaly_spike" | "anomaly_dip" | "summary";
  priority: "high" | "medium" | "low";
  text: string;
  action: string;
};

export type InsightInput = {
  drivers: Driver[];
  anomalies: Anomaly[];
  totalDelta: number;
};
