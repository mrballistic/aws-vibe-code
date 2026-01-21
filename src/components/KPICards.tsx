import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import Badge from '@cloudscape-design/components/badge';

interface KPICardsProps {
  totals: {
    currentUsd: number;
    previousUsd: number;
    deltaUsd: number;
  };
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercentage(current: number, previous: number): string {
  if (previous === 0) return 'N/A';
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export default function KPICards({ totals }: KPICardsProps) {
  const isIncrease = totals.deltaUsd > 0;
  const changeColor = isIncrease ? 'red' : 'green';

  return (
    <Container>
      <ColumnLayout columns={3} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">Current QTD Spend</Box>
          <Box variant="h2" fontSize="display-l" fontWeight="bold">
            {formatCurrency(totals.currentUsd)}
          </Box>
          <Box variant="small" color="text-status-inactive">
            Quarter to date
          </Box>
        </div>

        <div>
          <Box variant="awsui-key-label">Previous QTD Spend</Box>
          <Box variant="h2" fontSize="display-l" fontWeight="bold">
            {formatCurrency(totals.previousUsd)}
          </Box>
          <Box variant="small" color="text-status-inactive">
            Same period, prior quarter
          </Box>
        </div>

        <div>
          <Box variant="awsui-key-label">QoQ Change</Box>
          <Box variant="h2" fontSize="display-l" fontWeight="bold">
            <Badge color={changeColor}>
              {formatCurrency(Math.abs(totals.deltaUsd))}
            </Badge>
          </Box>
          <Box variant="small" color="text-status-inactive">
            {formatPercentage(totals.currentUsd, totals.previousUsd)} QoQ
          </Box>
        </div>
      </ColumnLayout>
    </Container>
  );
}
