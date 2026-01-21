# PRD — AWS Usage Insights Dashboard (PoC) — “Wellness” Domain

**Owner:** Todd Greco
**Date:** 2026-01-21
**Status:** Draft (PoC-ready)

---

## 1) Summary

Build a dashboard that shows **AWS usage (USD spend)** across **multiple clients**, designed for **AWS sellers**. It must answer: **what products**, **consumption**, **what next**, and **today’s actions**. 

For this PoC, we’ll work within the **“Wellness” domain** (the seller’s assigned domain). All synthetic clients in the dataset are assumed to be within Wellness and owned by a **single seller**.

---

## 2) Users & Problem

### Primary user

* **AWS sellers** trying to get better insights on their customers. 

### Problem statement

Sellers need a fast way to:

* see which accounts are trending up/down in AWS spend,
* understand **which AWS services are driving the change**,
* and know **what to do next / today**.

---

## 3) Goals

1. Provide an at-a-glance view of AWS spend and trends across clients. 
2. Show key KPIs: **quota**, **delta to trend (incl QoQ)**, **forecast to actuals**. 
3. Surface **outliers** and a **distance-to-quota** indicator to focus seller attention. 
4. Generate deterministic “what next / today’s actions” insights grounded in the computed metrics. 

---

## 4) Non-Goals / Out of Scope (PoC)

* Real AWS data integration (e.g., CUR, Athena, QuickSight)
* Authentication/authorization
* Multi-page routing
* Database persistence
* Advanced chart interactions 

---

## 5) Key Questions the Dashboard Must Answer

* **What products:** Which AWS services are contributing most? 
* **Consumption:** How is spend trending over time and vs budget? 
* **What next:** Which accounts/services should the seller focus on next (and why)? 
* **Today’s actions:** Concrete recommended actions driven by detected signals. 

---

## 6) Scope & Assumptions (PoC)

### Data

* **Daily spend in USD** (`usage_usd`)
* **Customer-set budgets**: **monthly budget per service** (`monthly_budget_usd`) 

### Dataset shape

* **19 clients**, single seller, all clients in the **Wellness domain**
* **8–12 AWS services** (PoC target: 10)

### Time & comparisons

* **Calendar quarters**
* Default “delta-to-trend” comparison: **QoQ** (Quarter-to-date vs prior Quarter-to-date)

---

## 7) Functional Requirements

### FR1 — Filters

Support filtering by: **client**, **usage**, **date range**, **product (AWS service)**. 
Notes (PoC):

* “Usage” filter can be a simple threshold/toggle (e.g., show accounts above/below a spend level).
* Domain (Wellness) is assumed and does not need a UI filter for this PoC.

### FR2 — Dashboard KPIs

Compute and display:

* **Quota**
* **Delta to trend** (supports day-by-day, QoQ, YoY; QoQ is default)
* **Forecast to actuals** 

### FR3 — Visualizations

* **All-client view** that highlights **outliers** 
* **Distance-to-quota indicator** 
* Trend chart(s) for spend vs budget (daily)
* “Top drivers” panel (AWS services)
* “Insights” panel (what next / today’s actions)

### FR4 — Outliers (Option A)

**Client Outliers (ranking):**

* Rank clients by **absolute QoQ delta** on total spend (all services summed), and highlight top N.

**Daily Anomalies (spikes/dips):**

* For each client, compute a daily series of **total spend** (sum across services).
* Flag anomaly dates where **|z-score| ≥ 2.5**.

### FR5 — Driver Ranking (AWS services)

Provide a “drivers” ranking of AWS services responsible for changes in spend. The tested contract for `rankDrivers()` is **sort by absolute delta descending**. 

**Default comparison (QoQ, QTD vs prior QTD):**

* `asOfDate` = last date in selected range
* `currentWindow` = start of current quarter → `asOfDate`
* `previousWindow` = start of previous quarter → same number of elapsed days as currentWindow

For each service `s`:

* `current_s = Σ usage_usd(service=s, date ∈ currentWindow)`
* `prev_s = Σ usage_usd(service=s, date ∈ previousWindow)`
* `delta_s = current_s - prev_s`
* Rank by `abs(delta_s)` desc (tie-break: `current_s` desc, then service name asc)

Return per driver: `{ service, current, prev, delta, direction, shareOfAbsChange }`.

### FR6 — Insights (“What next” + “Today’s actions”)

Generate deterministic text insights that reference:

* driver names
* delta values
* recommended actions 

PoC approach: template-driven rules, e.g.

