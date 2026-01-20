'use client';

import React, { useMemo, useState } from 'react';

import AppLayout from '@cloudscape-design/components/app-layout';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Container from '@cloudscape-design/components/container';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import FormField from '@cloudscape-design/components/form-field';
import Select, { SelectProps } from '@cloudscape-design/components/select';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Flashbar from '@cloudscape-design/components/flashbar';

import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';

import type { CurRow, Filters, GroupByDimension, Scenario } from '@/domain/types';
import { generateSyntheticCur } from '@/domain/generateSyntheticCur';
import { buildDashboardModel, formatUsd } from '@/domain/metrics';

type FlashItem = {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  content: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
};

const scenarioOptions: SelectProps.Options = [
  { label: 'Baseline', value: 'baseline' },
  { label: 'Spike (NAT Gateway, us-west-2)', value: 'spike' },
  { label: 'Regional expansion (ap-southeast-1 ramps)', value: 'regional-expansion' },
  { label: 'Optimization win (EC2 drops mid-period)', value: 'optimization-win' }
];

const groupByOptions: SelectProps.Options = [
  { label: 'Service', value: 'service' },
  { label: 'Region', value: 'region' },
  { label: 'Account', value: 'account' }
];

const rangeOptions: SelectProps.Options = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 14 days', value: '14' },
  { label: 'Last 30 days', value: '30' }
];

const ALL: SelectProps.Option = { label: 'All', value: 'All' };

function findOption(options: SelectProps.Options, value: string): SelectProps.Option {
  const found = options.find((o) => o.value === value);
  return found ?? { label: value, value };
}

