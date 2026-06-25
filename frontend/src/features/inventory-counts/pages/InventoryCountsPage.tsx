import { useMemo, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography, Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import { queryKeys } from '../../../core/constants/queryKeys';
import { stockMovementsApi } from '../../stock-movements/api/stockMovementsApi';
import { inventoryCountsApi } from '../api/inventoryCountsApi';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';

export default function InventoryCountsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [description, setDescription] = useState('');

  const warehousesQuery = useQuery({ queryKey: queryKeys.inventory.warehouses(), queryFn: () => stockMovementsApi.getWarehouses(), staleTime: 60_000 });
  const sessionsQuery = useQuery({ queryKey: queryKeys.inventoryCounts.list({}), queryFn: () => inventoryCountsApi.getAll() });
  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);

  const createMutation = useMutation({
    mutationFn: inventoryCountsApi.create,
    onSuccess: (session) => {
      showSnackbar('Inventory count session created.', 'success');
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCounts.root() });
      setDialogOpen(false);
      navigate(`/inventory-counts/${session.id}`);
    },
  });

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Inventory counts"
        description="Open a warehouse count, enter counted quantities, review differences, and create adjustment stock movements."
        actions={<Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setDialogOpen(true)}>New count</Button>}
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
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(sessionsQuery.data ?? []).map((session) => (
              <TableRow key={session.id} hover>
                <TableCell>{session.code}</TableCell>
                <TableCell>{session.warehouseName}</TableCell>
                <TableCell><Chip size="small" label={session.status.replaceAll('_', ' ')} /></TableCell>
                <TableCell align="right">{session.lineCount}</TableCell>
                <TableCell align="right">{session.countedLineCount}</TableCell>
                <TableCell align="right">{session.discrepancyLineCount}</TableCell>
                <TableCell align="right"><Button component={RouterLink} to={`/inventory-counts/${session.id}`} size="small">Open</Button></TableCell>
              </TableRow>
            ))}
            {!sessionsQuery.isLoading && (sessionsQuery.data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={7}><Typography color="text.secondary">No inventory count sessions.</Typography></TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New inventory count</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField select label="Warehouse" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} required>
              {warehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}
            </TextField>
            <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!warehouseId || createMutation.isPending} onClick={() => createMutation.mutate({ warehouseId: Number(warehouseId), description })}>Create</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
