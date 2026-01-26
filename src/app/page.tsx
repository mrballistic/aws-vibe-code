'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@cloudscape-design/components/app-layout';
import TopNavigation from '@cloudscape-design/components/top-navigation';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Grid from '@cloudscape-design/components/grid';
import { applyMode, Mode } from '@cloudscape-design/global-styles';

import { 
  buildDashboardModel, 
  detectAnomalies, 
  generateInsights, 
  filterRows,
  type SpendRow 
} from '@/domain';

import KPICards from '@/components/KPICards';
import DriversTable from '@/components/DriversTable';
import InsightsPanel from '@/components/InsightsPanel';
import AnomaliesPanel from '@/components/AnomaliesPanel';
import Filters from '@/components/Filters';

import fixtureData from '../../public/data/synthetic_wellness_aws_poc_named.json';

export default function Page() {
  const [mode, setMode] = useState<Mode>(Mode.Light);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: fixtureData.meta.date_windows.current_qtd.start,
    end: fixtureData.meta.date_windows.current_qtd.end,
  });

  // Detect and apply browser color scheme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateMode = () => {
      setMode(mediaQuery.matches ? Mode.Dark : Mode.Light);
    };
    
    // Set initial mode
    updateMode();
    
    // Listen for changes
    mediaQuery.addEventListener('change', updateMode);
    return () => mediaQuery.removeEventListener('change', updateMode);
  }, []);

  // Apply theme mode
  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  // Load and transform data
  const allRows: SpendRow[] = useMemo(() => 
    fixtureData.usage_daily_usd.map((row: any) => ({
      date: row.date,
      clientId: row.client_id,
      awsService: row.aws_service,
      usageUsd: row.usage_usd,
    })),
    []
  );

  // Apply filters
  const filteredRows = useMemo(() => {
    return filterRows(allRows, {
      dateRange: { start: dateRange.start, end: dateRange.end },
      clientIds: selectedClient === 'all' ? undefined : [selectedClient],
      awsServices: selectedServices.length > 0 ? selectedServices : undefined,
    });
  }, [allRows, selectedClient, selectedServices, dateRange]);

  // Compute dashboard model
  const model = useMemo(() => {
    return buildDashboardModel(filteredRows, {
      asOfDate: dateRange.end,
      comparisonMode: 'QoQ',
    });
  }, [filteredRows, dateRange.end]);

  // Detect anomalies for selected client or all
  const anomalies = useMemo(() => {
    if (selectedClient === 'all') {
      return [];
    }
    return detectAnomalies(filteredRows, selectedClient, 2.5);
  }, [filteredRows, selectedClient]);

  // Generate insights
  const insights = useMemo(() => {
    return generateInsights({
      drivers: model.drivers,
      anomalies,
      totalDelta: model.totals.deltaUsd,
    });
  }, [model.drivers, model.totals.deltaUsd, anomalies]);

  const clients = fixtureData.entities.clients.map((c: any) => ({
    id: c.client_id,
    name: c.client_name,
  }));

  const services = fixtureData.entities.aws_services;

  return (
    <>
      <TopNavigation
        identity={{
          href: '#',
          title: 'AWS Usage Insights',
          logo: { src: '/aws-vibe-code/aws-logo.svg', alt: 'AWS' }
        }}
        utilities={[
          {
            type: 'menu-dropdown',
            text: 'Wellness Domain',
            description: 'Single Seller',
            iconName: 'user-profile',
            items: [
              { id: 'profile', text: 'Seller Profile' },
              { id: 'settings', text: 'Settings' },
            ],
          },
        ]}
      />

      <AppLayout
        navigationHide
        toolsHide
        content={
          <ContentLayout
            header={
              <Header
                variant="h1"
                description="Quarter-to-date insights for customer AWS usage and spend trends"
              >
                AWS Usage Insights Dashboard
              </Header>
            }
          >
            <SpaceBetween size="l">
              <Filters
                clients={clients}
                services={services}
                selectedClient={selectedClient}
                selectedServices={selectedServices}
                dateRange={dateRange}
                onClientChange={setSelectedClient}
                onServicesChange={setSelectedServices}
                onDateRangeChange={setDateRange}
              />

              <KPICards totals={model.totals} />

              <Grid gridDefinition={[{ colspan: 7 }, { colspan: 5 }]}>
                <DriversTable drivers={model.drivers} />
                <SpaceBetween size="m">
                  <InsightsPanel insights={insights} />
                  {selectedClient !== 'all' && anomalies.length > 0 && (
                    <AnomaliesPanel anomalies={anomalies} clientName={
                      clients.find(c => c.id === selectedClient)?.name || selectedClient
                    } />
                  )}
                </SpaceBetween>
              </Grid>
            </SpaceBetween>
          </ContentLayout>
        }
      />
    </>
  );
}
