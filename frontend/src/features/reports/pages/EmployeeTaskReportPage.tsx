import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import { Box, Button, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCrad';
import { employeeTaskReportsApi, type EmployeeTaskReportFilters } from '../api/reportsApi';

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
  return value ? new Date(value).toLocaleString() : '-';
}

export default function EmployeeTaskReportPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [position, setPosition] = useState<(typeof positionOptions)[number]>('ALL');
  const [taskStatus, setTaskStatus] = useState<(typeof taskStatusOptions)[number]>('ALL');
  const [taskPriority, setTaskPriority] = useState<(typeof taskPriorityOptions)[number]>('ALL');

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

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Reports"
        title="Employee / Task Report"
        description="Employee, task and shift report with assignment, workload and overdue task breakdowns."
      />

      <SectionCard title="Report filters" description="Filters are applied on backend report data.">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap">
          <TextField type="date" size="small" label="From date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField type="date" size="small" label="To date" value={toDate} onChange={(event) => setToDate(event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="Employee ID" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} sx={{ minWidth: 150 }} />
          <TextField select size="small" label="Position" value={position} onChange={(event) => setPosition(event.target.value as (typeof positionOptions)[number])} sx={{ minWidth: 190 }}>
            {positionOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Task status" value={taskStatus} onChange={(event) => setTaskStatus(event.target.value as (typeof taskStatusOptions)[number])} sx={{ minWidth: 170 }}>
            {taskStatusOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Task priority" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as (typeof taskPriorityOptions)[number])} sx={{ minWidth: 170 }}>
            {taskPriorityOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            onClick={() => {
              setFromDate('');
              setToDate('');
              setEmployeeId('');
              setPosition('ALL');
              setTaskStatus('ALL');
              setTaskPriority('ALL');
            }}
          >
            Reset
          </Button>
        </Stack>
      </SectionCard>

      {reportQuery.isLoading ? <InlineLoader message="Loading employee/task report..." size={22} /> : null}

      {reportQuery.isError ? (
        <ErrorState title="Employee/task report could not be loaded" description="Backend report endpoint failed to return data." onRetry={() => void reportQuery.refetch()} />
      ) : null}

      {report ? (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' } }}>
            <StatCard title="Employees" value={formatNumber(report.employeesTotal)} subtitle={`${formatNumber(report.activeEmployees)} active`} icon={<GroupsRoundedIcon fontSize="small" />} accent="primary" />
            <StatCard title="Tasks" value={formatNumber(report.tasksTotal)} subtitle={`${formatNumber(report.openTasks)} open`} icon={<AssignmentRoundedIcon fontSize="small" />} accent="info" />
            <StatCard title="Overdue open tasks" value={formatNumber(report.overdueOpenTasks)} subtitle={`${formatNumber(report.completedTasks)} completed`} icon={<ReportProblemRoundedIcon fontSize="small" />} accent="warning" />
            <StatCard title="Shifts" value={formatNumber(report.shiftsTotal)} subtitle={`${formatNumber(report.employeesWithoutTasks)} employees without tasks`} icon={<EventNoteRoundedIcon fontSize="small" />} accent="success" />
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' } }}>
            <SectionCard title="Employees by position">
              <Stack spacing={1}>
                {Object.entries(report.employeesByPosition).map(([key, value]) => (
                  <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>
                ))}
              </Stack>
            </SectionCard>

            <SectionCard title="Tasks by status">
              <Stack spacing={1}>
                {Object.entries(report.tasksByStatus).map(([key, value]) => (
                  <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>
                ))}
              </Stack>
            </SectionCard>

            <SectionCard title="Tasks by priority">
              <Stack spacing={1}>
                {Object.entries(report.tasksByPriority).map(([key, value]) => (
                  <Typography key={key} variant="body2">{key}: {formatNumber(value)}</Typography>
                ))}
              </Stack>
            </SectionCard>
          </Box>

          <SectionCard title="Tasks by assignee" description="Task workload grouped by employee.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell align="right">Tasks</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  <TableCell align="right">Open</TableCell>
                  <TableCell align="right">Overdue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.tasksByAssignee.map((row) => (
                  <TableRow key={row.employeeId}>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.position ?? '-'}</TableCell>
                    <TableCell align="right">{formatNumber(row.tasksTotal)}</TableCell>
                    <TableCell align="right">{formatNumber(row.completedTasks)}</TableCell>
                    <TableCell align="right">{formatNumber(row.openTasks)}</TableCell>
                    <TableCell align="right">{formatNumber(row.overdueOpenTasks)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          <SectionCard title="Employee rows" description="Employee activity summary for the selected scope.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Tasks</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  <TableCell align="right">Open</TableCell>
                  <TableCell align="right">Shifts</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.employeeRows.map((row) => (
                  <TableRow key={row.employeeId}>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.position ?? '-'}</TableCell>
                    <TableCell>{row.active ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">{formatNumber(row.tasksTotal)}</TableCell>
                    <TableCell align="right">{formatNumber(row.completedTasks)}</TableCell>
                    <TableCell align="right">{formatNumber(row.openTasks)}</TableCell>
                    <TableCell align="right">{formatNumber(row.shiftsTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          <SectionCard title="Task rows" description="Raw task rows included in the report.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Due date</TableCell>
                  <TableCell>Transport</TableCell>
                  <TableCell>Stock movement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.taskRows.map((row) => (
                  <TableRow key={row.taskId}>
                    <TableCell>{row.taskId}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.assignedEmployeeName ?? '-'}</TableCell>
                    <TableCell>{row.status ?? '-'}</TableCell>
                    <TableCell>{row.priority ?? '-'}</TableCell>
                    <TableCell>{formatDate(row.dueDate)}</TableCell>
                    <TableCell>{row.transportOrderId ?? '-'}</TableCell>
                    <TableCell>{row.stockMovementId ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          <SectionCard title="Shift rows" description="Raw shift rows included in the report.">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.shiftRows.map((row) => (
                  <TableRow key={row.shiftId}>
                    <TableCell>{row.shiftId}</TableCell>
                    <TableCell>{row.employeeName ?? '-'}</TableCell>
                    <TableCell>{row.employeePosition ?? '-'}</TableCell>
                    <TableCell>{row.status ?? '-'}</TableCell>
                    <TableCell>{formatDate(row.startTime)}</TableCell>
                    <TableCell>{formatDate(row.endTime)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </Stack>
      ) : null}
    </Stack>
  );
}
