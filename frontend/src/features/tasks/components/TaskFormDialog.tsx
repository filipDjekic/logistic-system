import { useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
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
  const { control, handleSubmit, reset } = useForm<TaskFormValues>({
    defaultValues,
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initialData ? 'Edit' : 'Create'} Task</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField name="title" control={control} label="Title" required />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormSelect
              name="priority"
              control={control}
              label="Priority"
              required
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormTextField name="description" control={control} label="Description" multiline minRows={3} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormDatePicker name="dueDate" control={control} label="Due date" required />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormSelect
              name="assignedEmployeeId"
              control={control}
              label="Assigned employee"
              required
              options={employees.map((employee) => ({
                value: employee.id,
                label: `${employee.firstName} ${employee.lastName} (${employee.position})`,
              }))}
            />
          </Grid>
{allowTransportOrderLink ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <FormSelect
              name="transportOrderId"
              control={control}
              label="Transport order"
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={loading}>
          {initialData ? 'Save changes' : 'Create task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
