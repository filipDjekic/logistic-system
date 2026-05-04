import { useEffect, useMemo, useState } from 'react';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import FormTextField from '../../../shared/components/Form/Form';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import PageLoader from '../../../shared/components/Loader/PageLoader';
import { EmployeeSearchSelect, LinkedProcessSearchSelect } from '../../search-select';
import type { LinkedProcessSelection } from '../../search-select';
import { useCreateTask } from '../hooks/useCreateTask';
import { useTask } from '../hooks/useTask';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { TaskFormValues } from '../types/task.types';

const defaultValues: TaskFormValues = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'MEDIUM',
  assignedEmployeeId: '',
  transportOrderId: '',
  stockMovementId: '',
};

type Props = {
  mode: 'create' | 'edit';
};

export default function TaskFormPage({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const auth = useAuthStore();
  const taskId = mode === 'edit' ? Number(params.id) : null;
  const taskQuery = useTask(taskId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isWarehouseManager = auth.user?.role === ROLES.WAREHOUSE_MANAGER;

  const { control, handleSubmit, reset, setValue, formState } = useForm<TaskFormValues>({
    defaultValues,
    mode: 'onChange',
  });

  const assignedEmployeeId = useWatch({ control, name: 'assignedEmployeeId' });
  const transportOrderId = useWatch({ control, name: 'transportOrderId' });
  const stockMovementId = useWatch({ control, name: 'stockMovementId' });

  const [linkedProcess, setLinkedProcess] = useState<LinkedProcessSelection>({
    type: 'UNLINKED',
    id: null,
  });

  useEffect(() => {
    if (mode !== 'edit' || !taskQuery.data) {
      return;
    }

    reset({
      title: taskQuery.data.title,
      description: taskQuery.data.description ?? '',
      dueDate: taskQuery.data.dueDate.slice(0, 16),
      priority: taskQuery.data.priority,
      assignedEmployeeId: taskQuery.data.assignedEmployeeId,
      transportOrderId: taskQuery.data.transportOrderId ?? '',
      stockMovementId: taskQuery.data.stockMovementId ?? '',
    });

    if (taskQuery.data.transportOrderId != null) {
      setLinkedProcess({ type: 'TRANSPORT_ORDER', id: taskQuery.data.transportOrderId });
      return;
    }

    if (taskQuery.data.stockMovementId != null) {
      setLinkedProcess({ type: 'STOCK_MOVEMENT', id: taskQuery.data.stockMovementId });
      return;
    }

    setLinkedProcess({ type: 'UNLINKED', id: null });
  }, [mode, reset, taskQuery.data]);

  useEffect(() => {
    if (linkedProcess.type === 'TRANSPORT_ORDER') {
      setValue('transportOrderId', linkedProcess.id ?? '');
      setValue('stockMovementId', '');
      return;
    }

    if (linkedProcess.type === 'STOCK_MOVEMENT') {
      setValue('stockMovementId', linkedProcess.id ?? '');
      setValue('transportOrderId', '');
      return;
    }

    setValue('transportOrderId', '');
    setValue('stockMovementId', '');
  }, [linkedProcess, setValue]);

  const selectedEmployeeId = assignedEmployeeId === '' ? null : Number(assignedEmployeeId);

  const canSubmit = useMemo(() => {
    if (!formState.isValid || assignedEmployeeId === '') {
      return false;
    }

    if (linkedProcess.type === 'TRANSPORT_ORDER' && transportOrderId === '') {
      return false;
    }

    if (linkedProcess.type === 'STOCK_MOVEMENT' && stockMovementId === '') {
      return false;
    }

    return true;
  }, [assignedEmployeeId, formState.isValid, linkedProcess.type, stockMovementId, transportOrderId]);

  if (mode === 'edit' && taskQuery.isLoading) {
    return <PageLoader message="Loading task..." />;
  }

  const isSaving = createTask.isPending || updateTask.isPending;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Operations"
        title={mode === 'create' ? 'Create task' : 'Edit task'}
        description="Task creation and editing use searchable selectors instead of large dropdowns."
        actions={
          <Button variant="outlined" onClick={() => navigate('/tasks')} disabled={isSaving}>
            Back to tasks
          </Button>
        }
      />

      <SectionCard title="Task data" description="Define basic task fields, assignment and optional linked process.">
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormTextField name="title" control={control} label="Title" required rules={{ required: 'Title is required' }} />
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
              <FormTextField name="description" control={control} label="Description" multiline minRows={3} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormDatePicker name="dueDate" control={control} label="Due date" required rules={{ required: 'Due date is required' }} />
            </Grid>
          </Grid>

          <EmployeeSearchSelect
            title="Assigned employee"
            value={selectedEmployeeId}
            active
            position={isWarehouseManager ? undefined : undefined}
            onSelect={(employee) => setValue('assignedEmployeeId', employee.id, { shouldDirty: true, shouldValidate: true })}
            helperText="Search by employee name, email, status or position, then select the responsible employee."
          />

          <LinkedProcessSearchSelect value={linkedProcess} onChange={setLinkedProcess} />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => navigate('/tasks')} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!canSubmit || isSaving}
              onClick={handleSubmit((values) => {
                const payload = {
                  title: values.title,
                  description: values.description || undefined,
                  dueDate: values.dueDate,
                  priority: values.priority,
                  assignedEmployeeId: Number(values.assignedEmployeeId),
                  transportOrderId: values.transportOrderId === '' ? null : Number(values.transportOrderId),
                  stockMovementId: values.stockMovementId === '' ? null : Number(values.stockMovementId),
                };

                if (mode === 'create') {
                  createTask.mutate(payload, {
                    onSuccess: (created) => navigate(`/tasks/${created.id}`),
                  });
                  return;
                }

                if (!taskId) {
                  return;
                }

                updateTask.mutate({ id: taskId, data: payload }, {
                  onSuccess: (updated) => navigate(`/tasks/${updated.id}`),
                });
              })}
            >
              {mode === 'create' ? 'Create task' : 'Save changes'}
            </Button>
          </Stack>

          {linkedProcess.type === 'STOCK_MOVEMENT' ? (
            <Typography variant="body2" color="text.secondary">
              Stock movement selector is disabled in the shared selector until the stock movement details/search contract exists.
            </Typography>
          ) : null}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
