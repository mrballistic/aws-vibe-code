import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Badge from '@cloudscape-design/components/badge';
import { Anomaly } from '@/domain';

interface AnomaliesPanelProps {
  anomalies: Anomaly[];
  clientName: string;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AnomaliesPanel({ anomalies, clientName }: AnomaliesPanelProps) {
  return (
    <Container
      header={
        <Header variant="h2" counter={`(${anomalies.length})`}>
          Anomalies - {clientName}
        </Header>
      }
    >
      <SpaceBetween size="m">
        {anomalies.map((anomaly, index) => (
          <div key={index}>
            <SpaceBetween size="xs">
              <div>
                <Badge color={anomaly.type === 'spike' ? 'red' : 'blue'}>
                  {anomaly.type.toUpperCase()}
                </Badge>
              </div>
              <Box variant="small">
                <strong>Date:</strong> {anomaly.date}
              </Box>
              <Box variant="small">
                <strong>Daily Total:</strong> {formatCurrency(anomaly.dailyTotal)}
              </Box>
              <Box variant="small" color="text-body-secondary">
                Z-score: {anomaly.zScore.toFixed(2)}σ
              </Box>
            </SpaceBetween>
          </div>
        ))}
      </SpaceBetween>
    </Container>
  );
}