* **Spike** (positive anomaly / strong QoQ growth): “Reach out; confirm launch/scale event; offer cost guardrails.”
* **Dip** (negative anomaly / strong decline): “Investigate adoption risk or incident; propose enablement.”
* **Over budget** (usage QTD > budget QTD): “Cost optimization review; adjust budget/commitment discussion.”
* **Quota gap** (distance to quota remains high): “Target upsell on top-growing services / accounts.”

---

## 8) Data Model (PoC)

### Fact table (daily)

| Field       | Type       | Notes                |
| ----------- | ---------- | -------------------- |
| date        | YYYY-MM-DD | daily grain          |
| seller_id   | string     | single seller in PoC |
| domain      | string     | “Wellness”           |
| client_id   | string     | 19 clients           |
| client_name | string     | display              |
| aws_service | string     | 8–12 services        |
| usage_usd   | number     | daily spend in USD   |

### Budget table (monthly, per service)

| Field              | Type    | Notes                       |
| ------------------ | ------- | --------------------------- |
| month              | YYYY-MM | month bucket                |
| client_id          | string  |                             |
| aws_service        | string  |                             |
| monthly_budget_usd | number  | customer-set monthly budget |

**Daily budget roll-down (for trend/budget comparisons):**

* `daily_budget_usd = monthly_budget_usd / days_in_month`

---

## 9) KPI Definitions

### Spend

* `spend_current` = sum of `usage_usd` in the relevant window (e.g., QTD)

### Budget attainment

* `budget_current` = sum of `daily_budget_usd` in the same window
* `budget_variance = spend_current - budget_current`
* `budget_attainment = spend_current / budget_current` (guard divide-by-zero)

### Delta-to-trend (QoQ default)

* `qtd_current = Σ usage_usd over currentWindow`
* `qtd_prev = Σ usage_usd over previousWindow`
* `delta_qoq = qtd_current - qtd_prev`
* `delta_qoq_pct = delta_qoq / qtd_prev` (guard divide-by-zero)

### Forecast-to-actuals (PoC-simple)

* `forecast_quarter = (qtd_current / days_elapsed_in_quarter) * total_days_in_quarter`

### Quota & distance-to-quota (seller contract quota)

* `seller_quota_quarter_usd` = input constant (synthetic)
* `booked_commitment_quarter_usd` = Σ (monthly_budget_usd across services) × 3
* `distance_to_quota = seller_quota_quarter_usd - booked_commitment_quarter_usd`
* Display: indicator + whether on-track (distance ≤ 0) vs gap remaining.

---

## 10) Default AWS Services (PoC)

Target list (10 services; adjust to 8–12 as desired):

* DynamoDB, S3, Lambda, API Gateway, CloudFront, RDS/Aurora, SQS, SNS, Cognito, CloudWatch

---

## 11) Quality & Build Approach (PRD → Tests → Code)

This repo/workshop expects:

* Domain logic is tested; UI is validated visually in the browser. 
* Workflow: **PRD → acceptance criteria → failing tests → minimal code → refactor when green**. 
* Build a vertical slice end-to-end: **Filters → Domain logic → KPIs → Visualization → Insights**. 

---

## 12) Acceptance Criteria (Testable)

### AC-Data — `generateSyntheticCur()`

* Given the same `seed` and `scenario`, the generated dataset is identical. 
* Produces exactly **19 clients** and **8–12 services** per scenario.

### AC-Filter — `filterRows()`

* Applies date range, client/account, and service filters correctly. 
* (PoC) Regions not required.

### AC-KPIs — `computeKpis()`

* Computes QTD totals, prior QTD totals, QoQ delta, budget totals, and forecast correctly for fixture data. 

### AC-Drivers — `rankDrivers()`

* Returns services sorted by **absolute delta descending**. 
* In a fixture where DynamoDB has the largest abs delta, it is ranked #1.

### AC-Anomalies — `detectAnomalies()`

* Flags days exceeding the z-score threshold for a client’s daily total spend. 
* In a synthetic fixture with a known spike date, that date is flagged.

### AC-Insights — `generateInsights()`

* Output includes driver names, delta values, and at least one recommended action string. 
* In a fixture with a known top driver and delta, the insight text contains both.

---

## 13) Open Items (optional to resolve, not blockers)

* Pick a default `seller_quota_quarter_usd` value for the PoC scenario(s) (so the quota widget tells a consistent story).
* Finalize the exact set of insight templates (3–5) and their trigger thresholds (e.g., anomaly z-score, budget overage %, QoQ delta %).

