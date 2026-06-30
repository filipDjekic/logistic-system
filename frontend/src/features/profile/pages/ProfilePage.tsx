import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import { Link as RouterLink } from 'react-router-dom';
import PageContainer from '../../../app/layout/PageContainer';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import { DetailsField as InfoRow } from '../../../shared/components/EntityDetails';
import { ROLES } from '../../../core/constants/roles';
import { useProfile } from '../hooks/useProfile';
import { useMyProfileChangeRequests } from '../hooks/useMyProfileChangeRequests';
import { useMyShifts } from '../../shifts/hooks/useMyShifts';
import { useMyTasks } from '../../tasks/hooks/useMyTasks';
import { useTransportOrders } from '../../transport-orders/hooks/useTransportOrders';
import ShiftStatusChip from '../../shifts/components/ShiftStatusChip';
import TaskStatusChip from '../../tasks/components/TaskStatusChip';
import TransportOrderStatusChip from '../../transport-orders/components/TransportOrderStatusChip';
import ProfileChangeRequestsTable from '../components/ProfileChangeRequestsTable';
import ProfileChangeRequestForm from '../components/ProfileChangeRequestForm';
import type { ProfileResponse } from '../types/profile.types';

function display(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function fullNameOf(profile: ProfileResponse) {
  return `${profile.employeeFirstName || profile.firstName || ''} ${profile.employeeLastName || profile.lastName || ''}`.trim() || 'My Profile';
}

function initialsOf(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

function SummaryCard({ title, value, description, icon, loading }: { title: string; value: unknown; description?: string; icon: ReactNode; loading?: boolean }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 42, height: 42 }}>{icon}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 850 }}>
              {loading ? '—' : display(value)}
            </Typography>
          </Box>
        </Stack>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
            {description}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}

function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <Stack spacing={1.25}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={42} />
      ))}
    </Stack>
  );
}

