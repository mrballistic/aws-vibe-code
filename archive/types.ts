export type Scenario = 'baseline' | 'spike' | 'regional-expansion' | 'optimization-win';

export type GroupByDimension = 'service' | 'region' | 'account';

export type CurRow = {
  date: string; // YYYY-MM-DD
  accountId: string;
  accountName: string;
  region: string;
  service: string;
  cost: number; // USD
};

export type Filters = {
  region?: string; // 'All' or specific
  service?: string; // 'All' or specific
  accountId?: string; // 'All' or specific
};

export type DashboardKpis = {
  totalCost: number;
  prevCost: number;
  delta: number;
  deltaPct: number | null; // null when prevCost is 0
  anomalyDays: number;
  topDriverName: string | null;
  topDriverDelta: number | null;
};

export type DriverRow = {
  name: string;
  current: number;
  previous: number;
  delta: number;
  deltaPct: number | null;
};

export type SeriesPoint = { date: string; cost: number };

export type AnomalyPoint = { date: string; cost: number; zScore: number };

export type DashboardModel = {
  rangeStart: string;
  rangeEnd: string;
  prevStart: string;
  prevEnd: string;

  kpis: DashboardKpis;
  series: SeriesPoint[];
  drivers: DriverRow[];
  anomalies: AnomalyPoint[];
  insights: string[];
  summaryMarkdown: string;
};
