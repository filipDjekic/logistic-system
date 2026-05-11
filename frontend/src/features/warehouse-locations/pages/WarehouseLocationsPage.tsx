import { Alert, Chip, Grid, Stack, Typography } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';
import { useBinInventory, useBinLocations, useInternalWarehouseMovements, useWarehouseZones } from '../hooks/useWarehouseLocations';
import type { BinInventoryResponse, BinLocationResponse, InternalWarehouseMovementResponse, WarehouseZoneResponse } from '../types/warehouseLocation.types';

export default function WarehouseLocationsPage() {
  const zones = useWarehouseZones({ size: 10 });
  const bins = useBinLocations({ size: 10 });
  const inventory = useBinInventory({ size: 10 });
  const movements = useInternalWarehouseMovements({ size: 10 });

  const zoneColumns: DataTableColumn<WarehouseZoneResponse>[] = [
    { id: 'code', header: 'Code', render: (row) => row.code },
    { id: 'name', header: 'Zone', render: (row) => row.name },
    { id: 'warehouse', header: 'Warehouse', render: (row) => row.warehouseName },
    { id: 'type', header: 'Type', render: (row) => <Chip size="small" label={row.type} /> },
    { id: 'active', header: 'Active', render: (row) => row.active ? 'Yes' : 'No' },
  ];
  const binColumns: DataTableColumn<BinLocationResponse>[] = [
    { id: 'code', header: 'Code', render: (row) => row.code },
    { id: 'name', header: 'Bin', render: (row) => row.name },
    { id: 'zone', header: 'Zone', render: (row) => `${row.zoneCode} / ${row.zoneName}` },
    { id: 'warehouse', header: 'Warehouse', render: (row) => row.warehouseName },
    { id: 'active', header: 'Active', render: (row) => row.active ? 'Yes' : 'No' },
  ];
  const inventoryColumns: DataTableColumn<BinInventoryResponse>[] = [
    { id: 'bin', header: 'Bin', render: (row) => row.binLocationCode },
    { id: 'product', header: 'Product', render: (row) => `${row.productName} (${row.sku})` },
    { id: 'warehouse', header: 'Warehouse', render: (row) => row.warehouseName },
    { id: 'quantity', header: 'Quantity', render: (row) => row.quantity },
  ];
  const movementColumns: DataTableColumn<InternalWarehouseMovementResponse>[] = [
    { id: 'product', header: 'Product', render: (row) => `${row.productName} (${row.sku})` },
    { id: 'route', header: 'Route', render: (row) => `${row.sourceBinCode} → ${row.destinationBinCode}` },
    { id: 'quantity', header: 'Quantity', render: (row) => row.quantity },
    { id: 'status', header: 'Status', render: (row) => <Chip size="small" label={row.status} /> },
  ];

  return (
    <Stack spacing={3}>
      <PageHeader overline="Warehouse operations" title="Zones & bin locations" description="Operational structure for zones, bins, bin inventory and internal warehouse movements." />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}><SectionCard title="Zones"><DataTable columns={zoneColumns} rows={zones.data?.content ?? []} getRowId={(row) => row.id} loading={zones.isLoading} error={zones.isError} onRetry={() => zones.refetch()} /></SectionCard></Grid>
        <Grid item xs={12} md={6}><SectionCard title="Bins"><DataTable columns={binColumns} rows={bins.data?.content ?? []} getRowId={(row) => row.id} loading={bins.isLoading} error={bins.isError} onRetry={() => bins.refetch()} /></SectionCard></Grid>
        <Grid item xs={12} md={6}><SectionCard title="Bin inventory"><DataTable columns={inventoryColumns} rows={inventory.data?.content ?? []} getRowId={(row) => `${row.binLocationId}-${row.productId}`} loading={inventory.isLoading} error={inventory.isError} onRetry={() => inventory.refetch()} /></SectionCard></Grid>
        <Grid item xs={12} md={6}><SectionCard title="Internal movements"><DataTable columns={movementColumns} rows={movements.data?.content ?? []} getRowId={(row) => row.id} loading={movements.isLoading} error={movements.isError} onRetry={() => movements.refetch()} /></SectionCard></Grid>
      </Grid>
      <Alert severity="info"><Typography variant="body2">Use the API endpoints to create zones, bins, set bin inventory and execute internal transfers. This page gives the operational overview.</Typography></Alert>
    </Stack>
  );
}
