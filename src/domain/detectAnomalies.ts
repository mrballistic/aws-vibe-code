import { SpendRow, Anomaly } from "./types";

function computeDailyTotals(rows: SpendRow[], clientId: string): Map<string, number> {
  const dailyTotals = new Map<string, number>();
  
  for (const row of rows) {
    if (row.clientId === clientId) {
      const current = dailyTotals.get(row.date) || 0;
      dailyTotals.set(row.date, current + row.usageUsd);
    }
  }
  
  return dailyTotals;
}

function computeStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0 };
  }
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  if (values.length < 2) {
    return { mean, stdDev: 0 };
  }
  
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return { mean, stdDev };
}

export function detectAnomalies(
  rows: SpendRow[],
  clientId: string,
  zScoreThreshold: number = 2.5
): Anomaly[] {
  const dailyTotals = computeDailyTotals(rows, clientId);
  
  // Need at least 2 days of data for meaningful stats
  if (dailyTotals.size < 2) {
    return [];
  }
  
  const values = Array.from(dailyTotals.values());
  const { mean, stdDev } = computeStats(values);
  
  // If no variation, no anomalies
  if (stdDev === 0) {
    return [];
  }
  
  const anomalies: Anomaly[] = [];
  
  for (const [date, dailyTotal] of dailyTotals.entries()) {
    const zScore = (dailyTotal - mean) / stdDev;
    
    if (Math.abs(zScore) >= zScoreThreshold) {
      anomalies.push({
        date,
        type: zScore > 0 ? "spike" : "dip",
        dailyTotal: Math.round(dailyTotal * 100) / 100,
        zScore: Math.round(zScore * 100) / 100,
      });
    }
  }
  
  // Sort by date ascending
  anomalies.sort((a, b) => a.date.localeCompare(b.date));
  
  return anomalies;
}
