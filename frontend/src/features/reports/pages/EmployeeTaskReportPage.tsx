import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { downloadFile } from '../../../core/utils/downloadFile';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import type { DataTableColumn } from '../../../shared/types/common.types';
import {
  employeeTaskReportsApi,
  type EmployeeTaskReportFilters,
  type EmployeeTaskReportRowResponse,
  type ShiftReportRowResponse,
  type TaskAssigneeSummaryResponse,
  type TaskReportRowResponse,
} from '../api/reportsApi';
import ReportDataTable from '../components/ReportDataTable';

const positionOptions = ['ALL', 'OVERLORD', 'COMPANY_ADMIN', 'HR_MANAGER', 'DISPATCHER', 'DRIVER', 'WAREHOUSE_MANAGER', 'WORKER'] as const;
const taskStatusOptions = ['ALL', 'NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
const taskPriorityOptions = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

function toDateTimeStartParam(value: string) {
  return value ? `${value}T00:00:00` : undefined;
}

function toDateTimeEndParam(value: string) {
  return value ? `${value}T23:59:59` : undefined;
}

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function EmployeeTaskReportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [position, setPosition] = useState<(typeof positionOptions)[number]>('ALL');
  const [taskStatus, setTaskStatus] = useState<(typeof taskStatusOptions)[number]>('ALL');
  const [taskPriority, setTaskPriority] = useState<(typeof taskPriorityOptions)[number]>('ALL');
  const [exportingEmployeeTaskReport, setExportingEmployeeTaskReport] = useState(false);

  const filters: EmployeeTaskReportFilters = {
    fromDate: toDateTimeStartParam(fromDate),
    toDate: toDateTimeEndParam(toDate),
    employeeId: employeeId ? Number(employeeId) : undefined,
    position,
    taskStatus,
    taskPriority,
  };

  const reportQuery = useQuery({
    queryKey: ['reports', 'employee-tasks', filters],
    queryFn: () => employeeTaskReportsApi.getEmployeeTaskReport(filters),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const report = reportQuery.data;

  const assigneeColumns = useMemo<DataTableColumn<TaskAssigneeSummaryResponse>[]>(() => [
    { id: 'employeeName', header: 'Employee', minWidth: 220, render: (row) => row.employeeName },
    { id: 'position', header: 'Position', minWidth: 160, render: (row) => row.position ?? '—' },
    { id: 'tasksTotal', header: 'Tasks', align: 'right', minWidth: 120, render: (row) => formatNumber(row.tasksTotal) },
    { id: 'completedTasks', header: 'Completed', align: 'right', minWidth: 130, render: (row) => formatNumber(row.completedTasks) },
    { id: 'openTasks', header: 'Open', align: 'right', minWidth: 120, render: (row) => formatNumber(row.openTasks) },
    { id: 'overdueOpenTasks', header: 'Overdue', align: 'right', minWidth: 120, render: (row) => formatNumber(row.overdueOpenTasks) },
  ], []);

  const employeeColumns = useMemo<DataTableColumn<EmployeeTaskReportRowResponse>[]>(() => [
    { id: 'employeeName', header: 'Employee', minWidth: 220, render: (row) => row.employeeName },
    { id: 'email', header: 'Email', minWidth: 240, render: (row) => row.email },
    { id: 'position', header: 'Position', minWidth: 160, render: (row) => row.position ?? '—' },
    { id: 'active', header: 'Active', minWidth: 110, render: (row) => (row.active ? 'Yes' : 'No') },
    { id: 'tasksTotal', header: 'Tasks', align: 'right', minWidth: 120, render: (row) => formatNumber(row.tasksTotal) },
    { id: 'completedTasks', header: 'Completed', align: 'right', minWidth: 130, render: (row) => formatNumber(row.completedTasks) },
    { id: 'openTasks', header: 'Open', align: 'right', minWidth: 120, render: (row) => formatNumber(row.openTasks) },
    { id: 'shiftsTotal', header: 'Shifts', align: 'right', minWidth: 120, render: (row) => formatNumber(row.shiftsTotal) },
  ], []);

  const taskColumns = useMemo<DataTableColumn<TaskReportRowResponse>[]>(() => [
    { id: 'taskId', header: 'ID', minWidth: 100, nowrap: true, render: (row) => row.taskId },
    { id: 'title', header: 'Title', minWidth: 260, render: (row) => row.title },
    { id: 'assignedEmployeeName', header: 'Assignee', minWidth: 220, render: (row) => row.assignedEmployeeName ?? '—' },
    { id: 'status', header: 'Status', minWidth: 150, render: (row) => row.status ?? '—' },
    { id: 'priority', header: 'Priority', minWidth: 140, render: (row) => row.priority ?? '—' },
    { id: 'dueDate', header: 'Due date', minWidth: 190, nowrap: true, render: (row) => formatDate(row.dueDate) },
    { id: 'transportOrderId', header: 'Transport', minWidth: 130, render: (row) => row.transportOrderId ?? '—' },
    { id: 'stockMovementId', header: 'Stock movement', minWidth: 160, render: (row) => row.stockMovementId ?? '—' },
  ], []);

  const shiftColumns = useMemo<DataTableColumn<ShiftReportRowResponse>[]>(() => [
    { id: 'shiftId', header: 'ID', minWidth: 100, nowrap: true, render: (row) => row.shiftId },
    { id: 'employeeName', header: 'Employee', minWidth: 220, render: (row) => row.employeeName ?? '—' },
    { id: 'employeePosition', header: 'Position', minWidth: 170, render: (row) => row.employeePosition ?? '—' },
    { id: 'status', header: 'Status', minWidth: 150, render: (row) => row.status ?? '—' },
    { id: 'startTime', header: 'Start', minWidth: 190, nowrap: true, render: (row) => formatDate(row.startTime) },
    { id: 'endTime', header: 'End', minWidth: 190, nowrap: true, render: (row) => formatDate(row.endTime) },
  ], []);

  async function handleExportCsv() {
    setExportingEmployeeTaskReport(true);
    try {
      const data = await employeeTaskReportsApi.exportEmployeeTaskReport(filters);
      downloadFile({ data, fileName: 'employee-task-report.csv', mimeType: 'text/csv;charset=utf-8' });
    } finally {
      setExportingEmployeeTaskReport(false);
    }
  }

  function resetFilters() {
    setFromDate('');
    setToDate('');
    setEmployeeId('');
    setPosition('ALL');
    setTaskStatus('ALL');
    setTaskPriority('ALL');
  }

  return (
    <Stack spacing={3}>
      <PageHeader overline="Reports" title="Employee / Task Report" description="Employee, task and shift report with assignment, workload and overdue task breakdowns." />

      <TableLayout
        title="Report filters"
        description="Filters are applied on backend report data."
        filters={
          <FilterPanel>
            <TextField type="date" size="small" label="From date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" label="To date" value={toDate} onChange={(event) => setToDate(event.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField size="small" label="Employee ID" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} sx={{ minWidth: 150 }} />
            <TextField select size="small" label="Position" value={position} onChange={(event) => setPosition(event.target.value as (typeof positionOptions)[number])} sx={{ minWidth: 190 }}>
              {positionOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Task status" value={taskStatus} onChange={(event) => setTaskStatus(event.target.value as (typeof taskStatusOptions)[number])} sx={{ minWidth: 170 }}>
              {taskStatusOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Task priority" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as (typeof taskPriorityOptions)[number])} sx={{ minWidth: 170 }}>
              {taskPriorityOptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
            <Button variant="outlined" onClick={resetFilters}>Reset</Button>
            <Button variant="contained" onClick={() => void handleExportCsv()} disabled={exportingEmployeeTaskReport}>{exportingEmployeeTaskReport ? 'Exporting...' : 'Export CSV'}</Button>
          </FilterPanel>
        }
        table={null}
      />

      {reportQuery.isLoading ? <InlineLoader message="Loading employee/task report..." size={22} /> : null}
      {reportQuery.isError ? <ErrorState title="Employee/task report could not be loaded" description="Backend report endpoint failed to return data." onRetry={() => void reportQuery.refetch()} /> : null}

      {report ? (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' } }}>
            <StatCard title="Employees" value={formatNumber(report.employeesTotal)} subtitle={`${formatNumber(report.activeEmployees)} active`} icon={<GroupsRoundedIcon fontSize="small" />} accent="primary" />
            <StatCard title="Tasks" value={formatNumber(report.tasksTotal)} subtitle={`${formatNumber(report.taskCompletionRate)}% completed`} icon={<AssignmentRoundedIcon fontSize="small" />} accent="info" />
            <StatCard title="Overdue open tasks" value={formatNumber(report.overdueOpenTasks)} subtitle={`${formatNumber(report.overdueOpenTaskRate)}% of open tasks`} icon={<ReportProblemRoundedIcon fontSize="small" />} accent="warning" />
            <StatCard title="Shift coverage" value={`${formatNumber(report.shiftCoverageRate)}%`} subtitle={`${formatNumber(report.averageTasksPerActiveEmployee)} tasks / active employee`} icon={<EventNoteRoundedIcon fontSize="small" />} accent="success" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' } }}>
            <SectionCard title="Employees by position"><Stack spacing={1}>{Object.entries(report.employeesByPosition).map(([key, value]) => <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>)}</Stack></SectionCard>
            <SectionCard title="Tasks by status"><Stack spacing={1}>{Object.entries(report.tasksByStatus).map(([key, value]) => <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>)}</Stack></SectionCard>
            <SectionCard title="Tasks by priority"><Stack spacing={1}>{Object.entries(report.tasksByPriority).map(([key, value]) => <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>)}</Stack></SectionCard>
          </Box>

          <SectionCard title="Operational workload" description="Derived indicators for completion, overdue pressure and shift coverage.">
            <Stack spacing={1}>
              <Typography variant="body2">Task completion rate: {formatNumber(report.taskCompletionRate)}%</Typography>
              <Typography variant="body2">Overdue open task rate: {formatNumber(report.overdueOpenTaskRate)}%</Typography>
              <Typography variant="body2">Average tasks per active employee: {formatNumber(report.averageTasksPerActiveEmployee)}</Typography>
              <Typography variant="body2">Shift coverage rate: {formatNumber(report.shiftCoverageRate)}%</Typography>
            </Stack>
          </SectionCard>

          <TableLayout title="Tasks by assignee" description="Task workload grouped by employee." table={<ReportDataTable title="tasks by assignee" rows={report.tasksByAssignee} columns={assigneeColumns} getRowId={(row) => row.employeeId} minWidth={880} />} />
          <TableLayout title="Employee rows" description="Employee activity summary for the selected scope." table={<ReportDataTable title="employee rows" rows={report.employeeRows} columns={employeeColumns} getRowId={(row) => row.employeeId} minWidth={1240} />} />
          <TableLayout title="Task rows" description="Raw task rows included in the report." table={<ReportDataTable title="task rows" rows={report.taskRows} columns={taskColumns} getRowId={(row) => row.taskId} minWidth={1390} />} />
          <TableLayout title="Shift rows" description="Raw shift rows included in the report." table={<ReportDataTable title="shift rows" rows={report.shiftRows} columns={shiftColumns} getRowId={(row) => row.shiftId} minWidth={1060} />} />
        </Stack>
      ) : null}
    </Stack>
  );
}
