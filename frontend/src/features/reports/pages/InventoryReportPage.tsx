import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { downloadFile } from '../../../core/utils/downloadFile';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import QueryStateBoundary from '../../../shared/components/QueryStateBoundary';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { EntityLookupField, type LookupOption } from '../../lookup';
import StatCard from '../../../shared/components/StatCard/StatCard';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import { ChartCard, recordToChartData } from '../../../shared/components/Charts';
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
import ReportOperationsPanel, { type ReportExportFormat } from '../components/ReportOperationsPanel';
import { formatDate, formatNumber, toDateTimeEndParam, toDateTimeStartParam } from '../utils/reportFormatters';

const movementTypeOptions = ['ALL', 'INBOUND', 'OUTBOUND', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'WRITE_OFF', 'RETURN_IN', 'RETURN_OUT', 'RESERVATION', 'RESERVATION_RELEASE'] as const;

type InventoryReportSavedState = {
  fromDate: string;
  toDate: string;
  selectedWarehouse: LookupOption | null;
  selectedProduct: LookupOption | null;
  movementType: (typeof movementTypeOptions)[number];
};


export default function InventoryReportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LookupOption | null>(null);
  const [movementType, setMovementType] = useState<(typeof movementTypeOptions)[number]>('ALL');
  const [exportingInventoryReport, setExportingInventoryReport] = useState(false);
  const [exportFormat, setExportFormat] = useState<ReportExportFormat>('CSV');


  const savedState: InventoryReportSavedState = {
    fromDate,
    toDate,
    selectedWarehouse,
    selectedProduct,
    movementType,
  };

  const savedStateSummary = [
    fromDate ? `from ${fromDate}` : null,
    toDate ? `to ${toDate}` : null,
    selectedWarehouse ? `warehouse ${selectedWarehouse.label}` : null,
    selectedProduct ? `product ${selectedProduct.label}` : null,
    movementType !== 'ALL' ? `movement ${movementType}` : null,
  ].filter(Boolean).join(' · ') || 'All inventory records';

  function applySavedState(state: InventoryReportSavedState) {
    setFromDate(state.fromDate);
    setToDate(state.toDate);
    setSelectedWarehouse(state.selectedWarehouse);
    setSelectedProduct(state.selectedProduct);
    setMovementType(state.movementType);
  }

  const reportPresets = [
    { id: 'low-stock', label: 'Low stock review', description: 'Inventory health and low stock rows.', apply: () => { setMovementType('ALL'); } },
    { id: 'reservations', label: 'Reservations', description: 'Reservation and release movements.', apply: () => { setMovementType('RESERVATION'); } },
    { id: 'adjustments', label: 'Adjustments', description: 'Manual stock adjustment movements.', apply: () => { setMovementType('ADJUSTMENT'); } },
  ];

  const filters: InventoryReportFilters = {
    fromDate: toDateTimeStartParam(fromDate),
    toDate: toDateTimeEndParam(toDate),
    warehouseId: selectedWarehouse?.id,
    productId: selectedProduct?.id,
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

  async function handleExportReport() {
    setExportingInventoryReport(true);
    try {
      const data = await reportsApi.exportInventoryReport(filters, exportFormat);
      downloadFile({
        data,
        fileName: `inventory-report.${exportFormat === 'CSV' ? 'csv' : 'xlsx'}`,
        mimeType: exportFormat === 'CSV' ? 'text/csv;charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } finally {
      setExportingInventoryReport(false);
    }
  }

  function resetFilters() {
    setFromDate('');
    setToDate('');
    setSelectedWarehouse(null);
    setSelectedProduct(null);
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
            <EntityLookupField label="Warehouse" entityType="warehouses" value={selectedWarehouse} onChange={setSelectedWarehouse} />
            <EntityLookupField label="Product" entityType="products" value={selectedProduct} onChange={setSelectedProduct} />
            <TextField select size="small" label="Movement type" value={movementType} onChange={(event) => setMovementType(event.target.value as (typeof movementTypeOptions)[number])} sx={{ minWidth: 180 }}>
              {movementTypeOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <Button variant="outlined" onClick={resetFilters}>Reset</Button>
            <Button variant="contained" onClick={() => void handleExportReport()} disabled={exportingInventoryReport}>{exportingInventoryReport ? 'Exporting...' : `Export ${exportFormat}`}</Button>
          </FilterPanel>
        }
        table={null}
      />



      <ReportOperationsPanel<InventoryReportSavedState>
        storageKey="reports.inventory.savedFilters"
        currentState={savedState}
        currentSummary={savedStateSummary}
        presets={reportPresets}
        snapshots={report ? [
          { label: 'Inventory rows', value: formatNumber(report.inventoryRowsTotal), severity: 'info' },
          { label: 'Low stock', value: formatNumber(report.lowStockRowsTotal), severity: report.lowStockRowsTotal > 0 ? 'warning' : 'success' },
          { label: 'Availability', value: `${formatNumber(report.stockAvailabilityRate)}%`, severity: 'success' },
          { label: 'Movements', value: formatNumber(report.stockMovementsTotal), severity: 'default' },
        ] : []}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        onApplySavedFilter={applySavedState}
      />

      <QueryStateBoundary
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        isEmpty={!report}
        loadingMessage="Loading inventory report..."
        errorTitle="Inventory report could not be loaded"
        errorDescription="Backend report endpoint failed to return data."
        emptyTitle="No inventory report data"
        emptyDescription="Adjust filters or retry after backend data is available."
        onRetry={() => void reportQuery.refetch()}
      >
        {report ? (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' } }}>
            <StatCard title="Inventory quantity" value={formatNumber(report.totalInventoryQuantity)} subtitle={`${formatNumber(report.totalAvailableQuantity)} available`} icon={<Inventory2RoundedIcon fontSize="small" />} accent="primary" />
            <StatCard title="Reserved quantity" value={formatNumber(report.totalReservedQuantity)} subtitle={`${formatNumber(report.inventoryRowsTotal)} inventory rows`} icon={<WarehouseRoundedIcon fontSize="small" />} accent="info" />
            <StatCard title="Low stock rows" value={formatNumber(report.lowStockRowsTotal)} subtitle="Rows at or below min stock" icon={<ReportProblemRoundedIcon fontSize="small" />} accent="warning" />
            <StatCard title="Stock movements" value={formatNumber(report.stockMovementsTotal)} subtitle={`${formatNumber(report.transferQuantity)} transferred`} icon={<SwapHorizRoundedIcon fontSize="small" />} accent="success" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' } }}>
            <ChartCard title="Inventory quantity by product" description="Top products by total quantity in the selected report scope." data={report.perProduct.slice(0, 10).map((item) => ({ key: String(item.productId), label: item.productName, value: item.quantity }))} kind="bar" />
            <ChartCard title="Inventory by warehouse" description="Warehouse-level available stock distribution." data={report.perWarehouse.slice(0, 10).map((item) => ({ key: String(item.warehouseId), label: item.warehouseName, value: item.availableQuantity, secondaryValue: item.reservedQuantity }))} kind="bar" />
            <ChartCard title="Low stock distribution" description="Low-stock rows grouped by warehouse." data={report.perWarehouse.filter((item) => item.lowStockRows > 0).slice(0, 10).map((item) => ({ key: String(item.warehouseId), label: item.warehouseName, value: item.lowStockRows }))} kind="donut" />
            <ChartCard title="Stock movements by type" description="Inbound, outbound, transfer, reservation and adjustment movement mix." data={recordToChartData(report.movementsByType)} kind="donut" />
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
      </QueryStateBoundary>
    </Stack>
  );
}
