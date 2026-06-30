import { useState } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import { queryKeys } from '../../../core/constants/queryKeys';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { EntityLookupField, type LookupOption } from '../../lookup';
import { warehouseLocationsApi } from '../../warehouse-locations/api/warehouseLocationsApi';
import { inventoryCountsApi } from '../api/inventoryCountsApi';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

export default function InventoryCountsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const auth = useAuthStore();
  const userRole = auth.user?.role ?? null;
  const canCreateInventoryCount = userRole === ROLES.OVERLORD || userRole === ROLES.COMPANY_ADMIN || userRole === ROLES.WAREHOUSE_MANAGER;
  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(null);
  const [description, setDescription] = useState('');

  const sessionsQuery = useQuery({ queryKey: queryKeys.inventoryCounts.list({}), queryFn: () => inventoryCountsApi.getAll() });
  const zonesQuery = useQuery({
    queryKey: ['warehouse-locations', 'zones', { warehouseId: selectedWarehouse?.id }],
    queryFn: () => warehouseLocationsApi.zones({ warehouseId: selectedWarehouse!.id, size: 500 }),
    enabled: Boolean(selectedWarehouse?.id),
    staleTime: 30_000,
  });
  const binsQuery = useQuery({
    queryKey: ['warehouse-locations', 'bins', { warehouseId: selectedWarehouse?.id }],
    queryFn: () => warehouseLocationsApi.bins({ warehouseId: selectedWarehouse!.id, size: 1000 }),
    enabled: Boolean(selectedWarehouse?.id),
    staleTime: 30_000,
  });

  const zoneCount = zonesQuery.data?.totalElements ?? zonesQuery.data?.content?.length ?? 0;
  const binCount = binsQuery.data?.totalElements ?? binsQuery.data?.content?.length ?? 0;

  const createMutation = useMutation({
    mutationFn: inventoryCountsApi.create,
    onSuccess: (session) => {
      showSnackbar({ message: 'Inventory count session created.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCounts.root() });
      setDialogOpen(false);
      setSelectedWarehouse(null);
      setDescription('');
      navigate(`/inventory-counts/${session.id}`);
    },
  });

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Inventory counts"
        description="Open a warehouse count, snapshot bin quantities, enter counted values by location, review differences, approve, and create adjustment stock movements."
        actions={canCreateInventoryCount ? <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setDialogOpen(true)}>New count</Button> : null}
      />
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Lines</TableCell>
              <TableCell align="right">Counted</TableCell>
              <TableCell align="right">Differences</TableCell>
              <TableCell align="right">Progress</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(sessionsQuery.data ?? []).map((session) => {
              const progress = session.lineCount ? Math.round((session.countedLineCount / session.lineCount) * 100) : 0;
              return (
                <TableRow key={session.id} hover>
                  <TableCell>{session.code}</TableCell>
                  <TableCell>{session.warehouseName}</TableCell>
                  <TableCell><Chip size="small" label={statusLabel(session.status)} /></TableCell>
                  <TableCell align="right">{session.lineCount}</TableCell>
                  <TableCell align="right">{session.countedLineCount}</TableCell>
                  <TableCell align="right">{session.discrepancyLineCount}</TableCell>
                  <TableCell align="right">{progress}%</TableCell>
                  <TableCell align="right"><Button component={RouterLink} to={`/inventory-counts/${session.id}`} size="small">Open</Button></TableCell>
                </TableRow>
              );
            })}
            {!sessionsQuery.isLoading && (sessionsQuery.data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={8}><Typography color="text.secondary">No inventory count sessions.</Typography></TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New inventory count</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <EntityLookupField
              label="Warehouse"
              entityType="warehouses"
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
              required
              accessMode="mutate"
              placeholder="Choose a warehouse you can manage"
              dialogTitle="Choose warehouse for inventory count"
              searchPlaceholder="Search managed warehouses..."
              helperText="Only warehouses you are allowed to modify are available for new inventory counts."
            />
            {selectedWarehouse ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Location snapshot scope</Typography>
                  <Typography variant="body2" color="text.secondary">
                    The backend creates one count line for every product/bin inventory row in {selectedWarehouse.label}. Use the details page filters to review by zone and bin after creation.
                  </Typography>
                  <Divider />
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={`${zoneCount} zones`} />
                    <Chip size="small" label={`${binCount} bins`} />
                  </Stack>
                </Stack>
              </Paper>
            ) : null}
            <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!selectedWarehouse || createMutation.isPending} onClick={() => selectedWarehouse && createMutation.mutate({ warehouseId: selectedWarehouse.id, description })}>Create</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
