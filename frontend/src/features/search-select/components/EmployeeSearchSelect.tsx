import { useMemo, useState } from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useEmployees } from '../../employees/hooks/useEmployees';
import type { EmployeePosition, EmployeeResponse } from '../../employees/types/employee.types';
import { SearchSelectPanel, useDebouncedValue } from '../../../shared/search-select';
import type { SearchSelectColumn, SearchSelectFilterOption } from '../../../shared/search-select';

export type EmployeeSearchSelectProps = {
  title?: string;
  value?: number | null;
  onSelect: (employee: EmployeeResponse) => void;
  position?: EmployeePosition;
  active?: boolean;
  disabledEmployeeIds?: number[];
  helperText?: string;
  companyId?: number;
  disabled?: boolean;
  availableFrom?: string;
  availableTo?: string;
};

const employeeColumns: SearchSelectColumn<EmployeeResponse>[] = [
  {
    key: 'employee',
    label: 'Employee',
    render: (employee) => (
      <Stack spacing={0.25}>
        <Typography variant="body2" fontWeight={600}>
          {employee.firstName} {employee.lastName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {employee.email}
        </Typography>
      </Stack>
    ),
  },
  {
    key: 'position',
    label: 'Position',
    render: (employee) => <Chip size="small" label={employee.position} />,
  },
  {
    key: 'status',
    label: 'Status',
    render: (employee) => <Chip size="small" color={employee.active ? 'success' : 'default'} label={employee.active ? 'ACTIVE' : 'INACTIVE'} />,
    width: 130,
  },
  {
    key: 'company',
    label: 'Company',
    render: (employee) => employee.companyName ?? '-',
  },
];

const statusOptions: SearchSelectFilterOption<'ALL' | 'ACTIVE' | 'INACTIVE'>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function EmployeeSearchSelect({
  title = 'Select employee',
  value,
  onSelect,
  position,
  active,
  disabledEmployeeIds = [],
  helperText,
  companyId,
  disabled = false,
  availableFrom,
  availableTo,
}: EmployeeSearchSelectProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(
    active === true ? 'ACTIVE' : active === false ? 'INACTIVE' : 'ALL',
  );
  const debouncedSearch = useDebouncedValue(search);

  const activeFilter = active ?? (status === 'ALL' ? undefined : status === 'ACTIVE');
  const employeesQuery = useEmployees({
    search: debouncedSearch,
    position,
    active: activeFilter,
    availableFrom,
    availableTo,
    size: 10,
    sort: 'lastName,asc',
  }, !disabled);

  const rows = (employeesQuery.data?.content ?? []).filter((employee) => (companyId == null ? true : employee.companyId === companyId));
  const selectedLabel = useMemo(() => {
    const selected = rows.find((employee) => employee.id === value);
    return selected ? `${selected.firstName} ${selected.lastName}` : null;
  }, [rows, value]);

  return (
    <Stack spacing={1}>
      <SearchSelectPanel
        title={title}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email or position..."
        statusValue={active === undefined ? status : undefined}
        statusOptions={active === undefined ? statusOptions : undefined}
        onStatusChange={active === undefined ? setStatus : undefined}
        rows={disabled ? [] : rows}
        columns={employeeColumns}
        getRowKey={(employee) => employee.id}
        selectedId={value}
        selectedLabel={selectedLabel}
        onSelect={onSelect}
        getSelectDisabled={(employee) => disabledEmployeeIds.includes(employee.id)}
        loading={!disabled && employeesQuery.isFetching}
        error={!disabled && employeesQuery.error ? getErrorMessage(employeesQuery.error) : null}
        emptyMessage={disabled ? "Select required context before searching employees." : availableFrom && availableTo ? "No scheduled employees found for the selected time." : "No employees found."}
      />
      {helperText ? (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  );
}
