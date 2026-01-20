import type { CurRow, Scenario } from './types';
import { addDaysUTC, isoUTCDate } from './date';

type GenerateArgs = {
  seed: number;
  scenario: Scenario;
  days?: number; // total days generated, ending at endDate (inclusive)
  endDate?: string; // YYYY-MM-DD (UTC), defaults to today in UTC
};

// Small, deterministic RNG (mulberry32)
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSyntheticCur({ seed, scenario, days = 60, endDate }: GenerateArgs): CurRow[] {
  const rnd = mulberry32(seed);

  const resolvedEnd = endDate ?? isoUTCDate(new Date());
  const start = addDaysUTC(resolvedEnd, -(days - 1));

  // Keep these fixed for workshop clarity.
  const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
  const services = ['EC2', 'S3', 'Lambda', 'DynamoDB', 'NAT Gateway', 'CloudFront'];
  const accounts = Array.from({ length: 12 }).map((_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return {
      accountId: `1111-2222-33${n}`,
      accountName: `Account ${n}`
    };
  });

  // Stable base costs by service.
  const serviceBase: Record<string, number> = {
    EC2: 35,
    S3: 10,
    Lambda: 6,
    DynamoDB: 8,
    'NAT Gateway': 12,
    CloudFront: 9
  };

  // Account multipliers (deterministic per seed).
  const accountMult: Record<string, number> = {};
  for (const a of accounts) {
    // between ~0.7 and ~1.6
    accountMult[a.accountId] = 0.7 + rnd() * 0.9;
  }

  const regionMult: Record<string, number> = {
    'us-east-1': 1.0,
    'us-west-2': 1.05,
    'eu-west-1': 0.95,
    'ap-southeast-1': 0.9
  };

  // Scenario knobs (chosen for “consulting stories”)
  const spikeService = 'NAT Gateway';
  const spikeRegion = 'us-west-2';
  const spikeStart = addDaysUTC(resolvedEnd, -10); // 11 days before end
  const spikeEnd = addDaysUTC(resolvedEnd, -8); // 9 days before end (3 days total)

  const optimizationService = 'EC2';
  const optimizationCutover = addDaysUTC(resolvedEnd, -22);

  const expansionRegion = 'ap-southeast-1';

  const rows: CurRow[] = [];

  // Generate day-by-day.
  for (let offset = 0; offset < days; offset++) {
    const date = addDaysUTC(start, offset);

    // Small seasonality (weekly-ish): deterministic from day index.
    const seasonality = 1 + 0.08 * Math.sin((2 * Math.PI * offset) / 7);

    // Scenario: regional expansion ramps over time.
    const expansionRamp = 1 + (offset / (days - 1)) * 1.8; // up to ~2.8x

    for (const a of accounts) {
      for (const region of regions) {
        for (const service of services) {
          const base = serviceBase[service] ?? 5;
          const aMult = accountMult[a.accountId] ?? 1;
          const rMult = regionMult[region] ?? 1;

          // Noise: between 0.85 and 1.15
          const noise = 0.85 + rnd() * 0.3;

          let cost = base * aMult * rMult * seasonality * noise;

          // Scenario injections.
          if (scenario === 'spike') {
            if (service === spikeService && region === spikeRegion && date >= spikeStart && date <= spikeEnd) {
              cost *= 6;
            }
          }

          if (scenario === 'optimization-win') {
            if (service === optimizationService && date >= optimizationCutover) {
              cost *= 0.65;
            }
          }

          if (scenario === 'regional-expansion') {
            if (region === expansionRegion) {
              cost *= expansionRamp;
            }
          }

          // Round to cents.
          cost = Math.round(cost * 100) / 100;

          rows.push({
            date,
            accountId: a.accountId,
            accountName: a.accountName,
            region,
            service,
            cost
          });
        }
      }
    }
  }

  return rows;
}

export const _internal = {
  mulberry32
};