function uniq<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function safeInt(value: string, fallback: number): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export default function Dashboard() {
  // Controls
  const [scenario, setScenario] = useState<SelectProps.Option>(findOption(scenarioOptions, 'baseline'));
  const [seedText, setSeedText] = useState<string>('42');
  const [groupBy, setGroupBy] = useState<SelectProps.Option>(findOption(groupByOptions, 'service'));
  const [rangeDays, setRangeDays] = useState<SelectProps.Option>(findOption(rangeOptions, '14'));

  const [region, setRegion] = useState<SelectProps.Option>(ALL);
  const [service, setService] = useState<SelectProps.Option>(ALL);
  const [account, setAccount] = useState<SelectProps.Option>(ALL);

  const [rows, setRows] = useState<CurRow[]>(() =>
    generateSyntheticCur({ seed: 42, scenario: 'baseline', days: 60, endDate: '2026-01-19' })
  );

  const [flashItems, setFlashItems] = useState<FlashItem[]>([]);

  const regionOptions = useMemo<SelectProps.Options>(() => {
    const opts = uniq(rows.map((r) => r.region)).sort().map((v) => ({ label: v, value: v }));
    return [ALL, ...opts];
  }, [rows]);

  const serviceOptions = useMemo<SelectProps.Options>(() => {
    const opts = uniq(rows.map((r) => r.service)).sort().map((v) => ({ label: v, value: v }));
    return [ALL, ...opts];
  }, [rows]);

  const accountOptions = useMemo<SelectProps.Options>(() => {
    const opts = uniq(rows.map((r) => `${r.accountName} (${r.accountId})`))
      .sort()
      .map((label) => ({ label, value: label }));
    return [ALL, ...opts];
  }, [rows]);

  // Derive accountId filter from the label we render in options.
  const accountIdFromLabel = (label: string): string | undefined => {
    const m = label.match(/\(([^)]+)\)$/);
    return m?.[1];
  };

  const filters: Filters = useMemo(
    () => ({
      region: region.value === 'All' ? 'All' : String(region.value),
      service: service.value === 'All' ? 'All' : String(service.value),
      accountId:
        account.value === 'All' ? 'All' : (accountIdFromLabel(String(account.value)) ?? String(account.value))
    }),
    [region, service, account]
  );

  const model = useMemo(() => {
    return buildDashboardModel(rows, {
      rangeDays: safeInt(String(rangeDays.value), 14),
      groupBy: String(groupBy.value) as GroupByDimension,
      filters,
      endDate: '2026-01-19',
      anomalyZThreshold: 2.5
    });
  }, [rows, rangeDays, groupBy, filters]);

  const regenerate = () => {
    const seed = safeInt(seedText, 42);
    const scenarioValue = String(scenario.value) as Scenario;

    const next = generateSyntheticCur({ seed, scenario: scenarioValue, days: 60, endDate: '2026-01-19' });
    setRows(next);

    // reset filters to All to avoid empty states when the user was filtered to a specific account
    setRegion(ALL);
    setService(ALL);
    setAccount(ALL);

    setFlashItems([
      {
        id: 'regen',
        type: 'info',
        dismissible: true,
        content: `Generated synthetic data (seed=${seed}, scenario=${scenarioValue}).`,
        onDismiss: () => setFlashItems([])
      }
    ]);
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(model.summaryMarkdown);
      setFlashItems([
        {
          id: 'copy',
          type: 'success',
          dismissible: true,
          content: 'Summary copied to clipboard.',
          onDismiss: () => setFlashItems([])
        }
      ]);
    } catch {
      // Fallback: show the markdown on screen and let user copy manually.
      setFlashItems([
        {
          id: 'copy-fail',
          type: 'warning',
          dismissible: true,
          content: 'Could not access clipboard (browser permissions). You can manually copy from the markdown panel.',
          onDismiss: () => setFlashItems([])
        }
      ]);
    }
  };

  const content = (
    <ContentLayout
      header={
        <Header variant="h1" description="Synthetic Cost & Usage dataset → insight engine → visual story">
          Cost & Usage — What Changed?
        </Header>
      }
    >
      <SpaceBetween size="l">
        {flashItems.length > 0 ? <Flashbar items={flashItems as any} /> : null}

        <Container header={<Header variant="h2">Controls</Header>}>
          <ColumnLayout columns={4} variant="text-grid">
            <FormField label="Scenario">
              <Select
                selectedOption={scenario}
                onChange={(e) => setScenario(e.detail.selectedOption)}
                options={scenarioOptions}
              />
            </FormField>

            <FormField label="Seed">
              <Input
                type="number"
                value={seedText}
                onChange={(e) => setSeedText(e.detail.value)}
                inputMode="numeric"
              />
            </FormField>

            <FormField label="Analysis window">
              <Select
                selectedOption={rangeDays}
                onChange={(e) => setRangeDays(e.detail.selectedOption)}
                options={rangeOptions}
              />
            </FormField>

            <FormField label="Group drivers by">
              <Select selectedOption={groupBy} onChange={(e) => setGroupBy(e.detail.selectedOption)} options={groupByOptions} />
            </FormField>
          </ColumnLayout>

          <Box margin={{ top: 'm' }}>
            <Button variant="primary" onClick={regenerate}>
              Regenerate synthetic data
            </Button>
          </Box>
        </Container>

        <Container header={<Header variant="h2">Filters</Header>}>
          <ColumnLayout columns={3} variant="text-grid">
            <FormField label="Region">
              <Select
                selectedOption={region}
                onChange={(e) => setRegion(e.detail.selectedOption)}
                options={regionOptions}
              />
            </FormField>
            <FormField label="Service">
              <Select
                selectedOption={service}
                onChange={(e) => setService(e.detail.selectedOption)}
                options={serviceOptions}
              />
            </FormField>
            <FormField label="Account">
              <Select
                selectedOption={account}
                onChange={(e) => setAccount(e.detail.selectedOption)}
                options={accountOptions}
              />
            </FormField>
          </ColumnLayout>
        </Container>

        <Container header={<Header variant="h2">KPIs</Header>}>
          <ColumnLayout columns={4} variant="text-grid">
            <Kpi label="Total" value={formatUsd(model.kpis.totalCost)} hint={`${model.rangeStart} → ${model.rangeEnd}`} />
            <Kpi
              label="Change vs previous"
              value={`${model.kpis.delta >= 0 ? '+' : ''}${formatUsd(model.kpis.delta)}`}
              hint={model.kpis.deltaPct === null ? 'n/a' : `${(model.kpis.deltaPct * 100).toFixed(1)}%`}
            />
            <Kpi label="Anomaly days" value={String(model.kpis.anomalyDays)} hint="z-score detection" />
            <Kpi
              label="Top driver"
              value={model.kpis.topDriverName ?? '—'}
              hint={model.kpis.topDriverDelta === null ? '' : `${model.kpis.topDriverDelta >= 0 ? '+' : ''}${formatUsd(model.kpis.topDriverDelta)}`}
            />
          </ColumnLayout>
        </Container>

        <ColumnLayout columns={2} variant="text-grid">
          <Container header={<Header variant="h2">Trend</Header>}>
            <div style={{ width: '100%' }}>
              <LineChart
                height={320}
                xAxis={[{ scaleType: 'band', data: model.series.map((p) => p.date) }]}
                series={[{ data: model.series.map((p) => Math.round(p.cost)), label: 'Total cost (USD)' }]}
              />
            </div>
          </Container>

          <Container header={<Header variant="h2">Top movers (delta)</Header>}>
            <div style={{ width: '100%' }}>
              <BarChart
                height={320}
                xAxis={[{ scaleType: 'band', data: model.drivers.slice(0, 6).map((d) => d.name) }]}
                series={[{ data: model.drivers.slice(0, 6).map((d) => Math.round(d.delta)), label: 'Delta (USD)' }]}
              />
            </div>
          </Container>
        </ColumnLayout>

        <ColumnLayout columns={2} variant="text-grid">
          <Container header={<Header variant="h2">Top drivers table</Header>}>
            <Table
              items={model.drivers.slice(0, 15)}
              columnDefinitions={[
                {
                  id: 'name',
                  header: 'Driver',
                  cell: (item) => item.name
                },
                {
                  id: 'current',
                  header: 'Current',
                  cell: (item) => formatUsd(item.current)
                },
                {
                  id: 'previous',
                  header: 'Previous',
                  cell: (item) => formatUsd(item.previous)
                },
                {
                  id: 'delta',
                  header: 'Delta',
                  cell: (item) => `${item.delta >= 0 ? '+' : ''}${formatUsd(item.delta)}`
                },
                {
                  id: 'deltaPct',
                  header: 'Delta %',
                  cell: (item) => (item.deltaPct === null ? 'n/a' : `${(item.deltaPct * 100).toFixed(1)}%`)
                }
              ]}
              header={<Header variant="h3">Ranked by absolute delta</Header>}
              empty={<Box>No rows match the selected filters.</Box>}
            />
          </Container>

          <Container
            header={
              <Header
                variant="h2"
                actions={
                  <Button onClick={copySummary} iconName="copy">
                    Copy summary
                  </Button>
                }
              >
                Insights & recommendations
              </Header>
            }
          >
            <SpaceBetween size="m">
              <Box>
                <ul>
                  {model.insights.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </Box>

              <Container header={<Header variant="h3">Markdown summary (for pasting into an email/doc)</Header>}>
                <Box fontFamily="monospace" fontSize="body-s" whiteSpace="pre-wrap">
                  {model.summaryMarkdown}
                </Box>
              </Container>
            </SpaceBetween>
          </Container>
        </ColumnLayout>

        <Box color="text-body-secondary" fontSize="body-s">
          Data rows: {rows.length.toLocaleString()} • Current range: {model.rangeStart} → {model.rangeEnd} • Previous range:{' '}
          {model.prevStart} → {model.prevEnd}
        </Box>
      </SpaceBetween>
    </ContentLayout>
  );

  return <AppLayout navigationHide toolsHide contentType="dashboard" content={content} />;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Container>
      <SpaceBetween size="xs">
        <Box fontSize="body-s" color="text-body-secondary">
          {label}
        </Box>
        <Box fontSize="heading-l">{value}</Box>
        {hint ? (
          <Box fontSize="body-s" color="text-body-secondary">
            {hint}
          </Box>
        ) : null}
      </SpaceBetween>
    </Container>
  );
}
