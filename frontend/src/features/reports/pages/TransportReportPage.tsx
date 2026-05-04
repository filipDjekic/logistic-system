import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { downloadFile } from '../../../core/utils/downloadFile';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
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

const statusOptions = ['ALL', 'CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'] as const;
const priorityOptions = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

function toDateTimeStartParam(value: string) {
  return value ? `${value}T00:00:00` : undefined;
}

function toDateTimeEndParam(value: string) {
  return value ? `${value}T23:59:59` : undefined;
}

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function TransportReportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState<(typeof statusOptions)[number]>('ALL');
  const [priority, setPriority] = useState<(typeof priorityOptions)[number]>('ALL');
  const [exportingTransportReport, setExportingTransportReport] = useState(false);

  const filters: TransportReportFilters = {
    fromDate: toDateTimeStartParam(fromDate),
    toDate: toDateTimeEndParam(toDate),
    status,
    priority,
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

  async function handleExportCsv() {
    setExportingTransportReport(true);
    try {
      const data = await reportsApi.exportTransportReport(filters);
      downloadFile({ data, fileName: 'transport-report.csv', mimeType: 'text/csv;charset=utf-8' });
    } finally {
      setExportingTransportReport(false);
    }
  }

  function resetFilters() {
    setFromDate('');
    setToDate('');
    setStatus('ALL');
    setPriority('ALL');
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
            <Button variant="outlined" onClick={resetFilters}>Reset</Button>
            <Button variant="contained" onClick={() => void handleExportCsv()} disabled={exportingTransportReport}>{exportingTransportReport ? 'Exporting...' : 'Export CSV'}</Button>
          </FilterPanel>
        }
        table={null}
      />

      {reportQuery.isLoading ? <InlineLoader message="Loading transport report..." size={22} /> : null}
      {reportQuery.isError ? <ErrorState title="Transport report could not be loaded" description="Backend report endpoint failed to return data." onRetry={() => void reportQuery.refetch()} /> : null}

      {report ? (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' } }}>
            <StatCard title="Total transports" value={formatNumber(report.totalTransports)} subtitle={`${formatNumber(report.activeTransports)} active`} icon={<LocalShippingRoundedIcon fontSize="small" />} accent="primary" />
            <StatCard title="Completed" value={formatNumber(report.completedTransports)} subtitle={`${formatNumber(report.cancelledTransports)} cancelled`} icon={<AssignmentTurnedInRoundedIcon fontSize="small" />} accent="success" />
            <StatCard title="Cancelled" value={formatNumber(report.cancelledTransports)} subtitle="Failed or stopped transport flow" icon={<CancelRoundedIcon fontSize="small" />} accent="error" />
            <StatCard title="Planned weight" value={formatNumber(report.totalPlannedWeight)} subtitle={`${formatNumber(report.completedTransportWeight)} completed`} icon={<ScaleRoundedIcon fontSize="small" />} accent="info" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
            <SectionCard title="Status breakdown"><Stack spacing={1}>{Object.entries(report.transportsByStatus).map(([key, value]) => <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>)}</Stack></SectionCard>
            <SectionCard title="Priority breakdown"><Stack spacing={1}>{Object.entries(report.transportsByPriority).map(([key, value]) => <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>)}</Stack></SectionCard>
          </Box>

          <TableLayout title="Top routes" description="Routes ordered by transport count." table={<ReportDataTable title="top routes" rows={report.routeUsage} columns={routeColumns} getRowId={(row) => `${row.sourceWarehouseId}-${row.destinationWarehouseId}`} minWidth={760} />} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
            <TableLayout title="Vehicle usage" table={<ReportDataTable title="vehicle usage rows" rows={report.vehicleUsage} columns={vehicleColumns} getRowId={(row) => row.vehicleId} minWidth={560} />} />
            <TableLayout title="Driver usage" table={<ReportDataTable title="driver usage rows" rows={report.driverUsage} columns={driverColumns} getRowId={(row) => row.employeeId} minWidth={520} />} />
          </Box>
          <TableLayout title="Transport rows" description="Raw transport rows included in this report." table={<ReportDataTable title="transport rows" rows={report.rows} columns={transportColumns} getRowId={(row) => row.id} minWidth={1510} />} />
        </Stack>
      ) : null}
    </Stack>
  );
}
