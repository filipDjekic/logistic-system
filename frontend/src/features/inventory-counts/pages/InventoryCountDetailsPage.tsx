import { useState } from 'react';
import { Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import { queryKeys } from '../../../core/constants/queryKeys';
import { inventoryCountsApi } from '../api/inventoryCountsApi';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import type { InventoryCountLineResponse } from '../types/inventoryCount.types';

function DifferenceCell({ value }: { value: number }) {
  const label = value > 0 ? `+${value}` : `${value}`;
  const color = value === 0 ? 'default' : value > 0 ? 'success' : 'warning';
  return <Chip size="small" color={color} label={label} />;
}

export default function InventoryCountDetailsPage() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const [editingLine, setEditingLine] = useState<InventoryCountLineResponse | null>(null);
  const [countedQuantity, setCountedQuantity] = useState('');
  const [note, setNote] = useState('');

  const query = useQuery({
    queryKey: queryKeys.inventoryCounts.detail(id),
    queryFn: () => inventoryCountsApi.getById(id),
    enabled: Number.isFinite(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCounts.root() });
    queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCounts.detail(id) });
  };

  const actionMutation = useMutation({
    mutationFn: (action: 'start' | 'submitReview' | 'createAdjustments' | 'cancel') => {
      if (action === 'start') return inventoryCountsApi.start(id);
      if (action === 'submitReview') return inventoryCountsApi.submitReview(id);
      if (action === 'createAdjustments') return inventoryCountsApi.createAdjustments(id);
      return inventoryCountsApi.cancel(id);
    },
    onSuccess: () => {
      showSnackbar('Inventory count updated.', 'success');
      invalidate();
    },
  });

  const updateLineMutation = useMutation({
    mutationFn: () => inventoryCountsApi.updateLine(id, editingLine!.id, { countedQuantity: Number(countedQuantity), note }),
    onSuccess: () => {
      showSnackbar('Count line saved.', 'success');
      setEditingLine(null);
      invalidate();
    },
  });

  const session = query.data;
  const canEditLines = session?.status === 'OPEN' || session?.status === 'COUNTING';

  return (
    <Stack spacing={2}>
      <PageHeader
        title={session ? `Inventory count ${session.code}` : 'Inventory count'}
        description={session ? `${session.warehouseName} • ${session.lineCount} lines • ${session.discrepancyLineCount} discrepancies` : undefined}
        actions={session ? (
          <>
            <Button component={RouterLink} to="/inventory-counts" variant="outlined">Back</Button>
            {session.status === 'OPEN' ? <Button variant="outlined" onClick={() => actionMutation.mutate('start')}>Start</Button> : null}
            {(session.status === 'OPEN' || session.status === 'COUNTING') ? <Button variant="contained" onClick={() => actionMutation.mutate('submitReview')}>Submit review</Button> : null}
            {session.status === 'REVIEW' ? <Button variant="contained" onClick={() => actionMutation.mutate('createAdjustments')}>Create adjustments</Button> : null}
            {session.status !== 'ADJUSTMENTS_CREATED' && session.status !== 'CANCELLED' ? <Button color="error" onClick={() => actionMutation.mutate('cancel')}>Cancel</Button> : null}
          </>
        ) : null}
      />
      {session ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Chip label={session.status.replaceAll('_', ' ')} />
            <Typography variant="body2" color="text.secondary">Adjustments are created as Stock Movement adjustment records from REVIEW status.</Typography>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">System</TableCell>
                <TableCell align="right">Counted</TableCell>
                <TableCell align="right">Difference</TableCell>
                <TableCell>Note</TableCell>
                <TableCell align="right">Adjustment</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {session.lines.map((line) => (
                <TableRow key={line.id} hover>
                  <TableCell>{line.productName}<Typography variant="caption" color="text.secondary" display="block">{line.productSku}</Typography></TableCell>
                  <TableCell align="right">{line.systemQuantity}</TableCell>
                  <TableCell align="right">{line.countedQuantity ?? '-'}</TableCell>
                  <TableCell align="right"><DifferenceCell value={line.differenceQuantity ?? 0} /></TableCell>
                  <TableCell>{line.note ?? '-'}</TableCell>
                  <TableCell align="right">{line.adjustmentMovementId ? <Button size="small" component={RouterLink} to={`/stock-movements/${line.adjustmentMovementId}`}>Open</Button> : '-'}</TableCell>
                  <TableCell align="right">
                    {canEditLines ? (
                      <Button size="small" onClick={() => { setEditingLine(line); setCountedQuantity(String(line.countedQuantity ?? line.systemQuantity ?? 0)); setNote(line.note ?? ''); }}>Count</Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : null}

      <Paper variant="outlined" sx={{ p: 2, display: editingLine ? 'block' : 'none' }}>
        <Stack spacing={2}>
          <Typography variant="h6">Count {editingLine?.productName}</Typography>
          <TextField label="Counted quantity" type="number" value={countedQuantity} onChange={(event) => setCountedQuantity(event.target.value)} />
          <TextField label="Note" value={note} onChange={(event) => setNote(event.target.value)} multiline minRows={2} />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={() => setEditingLine(null)}>Cancel</Button>
            <Button variant="contained" disabled={!editingLine || countedQuantity === '' || updateLineMutation.isPending} onClick={() => updateLineMutation.mutate()}>Save</Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
