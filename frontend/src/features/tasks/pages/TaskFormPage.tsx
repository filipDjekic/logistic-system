import { useEffect, useMemo, useState } from 'react';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import FormTextField from '../../../shared/components/Form/Form';
import FormDatePicker from '../../../shared/components/Form/FormDatePicker';
import FormSelect from '../../../shared/components/Form/FormSelect';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import FormSection from '../../../shared/components/Form/FormSection';
import FormActions from '../../../shared/components/Form/FormActions';
import FormGlobalError from '../../../shared/components/Form/FormGlobalError';
import { applyServerFieldErrors } from '../../../shared/components/Form/applyServerFieldErrors';
import PageLoader from '../../../shared/components/Loader/PageLoader';
import { EmployeeSearchSelect, LinkedProcessSearchSelect } from '../../search-select';
import type { LinkedProcessSelection } from '../../search-select';
import type { LookupOption } from '../../lookup';
import { useCreateTask } from '../hooks/useCreateTask';
import { useTask } from '../hooks/useTask';
import { useUpdateTask } from '../hooks/useUpdateTask';
import type { TaskFormValues } from '../types/task.types';
import { taskSchema } from '../validation/taskSchema';

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

type Props = {
  mode: 'create' | 'edit';
};

export default function TaskFormPage({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const taskId = mode === 'edit' ? Number(params.id) : null;
  const taskQuery = useTask(taskId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const { control, handleSubmit, reset, setValue, setError, formState } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as never,
    defaultValues,
    mode: 'onChange',
  });

  const assignedEmployeeId = useWatch({ control, name: 'assignedEmployeeId' });
  const transportOrderId = useWatch({ control, name: 'transportOrderId' });
  const stockMovementId = useWatch({ control, name: 'stockMovementId' });
  const dueDate = useWatch({ control, name: 'dueDate' });

  const [selectedEmployee, setSelectedEmployee] = useState<LookupOption | null>(null);
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
      taskType: taskQuery.data.taskType ?? 'ADMIN',
      assignedEmployeeId: taskQuery.data.assignedEmployeeId,
      transportOrderId: taskQuery.data.transportOrderId ?? '',
      stockMovementId: taskQuery.data.stockMovementId ?? '',
    });

    setSelectedEmployee({ id: taskQuery.data.assignedEmployeeId, label: `Employee #${taskQuery.data.assignedEmployeeId}` });

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
    const error = createTask.error ?? updateTask.error;
    if (!error) {
      return;
    }

    applyServerFieldErrors(error, setError);
  }, [createTask.error, setError, updateTask.error]);

  useEffect(() => {
    setValue('assignedEmployeeId', selectedEmployee?.id ?? '', { shouldDirty: true, shouldValidate: true });
  }, [selectedEmployee, setValue]);

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
        actions={
          <Button variant="outlined" onClick={() => navigate('/tasks')} disabled={isSaving}>
            Back to tasks
          </Button>
        }
      />

      <SectionCard title="Task data" description="Define basic task fields, assignment and optional linked process.">
        <Stack spacing={3}>
          <FormSection title="Basic information" description="Define what has to be done and when it is due.">
          <Grid container spacing={2}>
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
              <FormSelect
                name="taskType"
                control={control}
                label="Task type"
                required
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
              <FormDatePicker name="dueDate" control={control} label="Due date" required />
            </Grid>
          </Grid>
          </FormSection>

          <FormSection title="Assignment" description="Select the employee responsible for execution.">
          <EmployeeSearchSelect
            title="Assigned employee"
            value={selectedEmployee?.id ?? null}
            onSelect={(employee) => setSelectedEmployee({ id: employee.id, label: `${employee.firstName} ${employee.lastName}` })}
            active
            disabled={!dueDate || isSaving}
            availableFrom={dueDate || undefined}
            availableTo={dueDate || undefined}
            helperText={dueDate ? 'Only employees with a planned or active shift covering the selected due date are shown.' : 'Select due date first so the system can show scheduled employees.'}
          />
          </FormSection>

          <FormSection title="Linked process" description="Optionally connect the task to a transport order or stock movement.">
          <LinkedProcessSearchSelect value={linkedProcess} onChange={setLinkedProcess} />
          </FormSection>

          <FormGlobalError error={createTask.error ?? updateTask.error} />

          <FormActions
            cancelLabel="Cancel"
            submitLabel={mode === 'create' ? 'Create task' : 'Save changes'}
            submittingLabel={mode === 'create' ? 'Creating task...' : 'Saving changes...'}
            helperText="Assignment and linked process rules must be valid before saving."
            loading={isSaving}
            submitDisabled={!canSubmit}
            onCancel={() => navigate('/tasks')}
            onSubmit={handleSubmit((values) => {
              const payload = {
                title: values.title.trim(),
                description: values.description?.trim() || undefined,
                dueDate: values.dueDate,
                priority: values.priority,
                taskType: values.taskType,
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

              if (!taskId || !taskQuery.data) {
                return;
              }

              updateTask.mutate({ id: taskId, data: { ...payload, expectedVersion: taskQuery.data.version } }, {
                onSuccess: (updated) => navigate(`/tasks/${updated.id}`),
              });
            })}
          />

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
