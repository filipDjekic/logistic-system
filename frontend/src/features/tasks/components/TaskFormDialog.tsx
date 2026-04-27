import { useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import FormTextField from '../../../shared/components/Form/Form';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import type { EmployeeOption, TransportOrderResponse } from '../../transport-orders/types/transportOrder.types';
import type { StockMovementResponse } from '../../stock-movements/types/stockMovement.types';
import type { TaskFormValues, TaskResponse } from '../types/task.types';

type Props = {
  open: boolean;
  initialData?: TaskResponse | null;
  employees: EmployeeOption[];
  transportOrders: TransportOrderResponse[];
  stockMovements: StockMovementResponse[];
  loading?: boolean;
  allowTransportOrderLink?: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
};

const defaultValues: TaskFormValues = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'MEDIUM',
  assignedEmployeeId: '',
  transportOrderId: '',
  stockMovementId: '',
};

export default function TaskFormDialog({
  open,
  initialData,
  employees,
  transportOrders,
  stockMovements,
  loading = false,
  allowTransportOrderLink = true,
  onClose,
  onSubmit,
}: Props) {
  const { control, formState, handleSubmit, reset } = useForm<TaskFormValues>({
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialData) {
      reset({
        title: initialData.title,
        description: initialData.description ?? '',
        dueDate: initialData.dueDate.slice(0, 16),
        priority: initialData.priority,
        assignedEmployeeId: initialData.assignedEmployeeId,
        transportOrderId: initialData.transportOrderId ?? '',
        stockMovementId: initialData.stockMovementId ?? '',
      });
      return;
    }

    reset(defaultValues);
  }, [initialData, open, reset]);

  const disableSubmit = loading || !formState.isValid;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{initialData ? 'Edit task' : 'Create task'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Define the task, assign the responsible employee and optionally link it to a transport or stock movement.
          </Typography>

          <Typography variant="subtitle2" fontWeight={700}>
            Basic info
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField
                name="title"
                control={control}
                label="Title"
                required
                rules={{ required: 'Title is required' }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="priority"
                control={control}
                label="Priority"
                required
                rules={{ required: 'Priority is required' }}
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextField
                name="description"
                control={control}
                label="Description"
                multiline
                minRows={3}
                helperText="Optional operational instructions."
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Assignment
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormDatePicker
                name="dueDate"
                control={control}
                label="Due date"
                required
                rules={{ required: 'Due date is required' }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="assignedEmployeeId"
                control={control}
                label="Assigned employee"
                required
                rules={{ required: 'Assigned employee is required' }}
                options={employees.map((employee) => ({
                  value: employee.id,
                  label: `${employee.firstName} ${employee.lastName} (${employee.position})`,
                }))}
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle2" fontWeight={700}>
            Linked process
          </Typography>

          <Grid container spacing={2}>
            {allowTransportOrderLink ? (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormSelect
                  name="transportOrderId"
                  control={control}
                  label="Transport order"
                  helperText="Optional. Leave empty for non-transport tasks."
                  options={[
                    { value: '', label: 'No transport order' },
                    ...transportOrders.map((order) => ({
                      value: order.id,
                      label: `${order.orderNumber} (${order.status})`,
                    })),
                  ]}
                />
              </Grid>
            ) : null}

            <Grid size={{ xs: 12, md: 6 }}>
              <FormSelect
                name="stockMovementId"
                control={control}
                label="Stock movement"
                helperText="Optional. Leave empty if this task is not linked to warehouse movement."
                options={[
                  { value: '', label: 'No stock movement' },
                  ...stockMovements.map((movement) => ({
                    value: movement.id,
                    label: `${movement.movementType} #${movement.id}`,
                  })),
                ]}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={disableSubmit}>
          {initialData ? 'Save changes' : 'Create task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
