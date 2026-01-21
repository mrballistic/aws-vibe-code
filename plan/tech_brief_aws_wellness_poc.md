# Tech Brief — AWS Usage Insights Dashboard (Synthetic PoC)

**Audience:** Product, Engineering, Workshop Participants  
**Status:** PoC / Prototype  
**Tech Stack:** Next.js, Cloudscape Design, Vitest

---

## 1. Purpose

This document describes the technical approach for a **synthetic prototype** dashboard that helps AWS sellers understand customer AWS usage, trends, and actions to take next. The goal is speed, clarity, and testability—not production hardening.

The dashboard answers four core questions:
- **What products?** (AWS services)
- **Consumption?** (daily USD spend vs budget)
- **What next?** (drivers and trends)
- **Today’s actions?** (deterministic insights)

---

## 2. High‑Level Architecture

The app is intentionally simple and layered to support a PRD → TDD → UI workflow.

### Layers

**1) Domain Layer (Pure TypeScript)**
- Location: `src/domain/`
- Responsibility: all business logic and calculations
- Characteristics:
  - deterministic
  - side‑effect free
  - fully unit tested with Vitest

Core domain functions:
- `filterRows()`
- `computeKpis()`
- `rankDrivers()`
- `detectAnomalies()`
- `generateInsights()`

**2) UI Layer (Next.js + Cloudscape)**
- Location: `src/app/`, `src/components/`
- Responsibility: rendering filters, KPIs, tables, charts, and insights
- UI is validated visually; logic is already tested in the domain layer

**3) Data Layer (Synthetic JSON)**
- Single JSON file loaded at runtime
- Acts as a stand‑in for CUR / billing APIs
- No backend, no persistence

---

## 3. Technology Choices

### Next.js
- App Router
- Single dashboard page is sufficient
- Used for composition and layout, not heavy server logic

### Cloudscape Design System
- Primary UI framework
- Used for:
  - layout
  - tables
  - filters
  - KPI containers
- Provides an AWS‑native look and feel suitable for seller tooling

### Vitest
- Used for all domain‑layer tests
- Fast feedback loop
- Enforces deterministic logic and clear contracts

---

## 4. Data Model (Synthetic)

### Dataset Characteristics
- **19 clients**
- **8–12 AWS services** (10 in default fixture)
- **Daily spend in USD**
- **Monthly budgets per service (USD)**
- **Single seller**
- **Single domain (Wellness)**

### Time Windows
- Calendar quarters
- Default comparison: **QoQ (Quarter‑to‑Date vs prior QTD)**

### Built‑in Scenarios
The dataset intentionally includes:
- a growth‑spike client
- a decline / adoption‑risk client
- an over‑budget client

These are used to validate:
- driver ranking
- anomaly detection
- insight generation

---

## 5. Core Calculations (Summary)

### Driver Ranking
- Per AWS service
- Ranked by **absolute QoQ delta** (QTD vs prior QTD)
- Deterministic tie‑breakers

### Outliers & Anomalies
- **Client outliers:** ranked by absolute QoQ delta on total spend
- **Daily anomalies:** z‑score on daily total spend
  - threshold: `|z| ≥ 2.5`

### Budgets
- Monthly budget per service
- Rolled down to daily for trend comparisons

### Quota
- Seller‑level quarterly quota (synthetic input)
- Compared against booked commitment (budget‑based proxy)

---

## 6. Testing Strategy

### What is tested
- **All domain logic**
- Tests live alongside logic (`*.test.ts`)
- Tests are written before implementation

### What is *not* tested
- Visual layout
- Chart rendering
- Component styling

This keeps the prototype fast and focused on correctness of insight.

---

## 7. Scope Boundaries (Intentional)

Out of scope for this PoC:
- Real AWS data integration
- Authentication / authorization
- Multi‑page navigation
- Backend services
- Persistent storage
- Advanced chart interactions

The goal is a **clean vertical slice**, not a production system.

---

## 8. Developer Workflow

1. Update PRD / acceptance criteria
2. Write failing Vitest tests for domain logic
3. Implement minimal logic to pass tests
4. Render results in the UI
5. Manually validate the dashboard

---

## 9. Definition of “Done” (PoC)

A seller can:
- select a date range and client
- see spend vs budget trends
- identify top AWS service drivers
- spot outlier clients and anomaly days
- read clear, metric‑backed “today’s actions”

All backed by deterministic logic and tests.

---

*This tech brief is intentionally lightweight and optimized for rapid prototyping, workshops, and demos.*

