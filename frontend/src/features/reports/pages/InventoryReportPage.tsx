import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import { Box, Button, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import { reportsApi, type InventoryReportFilters } from '../api/reportsApi';

const movementTypeOptions = ['ALL', 'INBOUND', 'OUTBOUND', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'] as const;

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

export default function InventoryReportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [movementType, setMovementType] = useState<(typeof movementTypeOptions)[number]>('ALL');

  const filters: InventoryReportFilters = {
    fromDate: toDateTimeStartParam(fromDate),
    toDate: toDateTimeEndParam(toDate),
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
    productId: productId ? Number(productId) : undefined,
    movementType,
  };

  const reportQuery = useQuery({
    queryKey: ['reports', 'inventory', filters],
    queryFn: () => reportsApi.getInventoryReport(filters),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const report = reportQuery.data;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Reports"
        title="Inventory Report"
        description="Inventory and stock movement report with warehouse, product and movement breakdowns."
      />

      <SectionCard title="Report filters" description="Filters are applied on backend report data.">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField type="date" size="small" label="From date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField type="date" size="small" label="To date" value={toDate} onChange={(event) => setToDate(event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="Warehouse ID" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} sx={{ minWidth: 150 }} />
          <TextField size="small" label="Product ID" value={productId} onChange={(event) => setProductId(event.target.value)} sx={{ minWidth: 150 }} />
          <TextField select size="small" label="Movement type" value={movementType} onChange={(event) => setMovementType(event.target.value as (typeof movementTypeOptions)[number])} sx={{ minWidth: 180 }}>
            {movementTypeOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            onClick={() => {
              setFromDate('');
              setToDate('');
              setWarehouseId('');
              setProductId('');
              setMovementType('ALL');
            }}
          >
            Reset
          </Button>
        </Stack>
      </SectionCard>

      {reportQuery.isLoading ? <InlineLoader message="Loading inventory report..." size={22} /> : null}

      {reportQuery.isError ? (
        <ErrorState title="Inventory report could not be loaded" description="Backend report endpoint failed to return data." onRetry={() => void reportQuery.refetch()} />
      ) : null}

      {report ? (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' } }}>
            <StatCard title="Inventory quantity" value={formatNumber(report.totalInventoryQuantity)} subtitle={`${formatNumber(report.totalAvailableQuantity)} available`} icon={<Inventory2RoundedIcon fontSize="small" />} accent="primary" />
            <StatCard title="Reserved quantity" value={formatNumber(report.totalReservedQuantity)} subtitle={`${formatNumber(report.inventoryRowsTotal)} inventory rows`} icon={<WarehouseRoundedIcon fontSize="small" />} accent="info" />
            <StatCard title="Low stock rows" value={formatNumber(report.lowStockRowsTotal)} subtitle="Rows at or below min stock" icon={<ReportProblemRoundedIcon fontSize="small" />} accent="warning" />
            <StatCard title="Stock movements" value={formatNumber(report.stockMovementsTotal)} subtitle={`${formatNumber(report.transferQuantity)} transferred`} icon={<SwapHorizRoundedIcon fontSize="small" />} accent="success" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
            <SectionCard title="Movement quantities">
              <Stack spacing={1}>
                <Typography variant="body2">Inbound: {formatNumber(report.inboundQuantity)}</Typography>
                <Typography variant="body2">Outbound: {formatNumber(report.outboundQuantity)}</Typography>
                <Typography variant="body2">Transfer: {formatNumber(report.transferQuantity)}</Typography>
                <Typography variant="body2">Adjustment: {formatNumber(report.adjustmentQuantity)}</Typography>
              </Stack>
            </SectionCard>

            <SectionCard title="Movements by type">
              <Stack spacing={1}>
                {Object.entries(report.movementsByType).map(([key, value]) => (
                  <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>
                ))}
              </Stack>
            </SectionCard>
          </Box>

          <SectionCard title="Per warehouse" description="Inventory totals grouped by warehouse.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell align="right">Rows</TableCell>
                  <TableCell align="right">Low stock</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell align="right">Reserved</TableCell>
                  <TableCell align="right">Movements</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.perWarehouse.map((row) => (
                  <TableRow key={row.warehouseId}>
                    <TableCell>{row.warehouseName}</TableCell>
                    <TableCell>{row.city ?? '-'}</TableCell>
                    <TableCell align="right">{formatNumber(row.inventoryRows)}</TableCell>
                    <TableCell align="right">{formatNumber(row.lowStockRows)}</TableCell>
                    <TableCell align="right">{formatNumber(row.quantity)}</TableCell>
                    <TableCell align="right">{formatNumber(row.availableQuantity)}</TableCell>
                    <TableCell align="right">{formatNumber(row.reservedQuantity)}</TableCell>
                    <TableCell align="right">{formatNumber(row.stockMovements)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          <SectionCard title="Per product" description="Inventory totals grouped by product.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">Rows</TableCell>
                  <TableCell align="right">Low stock</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell align="right">Reserved</TableCell>
                  <TableCell align="right">Movements</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.perProduct.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell>{row.sku ?? '-'}</TableCell>
                    <TableCell>{row.unit ?? '-'}</TableCell>
                    <TableCell align="right">{formatNumber(row.inventoryRows)}</TableCell>
                    <TableCell align="right">{formatNumber(row.lowStockRows)}</TableCell>
                    <TableCell align="right">{formatNumber(row.quantity)}</TableCell>
                    <TableCell align="right">{formatNumber(row.availableQuantity)}</TableCell>
                    <TableCell align="right">{formatNumber(row.reservedQuantity)}</TableCell>
                    <TableCell align="right">{formatNumber(row.stockMovements)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          <SectionCard title="Inventory rows" description="Raw inventory rows included in this report.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell align="right">Reserved</TableCell>
                  <TableCell align="right">Min stock</TableCell>
                  <TableCell>State</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.inventoryRows.map((row) => (
                  <TableRow key={`${row.warehouseId}-${row.productId}`}>
                    <TableCell>{row.warehouseName ?? '-'}</TableCell>
                    <TableCell>{row.productName ?? '-'}</TableCell>
                    <TableCell>{row.sku ?? '-'}</TableCell>
                    <TableCell align="right">{formatNumber(row.quantity)}</TableCell>
                    <TableCell align="right">{formatNumber(row.availableQuantity)}</TableCell>
                    <TableCell align="right">{formatNumber(row.reservedQuantity)}</TableCell>
                    <TableCell align="right">{row.minStockLevel == null ? '-' : formatNumber(row.minStockLevel)}</TableCell>
                    <TableCell>{row.lowStock ? 'LOW_STOCK' : 'SUFFICIENT'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          <SectionCard title="Stock movement rows" description="Raw stock movements included in this report date range.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.movementRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.movementType ?? '-'}</TableCell>
                    <TableCell>{row.warehouseName ?? '-'}</TableCell>
                    <TableCell>{row.productName ?? '-'}{row.sku ? ` · ${row.sku}` : ''}</TableCell>
                    <TableCell>{row.referenceNumber ?? row.referenceId ?? '-'}</TableCell>
                    <TableCell align="right">{formatNumber(row.quantity)}</TableCell>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
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
