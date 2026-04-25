import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ScaleRoundedIcon from '@mui/icons-material/ScaleRounded';
import { Box, Button, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import { reportsApi, type TransportReportFilters } from '../api/reportsApi';

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
  return value ? new Date(value).toLocaleString() : '-';
}

export default function TransportReportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState<(typeof statusOptions)[number]>('ALL');
  const [priority, setPriority] = useState<(typeof priorityOptions)[number]>('ALL');

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

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Reports"
        title="Transport Report"
        description="Transport operations report with status totals, route usage, driver usage, and vehicle usage."
      />

      <SectionCard title="Report filters" description="Filters are applied on backend report data.">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            type="date"
            size="small"
            label="From date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            type="date"
            size="small"
            label="To date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value as (typeof statusOptions)[number])} sx={{ minWidth: 180 }}>
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>

          <TextField select size="small" label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as (typeof priorityOptions)[number])} sx={{ minWidth: 180 }}>
            {priorityOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            onClick={() => {
              setFromDate('');
              setToDate('');
              setStatus('ALL');
              setPriority('ALL');
            }}
          >
            Reset
          </Button>
        </Stack>
      </SectionCard>

      {reportQuery.isLoading ? <InlineLoader message="Loading transport report..." size={22} /> : null}

      {reportQuery.isError ? (
        <ErrorState
          title="Transport report could not be loaded"
          description="Backend report endpoint failed to return data."
          onRetry={() => void reportQuery.refetch()}
        />
      ) : null}

      {report ? (
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                xl: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            <StatCard title="Total transports" value={formatNumber(report.totalTransports)} subtitle={`${formatNumber(report.activeTransports)} active`} icon={<LocalShippingRoundedIcon fontSize="small" />} accent="primary" />
            <StatCard title="Completed" value={formatNumber(report.completedTransports)} subtitle={`${formatNumber(report.cancelledTransports)} cancelled`} icon={<AssignmentTurnedInRoundedIcon fontSize="small" />} accent="success" />
            <StatCard title="Cancelled" value={formatNumber(report.cancelledTransports)} subtitle="Failed or stopped transport flow" icon={<CancelRoundedIcon fontSize="small" />} accent="error" />
            <StatCard title="Planned weight" value={formatNumber(report.totalPlannedWeight)} subtitle={`${formatNumber(report.completedTransportWeight)} completed`} icon={<ScaleRoundedIcon fontSize="small" />} accent="info" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
            <SectionCard title="Status breakdown">
              <Stack spacing={1}>
                {Object.entries(report.transportsByStatus).map(([key, value]) => (
                  <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>
                ))}
              </Stack>
            </SectionCard>

            <SectionCard title="Priority breakdown">
              <Stack spacing={1}>
                {Object.entries(report.transportsByPriority).map(([key, value]) => (
                  <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>
                ))}
              </Stack>
            </SectionCard>
          </Box>

          <SectionCard title="Top routes" description="Routes ordered by transport count.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Route</TableCell>
                  <TableCell align="right">Transports</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  <TableCell align="right">Weight</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.routeUsage.map((route) => (
                  <TableRow key={`${route.sourceWarehouseId}-${route.destinationWarehouseId}`}>
                    <TableCell>{route.sourceWarehouseName} → {route.destinationWarehouseName}</TableCell>
                    <TableCell align="right">{formatNumber(route.transportsTotal)}</TableCell>
                    <TableCell align="right">{formatNumber(route.completedTransports)}</TableCell>
                    <TableCell align="right">{formatNumber(route.totalWeight)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
            <SectionCard title="Vehicle usage">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle</TableCell>
                    <TableCell align="right">Transports</TableCell>
                    <TableCell align="right">Completed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.vehicleUsage.map((vehicle) => (
                    <TableRow key={vehicle.vehicleId}>
                      <TableCell>{vehicle.registrationNumber} · {vehicle.vehicleLabel}</TableCell>
                      <TableCell align="right">{formatNumber(vehicle.transportsTotal)}</TableCell>
                      <TableCell align="right">{formatNumber(vehicle.completedTransports)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>

            <SectionCard title="Driver usage">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Driver</TableCell>
                    <TableCell align="right">Transports</TableCell>
                    <TableCell align="right">Completed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.driverUsage.map((driver) => (
                    <TableRow key={driver.employeeId}>
                      <TableCell>{driver.driverName}</TableCell>
                      <TableCell align="right">{formatNumber(driver.transportsTotal)}</TableCell>
                      <TableCell align="right">{formatNumber(driver.completedTransports)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </Box>

          <SectionCard title="Transport rows" description="Raw transport rows included in this report.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell align="right">Weight</TableCell>
                  <TableCell>Departure</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.orderNumber}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.priority}</TableCell>
                    <TableCell>{row.sourceWarehouseName ?? '-'} → {row.destinationWarehouseName ?? '-'}</TableCell>
                    <TableCell>{row.vehicleRegistrationNumber ?? '-'}</TableCell>
                    <TableCell>{row.assignedEmployeeName ?? '-'}</TableCell>
                    <TableCell align="right">{formatNumber(row.totalWeight)}</TableCell>
                    <TableCell>{formatDate(row.departureTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </Stack>
      ) : null}
    </Stack>
  );
}
