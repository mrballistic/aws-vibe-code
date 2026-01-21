import { SpendRow, FilterOptions } from "./types";

export function filterRows(
  rows: SpendRow[],
  options: FilterOptions
): SpendRow[] {
  let filtered = rows;

  // Filter by date range (inclusive)
  if (options.dateRange) {
    const { start, end } = options.dateRange;
    filtered = filtered.filter(
      (r) => r.date >= start && r.date <= end
    );
  }

  // Filter by client IDs
  if (options.clientIds && options.clientIds.length > 0) {
    const clientSet = new Set(options.clientIds);
    filtered = filtered.filter((r) => clientSet.has(r.clientId));
  }

  // Filter by AWS services
  if (options.awsServices && options.awsServices.length > 0) {
    const serviceSet = new Set(options.awsServices);
    filtered = filtered.filter((r) => serviceSet.has(r.awsService));
  }

  return filtered;
}
