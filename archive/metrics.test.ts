import { describe, expect, it } from 'vitest';

import { generateSyntheticCur } from './generateSyntheticCur';
import { buildDashboardModel, detectAnomalies, generateInsights } from './metrics';
import type { AnomalyPoint, DriverRow, SeriesPoint } from './types';

function sumCost(rows: Array<{ cost: number }>): number {
  return Math.round(rows.reduce((a, r) => a + r.cost, 0) * 100) / 100;
}

describe('generateSyntheticCur', () => {
  it('is deterministic for the same seed + scenario + params', () => {
    const a = generateSyntheticCur({ seed: 123, scenario: 'baseline', days: 10, endDate: '2026-01-19' });
    const b = generateSyntheticCur({ seed: 123, scenario: 'baseline', days: 10, endDate: '2026-01-19' });

    expect(a.length).toBe(b.length);
    expect(sumCost(a)).toBe(sumCost(b));

    // Spot check a few rows for exact stability
    expect(a[0]).toEqual(b[0]);
    expect(a[50]).toEqual(b[50]);
  });
});

describe('buildDashboardModel', () => {
  it('computes totals, delta, and top driver for a known fixture', () => {
    const rows = [
      // prev period (2026-01-01..2026-01-02)
      { date: '2026-01-01', accountId: 'a1', accountName: 'A1', region: 'us-east-1', service: 'EC2', cost: 8 },
      { date: '2026-01-01', accountId: 'a1', accountName: 'A1', region: 'us-east-1', service: 'S3', cost: 2 },
      { date: '2026-01-02', accountId: 'a1', accountName: 'A1', region: 'us-east-1', service: 'EC2', cost: 8 },
      { date: '2026-01-02', accountId: 'a1', accountName: 'A1', region: 'us-east-1', service: 'S3', cost: 2 },

      // current period (2026-01-03..2026-01-04)
      { date: '2026-01-03', accountId: 'a1', accountName: 'A1', region: 'us-east-1', service: 'EC2', cost: 25 },
      { date: '2026-01-03', accountId: 'a1', accountName: 'A1', region: 'us-east-1', service: 'S3', cost: 5 },
      { date: '2026-01-04', accountId: 'a1', accountName: 'A1', region: 'us-east-1', service: 'EC2', cost: 25 },
      { date: '2026-01-04', accountId: 'a1', accountName: 'A1', region: 'us-east-1', service: 'S3', cost: 5 }
    ];

    const model = buildDashboardModel(rows as any, {
      rangeDays: 2,
      groupBy: 'service',
      endDate: '2026-01-04',
      anomalyZThreshold: 3 // make anomalies unlikely in this fixture
    });

    expect(model.rangeStart).toBe('2026-01-03');
    expect(model.rangeEnd).toBe('2026-01-04');
    expect(model.prevStart).toBe('2026-01-01');
    expect(model.prevEnd).toBe('2026-01-02');

    expect(model.kpis.totalCost).toBe(60);
    expect(model.kpis.prevCost).toBe(20);
    expect(model.kpis.delta).toBe(40);
    expect(model.kpis.deltaPct).toBeCloseTo(2.0, 6);

    expect(model.kpis.topDriverName).toContain('EC2');

    const top = model.drivers[0];
    expect(top.name).toBe('EC2');
    expect(top.delta).toBe(34);
  });
});

describe('detectAnomalies', () => {
  it('flags an obvious spike day using z-score', () => {
    const series: SeriesPoint[] = [
      { date: '2026-01-01', cost: 10 },
      { date: '2026-01-02', cost: 10 },
      { date: '2026-01-03', cost: 60 },
      { date: '2026-01-04', cost: 10 },
      { date: '2026-01-05', cost: 10 }
    ];

    const anomalies = detectAnomalies(series, 1.5);

    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].date).toBe('2026-01-03');
  });
});

describe('generateInsights', () => {
  it('includes the top driver name in the insight bullets', () => {
    const topDriver: DriverRow = {
      name: 'NAT Gateway',
      current: 100,
      previous: 10,
      delta: 90,
      deltaPct: 9
    };

    const anomalies: AnomalyPoint[] = [{ date: '2026-01-03', cost: 999, zScore: 4.2 }];

    const bullets = generateInsights({
      rangeStart: '2026-01-01',
      rangeEnd: '2026-01-07',
      prevStart: '2025-12-25',
      prevEnd: '2025-12-31',
      totalCost: 1000,
      prevCost: 900,
      delta: 100,
      deltaPct: 0.111,
      topDriver,
      anomalies
    });

    expect(bullets.join('\n')).toContain('NAT Gateway');
    expect(bullets.join('\n')).toContain('Recommended next step');
  });
});
