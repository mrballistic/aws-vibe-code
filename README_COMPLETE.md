# AWS Usage Insights Dashboard - Complete! 🎉

## What Was Built

A fully functional AWS seller dashboard with **test-driven development (TDD)** following the PRD specifications.

### ✅ Domain Layer (37/37 tests passing)

**Core Functions:**
- `buildDashboardModel()` - Computes QoQ totals and driver rankings
- `computeQoQWindows()` - Calculates quarter-to-date comparison windows
- `rankDrivers()` - Ranks AWS services by absolute spend delta
- `filterRows()` - Filters data by date range, clients, services
- `detectAnomalies()` - Z-score based spike/dip detection (threshold ≥ 2.5σ)
- `generateInsights()` - Template-driven actionable seller insights

**Test Coverage:**
- 6 test suites covering all domain functions
- Validates against 74K+ row synthetic fixture
- Tests known anomalies (C03 spike on 2026-01-15, C07 dip on 2026-01-08)
- Deterministic calculations with exact assertions

### ✅ UI Layer (Cloudscape Design System)

**Components Built:**
- `KPICards` - Current/previous QTD spend with QoQ delta
- `DriversTable` - Service driver rankings with change badges
- `InsightsPanel` - Prioritized seller actions (high/medium/low)
- `AnomaliesPanel` - Client-specific spending anomalies
- `Filters` - Client, service, and date range filtering

**Features:**
- ✅ Dark mode support (toggle in top nav)
- ✅ Responsive Cloudscape layout
- ✅ Real-time filtering with useMemo optimization
- ✅ 19 clients, 10 AWS services
- ✅ QoQ (Quarter-over-Quarter) comparison mode

## Running the Dashboard

```bash
# Install dependencies (if needed)
npm install

# Run tests
npm test

# Start dev server
npm run dev
```

Then open http://localhost:3000

## How to Use

1. **Select a client** from the dropdown to see client-specific anomalies
2. **Filter by AWS services** to focus on specific services
3. **Adjust date range** to change the analysis period
4. **Toggle dark mode** in the top navigation
5. **Review insights** for actionable next steps

## Key Insights Generated

- **Top growth drivers** - Services with significant QoQ increases
- **Top declining services** - Services showing decreased usage
- **Spending spikes** - Anomalous high-spend days requiring follow-up
- **Spending dips** - Unusual drops indicating potential adoption risk

## Architecture

```
src/
├── domain/               # Pure TypeScript business logic
│   ├── types.ts         # Type definitions
│   ├── buildDashboardModel.ts
│   ├── computeQoQWindows.ts
│   ├── rankDrivers.ts
│   ├── filterRows.ts
│   ├── detectAnomalies.ts
│   ├── generateInsights.ts
│   └── *.test.ts        # Unit tests
├── components/          # Cloudscape UI components
│   ├── KPICards.tsx
│   ├── DriversTable.tsx
│   ├── InsightsPanel.tsx
│   ├── AnomaliesPanel.tsx
│   └── Filters.tsx
└── app/
    ├── layout.tsx       # Root layout
    └── page.tsx         # Main dashboard page
```

## Data Source

Uses synthetic fixture data in `public/data/synthetic_wellness_aws_poc_named.json`:
- 19 clients in Wellness domain
- 10 AWS services (DynamoDB, S3, Lambda, API Gateway, CloudFront, RDS/Aurora, SQS, SNS, Cognito, CloudWatch)
- Daily spend data for Q4 2025 and Q1 2026
- Known anomalies embedded for testing

## TDD Workflow Used

1. ✅ **Write failing test** (red)
2. ✅ **Implement minimal code** to pass (green)
3. ✅ **Refactor** while keeping tests green
4. ✅ **Repeat** for each function

All domain logic was built test-first, ensuring:
- Deterministic calculations
- Clear contracts
- Confident refactoring
- Regression prevention

## Next Steps (Parking Lot)

- Real AWS CUR data integration
- Budget vs actual comparisons
- Multi-seller support
- Authentication/authorization
- Chart visualizations (daily trends)
- Export to PDF/CSV
- Email alerts for anomalies

---

**Built with:** Next.js, TypeScript, Cloudscape Design, Vitest  
**Development approach:** PRD → TDD → UI  
**Status:** ✅ Fully functional vertical slice
