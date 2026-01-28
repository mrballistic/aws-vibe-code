# AWS Vibe Code — Consultant Insights Dashboard

An AWS usage insights dashboard demonstrating TDD principles and modern React development.

## Tech Stack

- **Next.js 16.1** - React framework with App Router
- **React 19** - Latest React with improved performance
- **TypeScript 5.7** - Type-safe development
- **Cloudscape Design System** - AWS-native UI components
- **MUI X Charts** - Data visualization
- **Vitest 4** - Fast unit testing + coverage

## What it demonstrates

- **PRD → acceptance criteria → tests → code**
- A consultant-style dashboard that answers:
  1) What changed?
  2) So what (impact + drivers)?
  3) Now what (recommendations)?
- **Cloudscape** used for AWS-native layout, tables, controls
- **MUI X Charts** used for quick charting
- **TDD** focused on the **insight engine** in `src/domain`

## Quick start

```bash
npm install
npm test -- --coverage
npm run dev
```

Open: http://localhost:3000

## Development

- **Build**: `npm run build`
- **Test**: `npm test` or `npm run test:watch`
- **Coverage**: `npm test -- --coverage`
- **Lint**: `npm run lint`

## Where to code during the workshop

- Domain (tests first):
  - `src/domain/buildDashboardModel.ts`
  - `src/domain/computeQoQWindows.ts`
  - `src/domain/filterRows.ts`
  - `src/domain/rankDrivers.ts`
  - `src/domain/detectAnomalies.ts`
  - `src/domain/generateInsights.ts`
  - `src/domain/*.test.ts`
- UI wiring:
  - `src/app/page.tsx`
  - `src/components/*`

## Common workshop move

1. Add an acceptance criterion to your PRD.
2. Add a test in `src/domain/*.test.ts`.
3. Implement the smallest code change to make tests green.
4. Wire the result into the UI.

## License

MIT License - see [LICENSE](LICENSE) for details.
