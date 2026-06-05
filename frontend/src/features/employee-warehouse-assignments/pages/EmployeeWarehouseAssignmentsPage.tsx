import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { EntityLookupField } from '../../lookup';
import type { LookupOption } from '../../lookup';
import {
  useCreateEmployeeWarehouseAssignment,
  useDeleteEmployeeWarehouseAssignment,
  useEmployeeWarehouseAssignmentsByEmployee,
  useEmployeeWarehouseAssignmentsByWarehouse,
  useUpdateEmployeeWarehouseAssignment,
} from '../hooks/useEmployeeWarehouseAssignments';
import type { EmployeeWarehouseAccessType } from '../types/employeeWarehouseAssignment.types';

const accessTypes: EmployeeWarehouseAccessType[] = ['PRIMARY', 'WORKER', 'MANAGER', 'DISPATCH', 'VIEW_ONLY'];

type FormState = {
  employee: LookupOption | null;
  warehouse: LookupOption | null;
  accessType: EmployeeWarehouseAccessType;
  validFrom: string;
  validTo: string;
  notes: string;
};

const initialForm: FormState = {
  employee: null,
  warehouse: null,
  accessType: 'WORKER',
  validFrom: '',
  validTo: '',
  notes: '',
};

export default function EmployeeWarehouseAssignmentsPage() {
  const [mode, setMode] = useState<'employee' | 'warehouse'>('employee');
  const [selectedEmployee, setSelectedEmployee] = useState<LookupOption | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const byEmployeeQuery = useEmployeeWarehouseAssignmentsByEmployee(mode === 'employee' ? selectedEmployee?.id ?? null : null);
  const byWarehouseQuery = useEmployeeWarehouseAssignmentsByWarehouse(mode === 'warehouse' ? selectedWarehouse?.id ?? null : null);
  const createMutation = useCreateEmployeeWarehouseAssignment();
  const updateMutation = useUpdateEmployeeWarehouseAssignment();
  const deleteMutation = useDeleteEmployeeWarehouseAssignment();

  const assignments = mode === 'employee' ? byEmployeeQuery.data ?? [] : byWarehouseQuery.data ?? [];
  const canSubmit = Boolean(form.employee?.id && form.warehouse?.id && form.accessType);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="People / Warehouse scope"
        title="Employee warehouse assignments"
        description="Assign workers, managers and dispatchers to one or more warehouses without loading all employees and warehouses up front."
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Create assignment" description="Lookup-driven access assignment for large employee and warehouse datasets.">
            <Stack spacing={2}>
              <EntityLookupField
                label="Employee"
                entityType="employees"
                value={form.employee}
                onChange={(option) => setForm((current) => ({ ...current, employee: option }))}
                required
                placeholder="Choose employee"
                searchPlaceholder="Search employees by name, email or position..."
                sort="lastName,asc"
              />

              <EntityLookupField
                label="Warehouse"
                entityType="warehouses"
                value={form.warehouse}
                onChange={(option) => setForm((current) => ({ ...current, warehouse: option }))}
                required
                placeholder="Choose warehouse"
                searchPlaceholder="Search warehouses by name, city or company..."
                sort="name,asc"
              />

              <TextField
                select
                label="Access type"
                value={form.accessType}
                onChange={(event) => setForm((current) => ({ ...current, accessType: event.target.value as EmployeeWarehouseAccessType }))}
                fullWidth
              >
                {accessTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </TextField>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Valid from"
                    type="date"
                    value={form.validFrom}
                    onChange={(event) => setForm((current) => ({ ...current, validFrom: event.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Valid to"
                    type="date"
                    value={form.validTo}
                    onChange={(event) => setForm((current) => ({ ...current, validTo: event.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                fullWidth
                multiline
                minRows={3}
              />

              <Button
                variant="contained"
                disabled={!canSubmit || createMutation.isPending}
                onClick={() => {
                  if (!form.employee?.id || !form.warehouse?.id) return;
                  createMutation.mutate({
                    employeeId: form.employee.id,
                    warehouseId: form.warehouse.id,
                    accessType: form.accessType,
                    validFrom: form.validFrom || null,
                    validTo: form.validTo || null,
                    notes: form.notes || null,
                    active: true,
                  }, {
                    onSuccess: () => setForm(initialForm),
                  });
                }}
              >
                Assign warehouse access
              </Button>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Assignments" description="Review access by employee or by warehouse using lookup instead of bulk dropdowns.">
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="View mode"
                  value={mode}
                  onChange={(event) => setMode(event.target.value as 'employee' | 'warehouse')}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="employee">By employee</MenuItem>
                  <MenuItem value="warehouse">By warehouse</MenuItem>
                </TextField>

                {mode === 'employee' ? (
                  <EntityLookupField
                    label="Employee"
                    entityType="employees"
                    value={selectedEmployee}
                    onChange={setSelectedEmployee}
                    placeholder="Choose employee"
                    searchPlaceholder="Search employees..."
                    sort="lastName,asc"
                  />
                ) : (
                  <EntityLookupField
                    label="Warehouse"
                    entityType="warehouses"
                    value={selectedWarehouse}
                    onChange={setSelectedWarehouse}
                    placeholder="Choose warehouse"
                    searchPlaceholder="Search warehouses..."
                    sort="name,asc"
                  />
                )}
              </Stack>

              {(byEmployeeQuery.isError || byWarehouseQuery.isError) ? <Alert severity="error">Unable to load assignments.</Alert> : null}

              <Stack spacing={1.25}>
                {assignments.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">No assignments for selected context.</Typography>
                  </Paper>
                ) : assignments.map((assignment) => (
                  <Paper key={assignment.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" gap={2} alignItems="center">
                        <Stack spacing={0.25}>
                          <Typography variant="body2" fontWeight={700}>{assignment.employeeName} → {assignment.warehouseName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.companyName ?? 'Company'} · {assignment.employeePosition ?? 'Position'} · {assignment.warehouseStatus ?? 'Warehouse status'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" label={assignment.accessType} color={assignment.active ? 'primary' : 'default'} />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => updateMutation.mutate({ id: assignment.id, payload: { active: !assignment.active } })}
                          >
                            {assignment.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteMutation.mutate(assignment.id)}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </Stack>
                      <Divider />
                      <Typography variant="caption" color="text.secondary">
                        Valid: {assignment.validFrom ?? '—'} → {assignment.validTo ?? '—'} · Notes: {assignment.notes ?? '—'}
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Stack>
  );
}
