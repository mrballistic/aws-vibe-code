import { BuildParams, Window } from "./types";

function parseDate(dateStr: string): Date {
  // Parse YYYY-MM-DD in UTC to avoid timezone issues
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getQuarterStart(dateStr: string): string {
  const date = parseDate(dateStr);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const quarter = Math.floor(month / 3);
  const quarterStartMonth = quarter * 3 + 1;
  return `${year}-${String(quarterStartMonth).padStart(2, "0")}-01`;
}

function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(startStr: string, endStr: string): number {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export function computeQoQWindows(asOfDate: string): BuildParams {
  // Current quarter start
  const currentStart = getQuarterStart(asOfDate);
  
  // Days elapsed in current quarter (inclusive)
  const daysElapsed = daysBetween(currentStart, asOfDate);
  
  // Previous quarter start (3 months back)
  const previousStart = addDays(currentStart, -90); // approximate, will fix with proper quarter logic
  const actualPreviousStart = getQuarterStart(previousStart);
  
  // Previous quarter end (same number of days elapsed)
  const previousEnd = addDays(actualPreviousStart, daysElapsed);
  
  return {
    current: {
      start: currentStart,
      end: asOfDate,
    },
    previous: {
      start: actualPreviousStart,
      end: previousEnd,
    },
  };
}
