// Date helpers that are deterministic across time zones.
// We treat ISO strings as UTC dates in YYYY-MM-DD format.

export function isoUTCDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseISOToUTCDate(iso: string): Date {
  const parts = iso.split('-');
  if (parts.length !== 3) throw new Error(`Invalid ISO date: ${iso}`);
  const [y, m, d] = parts.map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDaysUTC(iso: string, deltaDays: number): string {
  const dt = parseISOToUTCDate(iso);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return isoUTCDate(dt);
}

export function daysBetweenInclusive(startISO: string, endISO: string): number {
  const s = parseISOToUTCDate(startISO).getTime();
  const e = parseISOToUTCDate(endISO).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((e - s) / dayMs) + 1;
}

export function maxISODate(values: string[]): string {
  if (values.length === 0) throw new Error('maxISODate: empty array');
  return values.reduce((max, v) => (v > max ? v : max), values[0]);
}
