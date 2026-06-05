import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';

type WarehouseStorageFlowGuideProps = {
  warehouseId?: number | null;
  zoneId?: number | null;
  binId?: number | null;
  compact?: boolean;
};

function Step({
  label,
  description,
  active,
  to,
}: {
  label: string;
  description: string;
  active?: boolean;
  to?: string;
}) {
  const content = (
    <Box
      sx={{
        border: 1,
        borderColor: active ? 'primary.main' : 'divider',
        borderRadius: 2,
        px: 1.5,
        py: 1.25,
        bgcolor: active ? 'action.selected' : 'background.paper',
        minHeight: 92,
      }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" fontWeight={900}>{label}</Typography>
          {active ? <Chip size="small" color="primary" label="Current" /> : null}
        </Stack>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Stack>
    </Box>
  );

  if (!to) {
    return content;
  }

  return (
    <Box component={RouterLink} to={to} sx={{ color: 'inherit', textDecoration: 'none' }}>
      {content}
    </Box>
  );
}

export default function WarehouseStorageFlowGuide({ warehouseId, zoneId, binId, compact = false }: WarehouseStorageFlowGuideProps) {
  const zonesPath = warehouseId ? `/warehouses/${warehouseId}/zones` : '/warehouse-locations?tab=zones';
  const binsPath = warehouseId && zoneId ? `/warehouses/${warehouseId}/zones/${zoneId}` : '/warehouse-locations?tab=bins';
  const binInventoryPath = warehouseId && zoneId && binId
    ? `/warehouses/${warehouseId}/zones/${zoneId}/bins/${binId}`
    : '/warehouse-locations?tab=bin-inventory';
  const internalMovementsPath = warehouseId
    ? `/warehouse-locations?warehouseId=${warehouseId}&tab=internal-movements`
    : '/warehouse-locations?tab=internal-movements';
  const inventoryPath = warehouseId ? `/inventory?warehouseId=${warehouseId}` : '/inventory';
  const stockMovementsPath = warehouseId ? `/stock-movements?warehouseId=${warehouseId}` : '/stock-movements';

  return (
    <SectionCard
      title="Warehouse storage flow"
      description="Use this as the mental model for warehouse, zone, bin, warehouse inventory, stock movement and internal movement screens."
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', md: compact ? 'column' : 'row' }}
          spacing={1.5}
          divider={compact ? undefined : <Divider flexItem orientation="vertical" />}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ display: 'block', mb: 1 }}>
              Physical layout drill-down
            </Typography>
            <Stack direction={{ xs: 'column', lg: compact ? 'column' : 'row' }} spacing={1.25}>
              <Step label="Zones" description="Logical areas: receiving, storage, picking, packing and dispatch." active={Boolean(warehouseId && !zoneId && !binId)} to={zonesPath} />
              <Step label="Bins" description="Exact physical positions inside one zone." active={Boolean(zoneId && !binId)} to={binsPath} />
              <Step label="Bin inventory" description="Product quantity placed in one bin." active={Boolean(binId)} to={binInventoryPath} />
            </Stack>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ display: 'block', mb: 1 }}>
              Stock state and movement
            </Typography>
            <Stack direction={{ xs: 'column', lg: compact ? 'column' : 'row' }} spacing={1.25}>
              <Step label="Warehouse inventory" description="Total product stock per warehouse." to={inventoryPath} />
              <Step label="Stock movements" description="Inbound, outbound, transfer, adjustment, write-off and return. These change warehouse stock." to={stockMovementsPath} />
              <Step label="Internal movements" description="Bin-to-bin relocation inside the same warehouse. Warehouse total stays unchanged." to={internalMovementsPath} />
            </Stack>
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
          <Button size="small" variant="outlined" component={RouterLink} to={zonesPath}>Open zones</Button>
          <Button size="small" variant="outlined" component={RouterLink} to={inventoryPath}>Open warehouse inventory</Button>
          <Button size="small" variant="outlined" component={RouterLink} to={stockMovementsPath}>Open stock movements</Button>
          <Button size="small" variant="outlined" component={RouterLink} to={internalMovementsPath}>Open internal movements</Button>
        </Stack>
      </Stack>
    </SectionCard>
  );
}
