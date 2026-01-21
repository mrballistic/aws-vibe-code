import { Insight, InsightInput } from "./types";

function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  return `$${absAmount.toLocaleString("en-US", { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatCurrency(delta)}`;
}

export function generateInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];

  // Anomaly insights (highest priority)
  for (const anomaly of input.anomalies) {
    if (anomaly.type === "spike") {
      insights.push({
        type: "anomaly_spike",
        priority: "high",
        text: `Spending spike detected on ${anomaly.date} with ${formatCurrency(anomaly.dailyTotal)} daily total (${anomaly.zScore.toFixed(1)}σ above normal).`,
        action: "Reach out to confirm launch/scale event; offer cost guardrails and optimization review.",
      });
    } else if (anomaly.type === "dip") {
      insights.push({
        type: "anomaly_dip",
        priority: "high",
        text: `Spending dip detected on ${anomaly.date} with ${formatCurrency(anomaly.dailyTotal)} daily total (${Math.abs(anomaly.zScore).toFixed(1)}σ below normal).`,
        action: "Investigate potential adoption risk, service incident, or account changes; propose enablement support.",
      });
    }
  }

  // Top driver insights
  if (input.drivers.length > 0) {
    const topDriver = input.drivers[0];
    const absDelta = Math.abs(topDriver.deltaUsd);

    // Only generate driver insights if delta is significant
    if (absDelta >= 100) {
      if (topDriver.deltaUsd > 0) {
        insights.push({
          type: "top_driver_growth",
          priority: "medium",
          text: `${topDriver.service} is the top growth driver with ${formatDelta(topDriver.deltaUsd)} increase (${formatCurrency(topDriver.previousUsd)} → ${formatCurrency(topDriver.currentUsd)}).`,
          action: "Confirm workload expansion is expected; discuss commitment discounts (Savings Plans/RIs) if sustained growth.",
        });
      } else {
        insights.push({
          type: "top_driver_decline",
          priority: "medium",
          text: `${topDriver.service} is the top declining service with ${formatDelta(topDriver.deltaUsd)} decrease (${formatCurrency(topDriver.previousUsd)} → ${formatCurrency(topDriver.currentUsd)}).`,
          action: "Investigate adoption risk, workload migration, or optimization efforts; ensure customer satisfaction.",
        });
      }
    }

    // Check for secondary significant driver
    if (input.drivers.length > 1) {
      const secondDriver = input.drivers[1];
      const secondAbsDelta = Math.abs(secondDriver.deltaUsd);
      
      if (secondAbsDelta >= 1000) {
        const insightType = secondDriver.deltaUsd > 0 ? "top_driver_growth" : "top_driver_decline";
        const actionText = secondDriver.deltaUsd > 0
          ? "Monitor for continued growth; propose cost optimization engagement."
          : "Follow up on usage reduction; assess if customer needs support.";

        insights.push({
          type: insightType,
          priority: "low",
          text: `${secondDriver.service} also shows significant change: ${formatDelta(secondDriver.deltaUsd)} (${formatCurrency(secondDriver.previousUsd)} → ${formatCurrency(secondDriver.currentUsd)}).`,
          action: actionText,
        });
      }
    }
  }

  // Summary insight if overall delta is significant
  if (Math.abs(input.totalDelta) >= 1000 && insights.length === 0) {
    const direction = input.totalDelta > 0 ? "increased" : "decreased";
    insights.push({
      type: "summary",
      priority: "low",
      text: `Overall spending has ${direction} by ${formatDelta(input.totalDelta)} QoQ.`,
      action: "Review account activity and discuss trends with customer.",
    });
  }

  return insights;
}
