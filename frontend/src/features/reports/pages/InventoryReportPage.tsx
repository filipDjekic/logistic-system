import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
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
  type InventoryReportFilters,
  type InventoryReportRowResponse,
  type ProductInventorySummaryResponse,
  type StockMovementReportRowResponse,
  type WarehouseInventorySummaryResponse,
} from '../api/reportsApi';
import ReportDataTable from '../components/ReportDataTable';

const movementTypeOptions = ['ALL', 'INBOUND', 'OUTBOUND', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'WRITE_OFF', 'RETURN_IN', 'RETURN_OUT', 'RESERVATION', 'RESERVATION_RELEASE'] as const;

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

export default function InventoryReportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [movementType, setMovementType] = useState<(typeof movementTypeOptions)[number]>('ALL');
  const [exportingInventoryReport, setExportingInventoryReport] = useState(false);

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

  const warehouseColumns = useMemo<DataTableColumn<WarehouseInventorySummaryResponse>[]>(() => [
    { id: 'warehouseName', header: 'Warehouse', minWidth: 220, render: (row) => row.warehouseName },
    { id: 'city', header: 'City', minWidth: 160, render: (row) => row.city ?? '—' },
    { id: 'inventoryRows', header: 'Rows', align: 'right', minWidth: 110, render: (row) => formatNumber(row.inventoryRows) },
    { id: 'lowStockRows', header: 'Low stock', align: 'right', minWidth: 130, render: (row) => formatNumber(row.lowStockRows) },
    { id: 'quantity', header: 'Quantity', align: 'right', minWidth: 130, render: (row) => formatNumber(row.quantity) },
    { id: 'availableQuantity', header: 'Available', align: 'right', minWidth: 130, render: (row) => formatNumber(row.availableQuantity) },
    { id: 'reservedQuantity', header: 'Reserved', align: 'right', minWidth: 130, render: (row) => formatNumber(row.reservedQuantity) },
    { id: 'stockMovements', header: 'Movements', align: 'right', minWidth: 130, render: (row) => formatNumber(row.stockMovements) },
  ], []);

  const productColumns = useMemo<DataTableColumn<ProductInventorySummaryResponse>[]>(() => [
    { id: 'productName', header: 'Product', minWidth: 220, render: (row) => row.productName },
    { id: 'sku', header: 'SKU', minWidth: 150, render: (row) => row.sku ?? '—' },
    { id: 'unit', header: 'Unit', minWidth: 120, render: (row) => row.unit ?? '—' },
    { id: 'inventoryRows', header: 'Rows', align: 'right', minWidth: 110, render: (row) => formatNumber(row.inventoryRows) },
    { id: 'lowStockRows', header: 'Low stock', align: 'right', minWidth: 130, render: (row) => formatNumber(row.lowStockRows) },
    { id: 'quantity', header: 'Quantity', align: 'right', minWidth: 130, render: (row) => formatNumber(row.quantity) },
    { id: 'availableQuantity', header: 'Available', align: 'right', minWidth: 130, render: (row) => formatNumber(row.availableQuantity) },
    { id: 'reservedQuantity', header: 'Reserved', align: 'right', minWidth: 130, render: (row) => formatNumber(row.reservedQuantity) },
    { id: 'stockMovements', header: 'Movements', align: 'right', minWidth: 130, render: (row) => formatNumber(row.stockMovements) },
  ], []);

  const inventoryColumns = useMemo<DataTableColumn<InventoryReportRowResponse>[]>(() => [
    { id: 'warehouseName', header: 'Warehouse', minWidth: 220, render: (row) => row.warehouseName ?? '—' },
    { id: 'productName', header: 'Product', minWidth: 220, render: (row) => row.productName ?? '—' },
    { id: 'sku', header: 'SKU', minWidth: 150, render: (row) => row.sku ?? '—' },
    { id: 'quantity', header: 'Quantity', align: 'right', minWidth: 130, render: (row) => formatNumber(row.quantity) },
    { id: 'availableQuantity', header: 'Available', align: 'right', minWidth: 130, render: (row) => formatNumber(row.availableQuantity) },
    { id: 'reservedQuantity', header: 'Reserved', align: 'right', minWidth: 130, render: (row) => formatNumber(row.reservedQuantity) },
    { id: 'minStockLevel', header: 'Min stock', align: 'right', minWidth: 130, render: (row) => row.minStockLevel == null ? '—' : formatNumber(row.minStockLevel) },
    { id: 'state', header: 'State', minWidth: 150, render: (row) => row.lowStock ? 'LOW_STOCK' : 'SUFFICIENT' },
  ], []);

  const movementColumns = useMemo<DataTableColumn<StockMovementReportRowResponse>[]>(() => [
    { id: 'id', header: 'ID', minWidth: 100, nowrap: true, render: (row) => row.id },
    { id: 'movementType', header: 'Type', minWidth: 160, render: (row) => row.movementType ?? '—' },
    { id: 'warehouseName', header: 'Warehouse', minWidth: 220, render: (row) => row.warehouseName ?? '—' },
    { id: 'productName', header: 'Product', minWidth: 240, render: (row) => `${row.productName ?? '—'}${row.sku ? ` · ${row.sku}` : ''}` },
    { id: 'reference', header: 'Reference', minWidth: 180, render: (row) => row.referenceNumber ?? row.referenceId ?? '—' },
    { id: 'quantity', header: 'Quantity', align: 'right', minWidth: 130, render: (row) => formatNumber(row.quantity) },
    { id: 'createdAt', header: 'Created', minWidth: 190, nowrap: true, render: (row) => formatDate(row.createdAt) },
  ], []);

  async function handleExportCsv() {
    setExportingInventoryReport(true);
    try {
      const data = await reportsApi.exportInventoryReport(filters);
      downloadFile({ data, fileName: 'inventory-report.csv', mimeType: 'text/csv;charset=utf-8' });
    } finally {
      setExportingInventoryReport(false);
    }
  }

  function resetFilters() {
    setFromDate('');
    setToDate('');
    setWarehouseId('');
    setProductId('');
    setMovementType('ALL');
  }

  return (
    <Stack spacing={3}>
      <PageHeader overline="Reports" title="Inventory Report" description="Inventory and stock movement report with warehouse, product and movement breakdowns." />

      <TableLayout
        title="Report filters"
        description="Filters are applied on backend report data."
        filters={
          <FilterPanel>
            <TextField type="date" size="small" label="From date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" label="To date" value={toDate} onChange={(event) => setToDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField size="small" label="Warehouse ID" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} sx={{ minWidth: 150 }} />
            <TextField size="small" label="Product ID" value={productId} onChange={(event) => setProductId(event.target.value)} sx={{ minWidth: 150 }} />
            <TextField select size="small" label="Movement type" value={movementType} onChange={(event) => setMovementType(event.target.value as (typeof movementTypeOptions)[number])} sx={{ minWidth: 180 }}>
              {movementTypeOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <Button variant="outlined" onClick={resetFilters}>Reset</Button>
            <Button variant="contained" onClick={() => void handleExportCsv()} disabled={exportingInventoryReport}>{exportingInventoryReport ? 'Exporting...' : 'Export CSV'}</Button>
          </FilterPanel>
        }
        table={null}
      />

      {reportQuery.isLoading ? <InlineLoader message="Loading inventory report..." size={22} /> : null}
      {reportQuery.isError ? <ErrorState title="Inventory report could not be loaded" description="Backend report endpoint failed to return data." onRetry={() => void reportQuery.refetch()} /> : null}

      {report ? (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' } }}>
            <StatCard title="Inventory quantity" value={formatNumber(report.totalInventoryQuantity)} subtitle={`${formatNumber(report.totalAvailableQuantity)} available`} icon={<Inventory2RoundedIcon fontSize="small" />} accent="primary" />
            <StatCard title="Reserved quantity" value={formatNumber(report.totalReservedQuantity)} subtitle={`${formatNumber(report.inventoryRowsTotal)} inventory rows`} icon={<WarehouseRoundedIcon fontSize="small" />} accent="info" />
            <StatCard title="Low stock rows" value={formatNumber(report.lowStockRowsTotal)} subtitle="Rows at or below min stock" icon={<ReportProblemRoundedIcon fontSize="small" />} accent="warning" />
            <StatCard title="Stock movements" value={formatNumber(report.stockMovementsTotal)} subtitle={`${formatNumber(report.transferQuantity)} transferred`} icon={<SwapHorizRoundedIcon fontSize="small" />} accent="success" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
            <SectionCard title="Movement quantities"><Stack spacing={1}><Typography variant="body2">Inbound: {formatNumber(report.inboundQuantity)}</Typography><Typography variant="body2">Outbound: {formatNumber(report.outboundQuantity)}</Typography><Typography variant="body2">Transfer: {formatNumber(report.transferQuantity)}</Typography><Typography variant="body2">Adjustment: {formatNumber(report.adjustmentQuantity)}</Typography></Stack></SectionCard>
            <SectionCard title="Movements by type"><Stack spacing={1}>{Object.entries(report.movementsByType).map(([key, value]) => <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>)}</Stack></SectionCard>
          </Box>

          <TableLayout title="Per warehouse" description="Inventory totals grouped by warehouse." table={<ReportDataTable title="per warehouse rows" rows={report.perWarehouse} columns={warehouseColumns} getRowId={(row) => row.warehouseId} minWidth={1220} />} />
          <TableLayout title="Per product" description="Inventory totals grouped by product." table={<ReportDataTable title="per product rows" rows={report.perProduct} columns={productColumns} getRowId={(row) => row.productId} minWidth={1300} />} />
          <TableLayout title="Inventory rows" description="Raw inventory rows included in this report." table={<ReportDataTable title="inventory rows" rows={report.inventoryRows} columns={inventoryColumns} getRowId={(row, index) => `${row.warehouseId ?? 'warehouse'}-${row.productId ?? 'product'}-${index}`} minWidth={1240} />} />
          <TableLayout title="Stock movement rows" description="Raw stock movements included in this report date range." table={<ReportDataTable title="stock movement rows" rows={report.movementRows} columns={movementColumns} getRowId={(row) => row.id} minWidth={1220} />} />
        </Stack>
      ) : null}
    </Stack>
  );
}
