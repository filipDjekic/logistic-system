import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import FormActions from '../../../shared/components/Form/FormActions';
import FormGlobalError from '../../../shared/components/Form/FormGlobalError';
import { applyServerFieldErrors } from '../../../shared/components/Form/applyServerFieldErrors';
import FormTextField from '../../../shared/components/Form/Form';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import BusinessRuleWarnings, { type BusinessRuleWarning } from '../../../shared/components/BusinessRuleWarnings';
import { EntityLookupField } from '../../lookup';
import type { EmployeeOption, TransportOrderResponse } from '../../transport-orders/types/transportOrder.types';
import type { StockMovementResponse } from '../../stock-movements/types/stockMovement.types';
import type { TaskFormValues, TaskResponse } from '../types/task.types';
import { taskSchema } from '../validation/taskSchema';

type Props = {
  open: boolean;
  initialData?: TaskResponse | null;
  employees: EmployeeOption[];
  transportOrders: TransportOrderResponse[];
  stockMovements: StockMovementResponse[];
  loading?: boolean;
  serverError?: unknown;
  allowTransportOrderLink?: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
};

const defaultValues: TaskFormValues = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'MEDIUM',
  taskType: 'ADMIN',
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
  serverError = null,
  allowTransportOrderLink = true,
  onClose,
  onSubmit,
}: Props) {
  const { control, formState, handleSubmit, reset, setError } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as never,
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
        taskType: initialData.taskType ?? 'ADMIN',
        assignedEmployeeId: initialData.assignedEmployeeId,
        transportOrderId: initialData.transportOrderId ?? '',
        stockMovementId: initialData.stockMovementId ?? '',
      });
      return;
    }

    reset(defaultValues);
  }, [initialData, open, reset]);

  useEffect(() => {
    if (!open || !serverError) {
      return;
    }

    applyServerFieldErrors(serverError, setError);
  }, [open, serverError, setError]);

  const assignedEmployeeId = useWatch({ control, name: 'assignedEmployeeId' });
  const transportOrderId = useWatch({ control, name: 'transportOrderId' });
  const selectedEmployee = employees.find((employee) => employee.id === Number(assignedEmployeeId));
  const selectedTransportOrder = transportOrders.find((order) => order.id === Number(transportOrderId));
  const stockMovementId = useWatch({ control, name: 'stockMovementId' });
  const selectedStockMovement = stockMovements.find((movement) => movement.id === Number(stockMovementId));
  const taskType = useWatch({ control, name: 'taskType' });

  const businessWarnings: BusinessRuleWarning[] = [];
  const terminalTransportStatuses = ['DELIVERED', 'FAILED', 'CANCELLED'];

  if (selectedTransportOrder && terminalTransportStatuses.includes(selectedTransportOrder.status)) {
    businessWarnings.push({
      key: 'terminal-transport',
      severity: 'error',
      message: `Selected transport order is ${selectedTransportOrder.status}. Do not create new operational tasks for terminal transports.`,
    });
  }

  if (selectedEmployee && taskType === 'DRIVING' && selectedEmployee.position !== 'DRIVER') {
    businessWarnings.push({
      key: 'driving-assignee-role',
      severity: 'warning',
      message: `Driving tasks should normally be assigned to employees with DRIVER position. Selected employee is ${selectedEmployee.position}.`,
    });
  }

  if (selectedEmployee && ['PICKING', 'PACKING', 'LOADING', 'UNLOADING', 'COUNTING', 'STOCK_MOVEMENT'].includes(String(taskType)) && !['WORKER', 'WAREHOUSE_MANAGER'].includes(selectedEmployee.position)) {
    businessWarnings.push({
      key: 'warehouse-assignee-role',
      severity: 'warning',
      message: `Warehouse task is assigned to ${selectedEmployee.position}. Check whether this employee should execute warehouse operations.`,
    });
  }

  if (transportOrderId && stockMovementId) {
    businessWarnings.push({
      key: 'two-process-links',
      severity: 'error',
      message: 'Task can be linked either to a transport order or to a stock movement, not both.',
    });
  }

  const blockingWarning = businessWarnings.some((warning) => warning.severity === 'error');
  const disableSubmit = loading || !formState.isValid || blockingWarning;

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
                name="taskType"
                control={control}
                label="Task type"
                required
                rules={{ required: 'Task type is required' }}
                options={[
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'PICKING', label: 'Picking' },
                  { value: 'PACKING', label: 'Packing' },
                  { value: 'LOADING', label: 'Loading' },
                  { value: 'DRIVING', label: 'Driving' },
                  { value: 'UNLOADING', label: 'Unloading' },
                  { value: 'COUNTING', label: 'Counting' },
                  { value: 'MAINTENANCE', label: 'Maintenance' },
                  { value: 'STOCK_MOVEMENT', label: 'Stock movement' },
                ]}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="assignedEmployeeId"
                control={control}
                rules={{ required: 'Assigned employee is required' }}
                render={({ field, fieldState }) => (
                  <EntityLookupField
                    label="Assigned employee"
                    entityType="employees"
                    required
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : `Employee #${field.value}`,
                      subtitle: selectedEmployee?.position ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? '')}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    searchPlaceholder="Search employees..."
                  />
                )}
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
                <Controller
                  name="transportOrderId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <EntityLookupField
                      label="Transport order"
                      entityType="transport-orders"
                      value={field.value ? {
                        id: Number(field.value),
                        label: selectedTransportOrder?.orderNumber ?? `Transport order #${field.value}`,
                        status: selectedTransportOrder?.status ?? undefined,
                      } : null}
                      onChange={(option) => field.onChange(option?.id ?? '')}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message ?? 'Optional. Leave empty for non-transport tasks.'}
                      searchPlaceholder="Search transport orders..."
                    />
                  )}
                />
              </Grid>
            ) : null}

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="stockMovementId"
                control={control}
                render={({ field, fieldState }) => (
                  <EntityLookupField
                    label="Stock movement"
                    entityType="stock-movements"
                    value={field.value ? {
                      id: Number(field.value),
                      label: selectedStockMovement ? `${selectedStockMovement.movementType} #${selectedStockMovement.id}` : `Stock movement #${field.value}`,
                      subtitle: selectedStockMovement?.productName ?? selectedStockMovement?.warehouseName ?? undefined,
                      status: selectedStockMovement?.reasonCode ?? undefined,
                    } : null}
                    onChange={(option) => field.onChange(option?.id ?? '')}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message ?? 'Optional. Leave empty if this task is not linked to warehouse movement.'}
                    searchPlaceholder="Search stock movements by product, warehouse, reference or ID..."
                    sort="id,desc"
                  />
                )}
              />
            </Grid>
          </Grid>

          <BusinessRuleWarnings warnings={businessWarnings} />
        </Stack>
      </DialogContent>

      <DialogContent sx={{ pt: 2 }}>
        <FormGlobalError error={serverError} />

        <FormActions
          submitLabel={initialData ? 'Save changes' : 'Create task'}
          submittingLabel={initialData ? 'Saving changes...' : 'Creating task...'}
          helperText="Task assignment and related workflow fields must be valid before saving."
          loading={loading}
          submitDisabled={disableSubmit && !loading}
          onCancel={onClose}
          onSubmit={handleSubmit((values) => onSubmit({
            ...values,
            title: values.title.trim(),
            description: values.description?.trim() ?? '',
          }))}
        />
      </DialogContent>
    </Dialog>
  );
}
