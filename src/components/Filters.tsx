import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import Select from '@cloudscape-design/components/select';
import Multiselect from '@cloudscape-design/components/multiselect';
import DateRangePicker from '@cloudscape-design/components/date-range-picker';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ColumnLayout from '@cloudscape-design/components/column-layout';

interface FiltersProps {
  clients: Array<{ id: string; name: string }>;
  services: string[];
  selectedClient: string;
  selectedServices: string[];
  dateRange: { start: string; end: string };
  onClientChange: (clientId: string) => void;
  onServicesChange: (services: string[]) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
}

export default function Filters({
  clients,
  services,
  selectedClient,
  selectedServices,
  dateRange,
  onClientChange,
  onServicesChange,
  onDateRangeChange,
}: FiltersProps) {
  const clientOptions = [
    { label: 'All Clients', value: 'all' },
    ...clients.map(c => ({ label: c.name, value: c.id })),
  ];

  const serviceOptions = services.map(s => ({ label: s, value: s }));

  const selectedClientOption = clientOptions.find(o => o.value === selectedClient) || clientOptions[0];
  const selectedServiceOptions = serviceOptions.filter(o => selectedServices.includes(o.value));

  return (
    <Container>
      <ColumnLayout columns={3}>
        <FormField label="Client" description="Select customer to analyze">
          <Select
            selectedOption={selectedClientOption}
            onChange={({ detail }) => onClientChange(detail.selectedOption.value || 'all')}
            options={clientOptions}
            placeholder="Choose a client"
          />
        </FormField>

        <FormField label="AWS Services" description="Filter by specific services">
          <Multiselect
            selectedOptions={selectedServiceOptions}
            onChange={({ detail }) => 
              onServicesChange(detail.selectedOptions.map(o => o.value || ''))
            }
            options={serviceOptions}
            placeholder="All services"
            tokenLimit={2}
          />
        </FormField>

        <FormField label="Date Range" description="Quarter-to-date period">
          <DateRangePicker
            value={{
              type: 'absolute',
              startDate: dateRange.start,
              endDate: dateRange.end,
            }}
            onChange={({ detail }) => {
              if (detail.value && detail.value.type === 'absolute') {
                onDateRangeChange({
                  start: detail.value.startDate,
                  end: detail.value.endDate,
                });
              }
            }}
            relativeOptions={[]}
            isValidRange={() => ({ valid: true })}
            placeholder="Filter by date range"
            dateOnly
          />
        </FormField>
      </ColumnLayout>
    </Container>
  );
}
