import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { downloadFile } from '../../../core/utils/downloadFile';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import QueryStateBoundary from '../../../shared/components/QueryStateBoundary';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCard';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import { ChartCard, recordToChartData } from '../../../shared/components/Charts';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';
import type { DataTableColumn } from '../../../shared/types/common.types';
import {
  reportsApi,
  type DriverUsageResponse,
  type RouteUsageResponse,
  type TransportReportFilters,
  type TransportReportRowResponse,
  type VehicleUsageResponse,
} from '../api/reportsApi';
import ReportDataTable from '../components/ReportDataTable';
import ReportOperationsPanel, { type ReportExportFormat } from '../components/ReportOperationsPanel';
import { formatDate, formatNumber, toDateTimeEndParam, toDateTimeStartParam } from '../utils/reportFormatters';

const statusOptions = ['ALL', 'DRAFT', 'ASSIGNED', 'PICKING', 'PACKING', 'READY_FOR_LOADING', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNING', 'RESCHEDULED', 'CANCELLED'] as const;
const priorityOptions = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

type TransportReportSavedState = {
  fromDate: string;
  toDate: string;
  status: (typeof statusOptions)[number];
  priority: (typeof priorityOptions)[number];
  sourceWarehouse: LookupOption | null;
  destinationWarehouse: LookupOption | null;
  vehicle: LookupOption | null;
  driver: LookupOption | null;
};


export default function TransportReportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState<(typeof statusOptions)[number]>('ALL');
  const [priority, setPriority] = useState<(typeof priorityOptions)[number]>('ALL');
  const [sourceWarehouse, setSourceWarehouse] = useState<LookupOption | null>(null);
  const [destinationWarehouse, setDestinationWarehouse] = useState<LookupOption | null>(null);
  const [vehicle, setVehicle] = useState<LookupOption | null>(null);
  const [driver, setDriver] = useState<LookupOption | null>(null);
  const [exportingTransportReport, setExportingTransportReport] = useState(false);
  const [exportFormat, setExportFormat] = useState<ReportExportFormat>('CSV');


  const savedState: TransportReportSavedState = {
    fromDate,
    toDate,
    status,
    priority,
    sourceWarehouse,
    destinationWarehouse,
    vehicle,
    driver,
  };

  const savedStateSummary = [
    fromDate ? `from ${fromDate}` : null,
    toDate ? `to ${toDate}` : null,
    status !== 'ALL' ? `status ${status}` : null,
    priority !== 'ALL' ? `priority ${priority}` : null,
    sourceWarehouse ? `source ${sourceWarehouse.label}` : null,
    destinationWarehouse ? `destination ${destinationWarehouse.label}` : null,
    vehicle ? `vehicle ${vehicle.label}` : null,
    driver ? `driver ${driver.label}` : null,
  ].filter(Boolean).join(' · ') || 'All transport records';

  function applySavedState(state: TransportReportSavedState) {
    setFromDate(state.fromDate);
    setToDate(state.toDate);
    setStatus(state.status);
    setPriority(state.priority);
    setSourceWarehouse(state.sourceWarehouse);
    setDestinationWarehouse(state.destinationWarehouse);
    setVehicle(state.vehicle);
    setDriver(state.driver);
  }

  const reportPresets = [
    { id: 'active', label: 'Active operations', description: 'Assigned and in-progress transport work.', apply: () => { setStatus('IN_TRANSIT'); setPriority('ALL'); } },
    { id: 'delivered', label: 'Delivered', description: 'Completed transport operations.', apply: () => { setStatus('DELIVERED'); setPriority('ALL'); } },
    { id: 'urgent', label: 'Urgent priority', description: 'High-pressure transport orders.', apply: () => { setStatus('ALL'); setPriority('URGENT'); } },
  ];

  const filters: TransportReportFilters = {
    fromDate: toDateTimeStartParam(fromDate),
    toDate: toDateTimeEndParam(toDate),
    status,
    priority,
    sourceWarehouseId: sourceWarehouse?.id,
    destinationWarehouseId: destinationWarehouse?.id,
    vehicleId: vehicle?.id,
    assignedEmployeeId: driver?.id,
  };

  const reportQuery = useQuery({
    queryKey: ['reports', 'transport', filters],
    queryFn: () => reportsApi.getTransportReport(filters),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const report = reportQuery.data;

  const routeColumns = useMemo<DataTableColumn<RouteUsageResponse>[]>(() => [
    { id: 'route', header: 'Route', minWidth: 360, render: (row) => `${row.sourceWarehouseName} → ${row.destinationWarehouseName}` },
    { id: 'transportsTotal', header: 'Transports', align: 'right', minWidth: 130, render: (row) => formatNumber(row.transportsTotal) },
    { id: 'completedTransports', header: 'Completed', align: 'right', minWidth: 130, render: (row) => formatNumber(row.completedTransports) },
    { id: 'totalWeight', header: 'Weight', align: 'right', minWidth: 130, render: (row) => formatNumber(row.totalWeight) },
  ], []);

  const vehicleColumns = useMemo<DataTableColumn<VehicleUsageResponse>[]>(() => [
    { id: 'vehicle', header: 'Vehicle', minWidth: 280, render: (row) => `${row.registrationNumber} · ${row.vehicleLabel}` },
    { id: 'transportsTotal', header: 'Transports', align: 'right', minWidth: 130, render: (row) => formatNumber(row.transportsTotal) },
    { id: 'completedTransports', header: 'Completed', align: 'right', minWidth: 130, render: (row) => formatNumber(row.completedTransports) },
  ], []);

  const driverColumns = useMemo<DataTableColumn<DriverUsageResponse>[]>(() => [
    { id: 'driverName', header: 'Driver', minWidth: 240, render: (row) => row.driverName },
    { id: 'transportsTotal', header: 'Transports', align: 'right', minWidth: 130, render: (row) => formatNumber(row.transportsTotal) },
    { id: 'completedTransports', header: 'Completed', align: 'right', minWidth: 130, render: (row) => formatNumber(row.completedTransports) },
  ], []);

  const transportColumns = useMemo<DataTableColumn<TransportReportRowResponse>[]>(() => [
    { id: 'orderNumber', header: 'Order', minWidth: 170, render: (row) => row.orderNumber },
    { id: 'status', header: 'Status', minWidth: 150, render: (row) => row.status },
    { id: 'priority', header: 'Priority', minWidth: 140, render: (row) => row.priority },
    { id: 'route', header: 'Route', minWidth: 330, render: (row) => `${row.sourceWarehouseName ?? '—'} → ${row.destinationWarehouseName ?? '—'}` },
    { id: 'vehicleRegistrationNumber', header: 'Vehicle', minWidth: 170, render: (row) => row.vehicleRegistrationNumber ?? '—' },
    { id: 'assignedEmployeeName', header: 'Driver', minWidth: 220, render: (row) => row.assignedEmployeeName ?? '—' },
    { id: 'totalWeight', header: 'Weight', align: 'right', minWidth: 130, render: (row) => formatNumber(row.totalWeight) },
    { id: 'departureTime', header: 'Departure', minWidth: 190, nowrap: true, render: (row) => formatDate(row.departureTime) },
  ], []);

  async function handleExportReport() {
    setExportingTransportReport(true);
    try {
      const data = await reportsApi.exportTransportReport(filters, exportFormat);
      downloadFile({
        data,
        fileName: `transport-report.${exportFormat === 'CSV' ? 'csv' : 'xlsx'}`,
        mimeType: exportFormat === 'CSV' ? 'text/csv;charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } finally {
      setExportingTransportReport(false);
    }
  }

  function resetFilters() {
    setFromDate('');
    setToDate('');
    setStatus('ALL');
    setPriority('ALL');
    setSourceWarehouse(null);
    setDestinationWarehouse(null);
    setVehicle(null);
    setDriver(null);
  }

  return (
    <Stack spacing={3}>
      <PageHeader overline="Reports" title="Transport Report" description="Transport operations report with status totals, route usage, driver usage, and vehicle usage." />

      <TableLayout
        title="Report filters"
        description="Filters are applied on backend report data."
        filters={
          <FilterPanel>
            <TextField type="date" size="small" label="From date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" label="To date" value={toDate} onChange={(event) => setToDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value as (typeof statusOptions)[number])} sx={{ minWidth: 180 }}>
              {statusOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as (typeof priorityOptions)[number])} sx={{ minWidth: 180 }}>
              {priorityOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <EntityLookupField label="Source warehouse" entityType="warehouses" value={sourceWarehouse} onChange={setSourceWarehouse} placeholder="All" searchPlaceholder="Search warehouses..." />
            <EntityLookupField label="Destination warehouse" entityType="warehouses" value={destinationWarehouse} onChange={setDestinationWarehouse} placeholder="All" searchPlaceholder="Search warehouses..." />
            <EntityLookupField label="Vehicle" entityType="vehicles" value={vehicle} onChange={setVehicle} placeholder="All" searchPlaceholder="Search vehicles..." />
            <EntityLookupField label="Driver" entityType="employees" value={driver} onChange={setDriver} placeholder="All" searchPlaceholder="Search drivers..." />
            <Button variant="outlined" onClick={resetFilters}>Reset</Button>
            <Button variant="contained" onClick={() => void handleExportReport()} disabled={exportingTransportReport}>{exportingTransportReport ? 'Exporting...' : `Export ${exportFormat}`}</Button>
          </FilterPanel>
        }
        table={null}
      />



      <ReportOperationsPanel<TransportReportSavedState>
        storageKey="reports.transport.savedFilters"
        currentState={savedState}
        currentSummary={savedStateSummary}
        presets={reportPresets}
        snapshots={report ? [
          { label: 'Total transports', value: formatNumber(report.totalTransports), severity: 'info' },
          { label: 'Delayed', value: formatNumber(report.delayedTransports), severity: report.delayedTransports > 0 ? 'warning' : 'success' },
          { label: 'Success rate', value: `${formatNumber(report.deliverySuccessRate)}%`, severity: 'success' },
          { label: 'Avg delay', value: `${formatNumber(report.averageDelayMinutes)} min`, severity: report.averageDelayMinutes > 0 ? 'warning' : 'default' },
        ] : []}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        onApplySavedFilter={applySavedState}
      />

      <QueryStateBoundary
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        isEmpty={!report}
        loadingMessage="Loading transport report..."
        errorTitle="Transport report could not be loaded"
        errorDescription="Backend report endpoint failed to return data."
        emptyTitle="No transport report data"
        emptyDescription="Adjust filters or retry after backend data is available."
        onRetry={() => void reportQuery.refetch()}
      >
        {report ? (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' } }}>
            <StatCard title="Total transports" value={formatNumber(report.totalTransports)} subtitle={`${formatNumber(report.activeTransports)} active`} icon={<LocalShippingRoundedIcon fontSize="small" />} accent="primary" />
            <StatCard title="Completed" value={formatNumber(report.completedTransports)} subtitle={`${formatNumber(report.deliverySuccessRate)}% success rate`} icon={<AssignmentTurnedInRoundedIcon fontSize="small" />} accent="success" />
            <StatCard title="Delayed" value={formatNumber(report.delayedTransports)} subtitle={`${formatNumber(report.averageDelayMinutes)} min avg delay`} icon={<CancelRoundedIcon fontSize="small" />} accent="warning" />
            <StatCard title="Planned weight" value={formatNumber(report.totalPlannedWeight)} subtitle={`${formatNumber(report.completedTransportWeight)} completed · ${formatNumber(report.averageTransportDurationMinutes)} min avg`} icon={<ScaleRoundedIcon fontSize="small" />} accent="info" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' } }}>
            <ChartCard title="Transports by status" description="Transport lifecycle distribution in the selected report scope." data={recordToChartData(report.transportsByStatus)} kind="donut" />
            <ChartCard title="Transports by priority" description="Operational priority distribution for selected transports." data={recordToChartData(report.transportsByPriority)} kind="bar" />
            <ChartCard title="Transports by vehicle" description="Top vehicles by assigned transport count." data={report.vehicleUsage.slice(0, 10).map((item) => ({ key: String(item.vehicleId), label: item.registrationNumber, value: item.transportsTotal, secondaryValue: item.completedTransports }))} kind="bar" />
            <ChartCard title="Transports by driver" description="Top drivers by assigned transport count." data={report.driverUsage.slice(0, 10).map((item) => ({ key: String(item.employeeId), label: item.driverName, value: item.transportsTotal, secondaryValue: item.completedTransports }))} kind="bar" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
            <SectionCard title="Status breakdown"><Stack spacing={1}>{Object.entries(report.transportsByStatus).map(([key, value]) => <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>)}</Stack></SectionCard>
            <SectionCard title="Priority breakdown"><Stack spacing={1}>{Object.entries(report.transportsByPriority).map(([key, value]) => <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>)}</Stack></SectionCard>
          </Box>

          <SectionCard title="Operational quality" description="Delay, cancellation and duration indicators derived from transport lifecycle timestamps.">
            <Stack spacing={1}>
              <Typography variant="body2">Cancelled: {formatNumber(report.cancelledTransports)} ({formatNumber(report.cancellationRate)}%)</Typography>
              <Typography variant="body2">Failed: {formatNumber(report.failedTransports)}</Typography>
              <Typography variant="body2">Delayed: {formatNumber(report.delayedTransports)}</Typography>
              <Typography variant="body2">Average duration: {formatNumber(report.averageTransportDurationMinutes)} minutes</Typography>
            </Stack>
          </SectionCard>

          <TableLayout title="Top routes" description="Routes ordered by transport count." table={<ReportDataTable title="top routes" rows={report.routeUsage} columns={routeColumns} getRowId={(row) => `${row.sourceWarehouseId}-${row.destinationWarehouseId}`} minWidth={760} />} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
            <TableLayout title="Vehicle usage" table={<ReportDataTable title="vehicle usage rows" rows={report.vehicleUsage} columns={vehicleColumns} getRowId={(row) => row.vehicleId} minWidth={560} />} />
            <TableLayout title="Driver usage" table={<ReportDataTable title="driver usage rows" rows={report.driverUsage} columns={driverColumns} getRowId={(row) => row.employeeId} minWidth={520} />} />
          </Box>
          <TableLayout title="Transport rows" description="Raw transport rows included in this report." table={<ReportDataTable title="transport rows" rows={report.rows} columns={transportColumns} getRowId={(row) => row.id} minWidth={1510} />} />
        </Stack>
      ) : null}
      </QueryStateBoundary>
    </Stack>
  );
}