export default function ProfilePage() {
  const [tab, setTab] = useState(0);
  const { data: profile, isLoading, error } = useProfile();
  const hasEmployee = Boolean(profile?.employeeId);
  const role = profile?.role;
  const canReviewProfileRequests = role === ROLES.OVERLORD || role === ROLES.COMPANY_ADMIN || role === ROLES.HR_MANAGER;
  const isDriver = profile?.position === 'DRIVER' || role === ROLES.DRIVER;

  const { data: shifts = [], isLoading: shiftsLoading } = useMyShifts(hasEmployee);
  const { data: tasks, isLoading: tasksLoading } = useMyTasks({ page: 0, size: 5, sort: 'dueDate,asc' }, hasEmployee);
  const { data: transports, isLoading: transportsLoading } = useTransportOrders(
    profile?.employeeId ? { assignedEmployeeId: profile.employeeId, page: 0, size: 5, sort: 'departureTime,asc' } : { page: 0, size: 5 },
    Boolean(hasEmployee && isDriver),
  );
  const {
    data: profileChangeRequests,
    isLoading: profileChangeRequestsLoading,
    error: profileChangeRequestsError,
  } = useMyProfileChangeRequests({ page: 0, size: 20, sort: 'createdAt,desc' }, hasEmployee);

  const fullName = useMemo(() => (profile ? fullNameOf(profile) : 'My Profile'), [profile]);
  const initials = useMemo(() => initialsOf(fullName), [fullName]);

  const sortedShifts = useMemo(
    () => [...shifts].sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime()),
    [shifts],
  );

  const currentShift = useMemo(() => {
    const now = Date.now();
    return sortedShifts.find((shift) => shift.status === 'ACTIVE' || (new Date(shift.startTime).getTime() <= now && new Date(shift.endTime).getTime() >= now));
  }, [sortedShifts]);

  const upcomingShift = useMemo(() => {
    const now = Date.now();
    return sortedShifts.find((shift) => shift.status === 'PLANNED' && new Date(shift.startTime).getTime() > now);
  }, [sortedShifts]);

  const activeTasks = useMemo(
    () => (tasks?.content ?? []).filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status)),
    [tasks?.content],
  );

  const pendingRequestsCount = useMemo(
    () => (profileChangeRequests?.content ?? []).filter((request) => request.status === 'PENDING').length,
    [profileChangeRequests?.content],
  );

  if (isLoading) {
    return (
      <PageContainer>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 850 }}>My Profile</Typography>
            <Typography variant="body2" color="text.secondary">Personal account and work profile.</Typography>
          </Box>
          <Skeleton variant="rounded" height={190} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}><Skeleton variant="rounded" height={120} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Skeleton variant="rounded" height={120} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Skeleton variant="rounded" height={120} /></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Skeleton variant="rounded" height={120} /></Grid>
          </Grid>
          <Skeleton variant="rounded" height={360} />
        </Stack>
      </PageContainer>
    );
  }

  if (error || !profile) {
    return (
      <PageContainer>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 850 }}>My Profile</Typography>
            <Typography variant="body2" color="text.secondary">Personal account and work profile.</Typography>
          </Box>
          <Alert severity="error">Profile could not be loaded.</Alert>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Stack spacing={2.5}>
        <Card
          sx={(theme) => ({
            overflow: 'hidden',
            border: 1,
            borderColor: 'divider',
            background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.action.hover})`,
          })}
        >
          <Box sx={{ height: 6, bgcolor: profile.active === false ? 'warning.main' : 'primary.main' }} />
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Avatar sx={{ width: 86, height: 86, fontSize: 28, fontWeight: 900 }}>{initials}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                  Personal workspace
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900 }} noWrap>
                  {fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {display(profile.employeeEmail || profile.email)}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                  <Chip icon={<WorkRoundedIcon />} label={display(profile.position)} size="small" />
                </Stack>
              </Box>
              <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} flexWrap="wrap" useFlexGap sx={{ width: { xs: '100%', md: 'auto' } }}>
                <Button component={RouterLink} to="/notifications" variant="outlined" startIcon={<PendingActionsRoundedIcon />}>
                  Notifications
                </Button>
                {canReviewProfileRequests ? (
                  <Button component={RouterLink} to="/employee-profile-change-requests" variant="contained" startIcon={<ManageAccountsRoundedIcon />}>
                    Review requests
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {!hasEmployee ? (
          <Alert severity="warning">
            Your user account is not linked to an employee record. Work data and profile change requests are unavailable until HR/Admin links the account.
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard
              title="Current shift"
              value={currentShift ? currentShift.status : 'None'}
              description={currentShift ? `${formatDateTime(currentShift.startTime)} • ${display(currentShift.warehouseName)}` : 'No active shift right now.'}
              icon={<ScheduleRoundedIcon />}
              loading={shiftsLoading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard
              title="Upcoming shift"
              value={upcomingShift ? formatDateTime(upcomingShift.startTime) : 'None'}
              description={upcomingShift ? display(upcomingShift.warehouseName) : 'No planned shift in the loaded schedule.'}
              icon={<CalendarMonthRoundedIcon />}
              loading={shiftsLoading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard
              title="Active tasks"
              value={activeTasks.length}
              description="Open work items from your task queue."
              icon={<AssignmentTurnedInRoundedIcon />}
              loading={tasksLoading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard
              title={isDriver ? 'Assigned transports' : 'Pending requests'}
              value={isDriver ? transports?.totalElements ?? 0 : pendingRequestsCount}
              description={isDriver ? 'Transport orders currently assigned to you.' : 'Profile changes waiting for review.'}
              icon={isDriver ? <LocalShippingRoundedIcon /> : <PendingActionsRoundedIcon />}
              loading={isDriver ? transportsLoading : profileChangeRequestsLoading}
            />
          </Grid>
        </Grid>

        <Card>
          <Tabs
            value={tab}
            onChange={(_, nextTab) => setTab(nextTab)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Overview" />
            <Tab label="Work" />
            <Tab label={`Change requests${pendingRequestsCount ? ` (${pendingRequestsCount})` : ''}`} />
          </Tabs>

          {tab === 0 ? (
            <CardContent>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, lg: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <SectionHeader title="Account" description="Login and authorization context." />
                      <Divider sx={{ my: 1.5 }} />
                      <InfoRow label="User email" value={profile.email} icon={<EmailRoundedIcon fontSize="small" />} />
                      <InfoRow label="Role" value={profile.role} icon={<BadgeRoundedIcon fontSize="small" />} />
                      <InfoRow label="User status" value={profile.userStatus} icon={<AccountCircleRoundedIcon fontSize="small" />} />
                      <InfoRow label="Enabled" value={profile.enabled ? 'Yes' : 'No'} />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <SectionHeader title="Contact" description="Editable only through approved profile change requests." />
                      <Divider sx={{ my: 1.5 }} />
                      <InfoRow label="Employee email" value={profile.employeeEmail} icon={<EmailRoundedIcon fontSize="small" />} />
                      <InfoRow label="Phone" value={`${profile.phoneCode ?? ''} ${profile.phoneNumber ?? ''}`.trim()} icon={<PhoneRoundedIcon fontSize="small" />} />
                      <InfoRow label="Address" value={profile.address} icon={<HomeRoundedIcon fontSize="small" />} />
                      <InfoRow label="City" value={profile.cityName} />
                      <InfoRow label="Postal code" value={profile.postalCode} />
                      <InfoRow label="Country" value={profile.countryName || profile.countryCode} />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <SectionHeader title="Employment" description="Read-only HR and operational assignment data." />
                      <Divider sx={{ my: 1.5 }} />
                      <InfoRow label="Employee ID" value={profile.employeeId} icon={<BadgeRoundedIcon fontSize="small" />} />
                      <InfoRow label="Masked JMBG" value={profile.maskedJmbg} />
                      <InfoRow label="Position" value={profile.position} icon={<WorkRoundedIcon fontSize="small" />} />
                      <InfoRow label="Employment date" value={formatDate(profile.employmentDate)} />
                      <InfoRow label="Company" value={profile.companyName} icon={<BusinessRoundedIcon fontSize="small" />} />
                      <InfoRow label="Primary warehouse" value={profile.primaryWarehouseName} />
                      <InfoRow label="Timezone" value={profile.timezoneDisplayName || profile.timezoneName} />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          ) : null}

          {tab === 1 ? (
            <CardContent>
              <Stack spacing={2.5}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <SectionHeader title="Current shift" description="Shift that is active at this moment." />
                        <Divider sx={{ my: 1.5 }} />
                        {shiftsLoading ? <LoadingBlock rows={2} /> : currentShift ? (
                          <Stack spacing={1.25}>
                            <ShiftStatusChip value={currentShift.status} />
                            <InfoRow label="Start" value={formatDateTime(currentShift.startTime)} />
                            <InfoRow label="End" value={formatDateTime(currentShift.endTime)} />
                            <InfoRow label="Warehouse" value={currentShift.warehouseName} />
                          </Stack>
                        ) : (
                          <EmptyState title="No active shift" description="You do not have an active shift in the loaded schedule." icon={<ScheduleRoundedIcon />} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <SectionHeader title="Upcoming shift" description="Next planned shift from your schedule." />
                        <Divider sx={{ my: 1.5 }} />
                        {shiftsLoading ? <LoadingBlock rows={2} /> : upcomingShift ? (
                          <Stack spacing={1.25}>
                            <ShiftStatusChip value={upcomingShift.status} />
                            <InfoRow label="Start" value={formatDateTime(upcomingShift.startTime)} />
                            <InfoRow label="End" value={formatDateTime(upcomingShift.endTime)} />
                            <InfoRow label="Warehouse" value={upcomingShift.warehouseName} />
                          </Stack>
                        ) : (
                          <EmptyState title="No upcoming shift" description="There is no planned shift in the loaded schedule." icon={<CalendarMonthRoundedIcon />} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Card variant="outlined">
                  <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1.5 }}>
                      <SectionHeader title="Active tasks" description="Latest open tasks assigned to you." />
                      <Button component={RouterLink} to="/tasks" variant="outlined" size="small">Open tasks</Button>
                    </Stack>
                    {tasksLoading ? <LinearProgress /> : null}
                    {!tasksLoading && activeTasks.length === 0 ? (
                      <EmptyState title="No active tasks" description="There are no open assigned tasks in your current task queue." icon={<AssignmentTurnedInRoundedIcon />} />
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Title</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Priority</TableCell>
                              <TableCell>Due date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {activeTasks.map((task) => (
                              <TableRow key={task.id} hover>
                                <TableCell>
                                  <Button component={RouterLink} to={`/tasks/${task.id}`} size="small" sx={{ px: 0, minWidth: 0, fontWeight: 750 }}>
                                    {task.title}
                                  </Button>
                                </TableCell>
                                <TableCell><TaskStatusChip status={task.status} /></TableCell>
                                <TableCell>{task.priority}</TableCell>
                                <TableCell>{formatDateTime(task.dueDate)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>

                {isDriver ? (
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1.5 }}>
                        <SectionHeader title="Active transports" description="Transport orders assigned to you as driver/operator." />
                        <Button component={RouterLink} to="/transport-orders" variant="outlined" size="small">Open transports</Button>
                      </Stack>
                      {transportsLoading ? <LinearProgress /> : null}
                      {!transportsLoading && (transports?.content?.length ?? 0) === 0 ? (
                        <EmptyState title="No assigned transports" description="There are no transport orders assigned to your profile." icon={<LocalShippingRoundedIcon />} />
                      ) : (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Order</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Priority</TableCell>
                                <TableCell>Departure</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(transports?.content ?? []).map((transport) => (
                                <TableRow key={transport.id} hover>
                                  <TableCell>
                                    <Button component={RouterLink} to={`/transport-orders/${transport.id}`} size="small" sx={{ px: 0, minWidth: 0, fontWeight: 750 }}>
                                      {transport.orderNumber}
                                    </Button>
                                  </TableCell>
                                  <TableCell><TransportOrderStatusChip status={transport.status} /></TableCell>
                                  <TableCell>{transport.priority}</TableCell>
                                  <TableCell>{formatDateTime(transport.departureTime)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>
                ) : null}
              </Stack>
            </CardContent>
          ) : null}

          {tab === 2 ? (
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <SectionHeader title="My profile change requests" description="Submit and track corrections for contact and location data." />
                  {canReviewProfileRequests ? (
                    <Button component={RouterLink} to="/employee-profile-change-requests" variant="outlined" size="small">
                      Review all requests
                    </Button>
                  ) : null}
                </Stack>
                {!hasEmployee ? (
                  <Alert severity="warning">
                    Your user account is not linked to an employee record, so profile change requests are unavailable.
                  </Alert>
                ) : (
                  <>
                    <ProfileChangeRequestForm profile={profile} />
                    <ProfileChangeRequestsTable
                      requests={profileChangeRequests?.content ?? []}
                      isLoading={profileChangeRequestsLoading}
                      error={profileChangeRequestsError}
                    />
                  </>
                )}
              </Stack>
            </CardContent>
          ) : null}
        </Card>
      </Stack>
    </PageContainer>
  );
}
