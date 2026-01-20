# AI Agent Guidelines for AWS Vibe Code

This codebase is designed for a **PRD + TDD workshop** where consultants build visual insights dashboards. The development workflow is intentionally strict to demonstrate best practices.

## Core Development Principles

### 1. Test-Driven Development (TDD) is Mandatory

**The Golden Rule:** Tests for logic, visuals for humans.

- All domain logic in `src/domain/` **must** have corresponding tests in `src/domain/*.test.ts`
- Tests must be written **before** implementation (red → green → refactor)
- UI components do **not** need comprehensive test coverage (speed over pixel perfection)

### 2. PRD → Acceptance Criteria → Tests → Code

The workflow is always:

1. **Write acceptance criterion** in PRD/requirements
2. **Translate to a failing test** that validates the criterion
3. **Implement minimal code** to make the test pass
4. **Refactor only when green** (never refactor while tests are red)

### 3. Vertical Slice Philosophy

Build one complete feature end-to-end:
- Filters → Domain logic → KPIs → Visualization → Insights

Avoid:
- Building all filters before any logic
- Implementing features not in the PRD
- Perfect UI polish at the expense of functional completeness

## What Gets Tested

### Domain Layer (`src/domain/`)

**Required test coverage:**

- ✅ **Data generation determinism** - Seeded scenarios produce consistent results
- ✅ **KPI calculations** - Totals, deltas, period-over-period math
- ✅ **Ranking algorithms** - Top drivers are correctly identified
- ✅ **Anomaly detection** - Spikes/dips are flagged correctly
- ✅ **Insight generation** - Text output includes correct data points

**Example test structure:**
```typescript
describe('buildDashboardModel', () => {
  it('computes totals, delta, and top driver for a known fixture', () => {
    const rows = [/* known data */];
    const model = buildDashboardModel(rows, params);
    
    expect(model.currentTotal).toBe(expected);
    expect(model.drivers[0].name).toBe('EC2');
  });
});
```

### UI Layer (`src/components/`, `src/app/`)

**Minimal testing:**
- Visual validation through manual dev testing
- No snapshot tests required
- No interaction tests required for this workshop scope

## Test Requirements by Function

### generateSyntheticCur()
- Must produce deterministic output for same seed + scenario
- Test validates same input → same output

### filterRows()
- Must correctly apply date ranges, accounts, services, regions
- Test with known filters → verify row counts

### computeKpis()
- Must calculate current/previous totals and delta correctly
- Test with fixture data → verify exact numbers

### rankDrivers()
- Must sort by absolute delta descending
- Test validates top driver is correct

### detectAnomalies()
- Must flag days exceeding z-score threshold
- Test with synthetic spike → verify anomaly date

### generateInsights()
- Must include driver names, deltas, and recommendations
- Test validates text contains expected data points

## When Working with AI Agents

### Do's ✅
- Ask agent to "write tests first for [feature]"
- Ask agent to "implement minimal code to pass these tests"
- Ask agent to "refactor while keeping tests green"
- Use small, focused prompts

### Don'ts ❌
- Don't ask to implement features without tests
- Don't ask to refactor before tests pass
- Don't ask for comprehensive UI tests
- Don't accept "trust me, it works" without test proof

## Scope Boundaries

### In Scope
- Insight engine logic (domain layer)
- Dashboard visualization wiring
- Synthetic data generation for demos

### Out of Scope (Parking Lot)
- Real AWS data integration (CUR, Athena, QuickSight)
- Authentication/authorization
- Multi-page routing
- Database persistence
- Advanced chart interactions

## Development Commands

```bash
# Write tests (should fail initially)
npm test

# Implement code to make tests pass
npm test

# Verify in browser
npm run dev

# Production build check
npm run build
```

## The Tests as Contract

Tests in this codebase serve as:
1. **Specification** - What the function must do
2. **Safety net** - Prevents regression when refactoring
3. **Documentation** - Shows how functions are intended to be used
4. **Trust builder** - Proves correctness without manual verification

When in doubt, follow this mantra:
> "If it's logic, it's tested. If it's visual, it's in the browser."

## Workshop Context

This repo demonstrates:
- How consultants translate requirements into tested code
- How to maintain velocity without creating chaos
- How TDD enables confident refactoring
- How to keep sales and engineering aligned on deliverables

The goal is not perfect code—it's a **shippable vertical slice** built with quality practices that scale.
