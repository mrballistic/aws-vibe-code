import { useState, useMemo } from 'react';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';
import Header from '@cloudscape-design/components/header';
import Badge from '@cloudscape-design/components/badge';
import { Driver } from '@/domain';

interface DriversTableProps {
  drivers: Driver[];
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function DriversTable({ drivers }: DriversTableProps) {
  const [sortingColumn, setSortingColumn] = useState<{ sortingField: string }>({ sortingField: 'deltaUsd' });
  const [sortingDescending, setSortingDescending] = useState(true);

  const sortedDrivers = useMemo(() => {
    const sorted = [...drivers].sort((a, b) => {
      const field = sortingColumn.sortingField as keyof Driver;
      const aVal = a[field];
      const bVal = b[field];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortingDescending ? bVal - aVal : aVal - bVal;
      }
      
      // String comparison for service name
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortingDescending 
        ? bStr.localeCompare(aStr) 
        : aStr.localeCompare(bStr);
    });
    return sorted;
  }, [drivers, sortingColumn, sortingDescending]);

  return (
    <Table
      onSortingChange={(event) => {
        setSortingColumn({ sortingField: event.detail.sortingColumn.sortingField || 'deltaUsd' });
        setSortingDescending(event.detail.isDescending || false);
      }}
      sortingColumn={sortingColumn}
      sortingDescending={sortingDescending}
      columnDefinitions={[
        {
          id: 'rank',
          header: 'Rank',
          cell: (_item: Driver, index?: number) => (index ?? 0) + 1,
          width: 60,
        },
        {
          id: 'service',
          header: 'AWS Service',
          cell: (item) => <strong>{item.service}</strong>,
          sortingField: 'service',
        },
        {
          id: 'current',
          header: 'Current QTD',
          cell: (item) => formatCurrency(item.currentUsd),
          sortingField: 'currentUsd',
        },
        {
          id: 'previous',
          header: 'Previous QTD',
          cell: (item) => formatCurrency(item.previousUsd),
          sortingField: 'previousUsd',
        },
        {
          id: 'delta',
          header: 'Change',
          cell: (item) => {
            const color = item.deltaUsd > 0 ? 'red' : item.deltaUsd < 0 ? 'green' : 'grey';
            const sign = item.deltaUsd > 0 ? '+' : '';
            return (
              <Badge color={color}>
                {sign}{formatCurrency(item.deltaUsd)}
              </Badge>
            );
          },
          sortingField: 'deltaUsd',
        },
      ]}
      items={sortedDrivers}
      loadingText="Loading drivers"
      sortingDisabled={false}
      variant="embedded"
      empty={
        <Box textAlign="center" color="inherit">
          <b>No data</b>
          <Box padding={{ bottom: 's' }} variant="p" color="inherit">
            No service drivers to display.
          </Box>
        </Box>
      }
      header={
        <Header
          variant="h2"
          description="AWS services ranked by absolute spend change (QoQ)"
        >
          Service Drivers
        </Header>
      }
    />
  );
}
