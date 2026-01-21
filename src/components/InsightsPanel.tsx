import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Badge from '@cloudscape-design/components/badge';
import { Insight } from '@/domain';

interface InsightsPanelProps {
  insights: Insight[];
}

const priorityColorMap: Record<string, 'red' | 'blue' | 'grey'> = {
  high: 'red',
  medium: 'blue',
  low: 'grey',
};

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <Container
        header={
          <Header variant="h2">Today&apos;s Actions</Header>
        }
      >
        <Box textAlign="center" color="text-status-inactive" padding="xxl">
          No significant insights to display
        </Box>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header variant="h2" counter={`(${insights.length})`}>
          Today&apos;s Actions
        </Header>
      }
    >
      <SpaceBetween size="l">
        {insights.map((insight, index) => (
          <div key={index}>
            <SpaceBetween size="xs">
              <div>
                <Badge color={priorityColorMap[insight.priority]}>
                  {insight.priority.toUpperCase()}
                </Badge>
              </div>
              <Box variant="p">
                <strong>{insight.text}</strong>
              </Box>
              <Box variant="small" color="text-body-secondary">
                <strong>Action:</strong> {insight.action}
              </Box>
            </SpaceBetween>
            {index < insights.length - 1 && <Box padding={{ top: 's' }} />}
          </div>
        ))}
      </SpaceBetween>
    </Container>
  );
}
