import { useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Grid, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import { EntityDetailsLayout, RelatedDataSection } from '../../../shared/components/EntityDetails';
import {
  AttachmentsPanel,
  ChangeHistoryPanel,
  CommentsPanel,
  DomainEventsPanel,
} from '../../../shared/components/OperationalPanels';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { useEmployees } from '../../employees/hooks/useEmployees';
import { useVehicles } from '../../vehicles/hooks/useVehicles';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import { useCompany } from '../hooks/useCompany';

type CompanyDetailsTab = 'overview' | 'resources' | 'commentsAttachments' | 'domainEvents' | 'changeHistory';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

export default function CompanyDetailsPage() {
  const auth = useAuthStore();
  const params = useParams();
  const navigate = useNavigate();
  const id = Number(params.id);
  const isValidId = Number.isInteger(id) && id > 0;
  const [activeTab, setActiveTab] = useState<CompanyDetailsTab>('overview');

  const canManage = auth.user?.role === ROLES.OVERLORD || auth.user?.role === ROLES.COMPANY_ADMIN;

  const companyQuery = useCompany(id, isValidId);
  const resourcesTabEnabled = isValidId && activeTab === 'resources';
  const warehousesQuery = useWarehouses({ page: 0, size: 12, sort: 'name,asc' }, resourcesTabEnabled);
  const employeesQuery = useEmployees({ page: 0, size: 12, sort: 'lastName,asc' }, resourcesTabEnabled);
  const vehiclesQuery = useVehicles({ page: 0, size: 12, sort: 'registrationNumber,asc' }, resourcesTabEnabled);

  if (!isValidId) {
    return <Navigate to="/companies" replace />;
  }

  if (companyQuery.isLoading) {
    return (
      <EntityDetailsLayout
        overline="Organization"
        title="Company details"
        description="Loading company details..."
        actions={<Button variant="outlined" onClick={() => navigate('/companies')}>Back to list</Button>}
      >
        <SectionCard>
          <Typography color="text.secondary">Loading company details...</Typography>
        </SectionCard>
      </EntityDetailsLayout>
    );
  }

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <EntityDetailsLayout
        overline="Organization"
        title="Company details"
        description="The requested company could not be loaded."
        actions={<Button variant="outlined" onClick={() => navigate('/companies')}>Back to list</Button>}
      >
        <SectionCard>
          <Typography color="text.secondary">Company details are not available.</Typography>
        </SectionCard>
      </EntityDetailsLayout>
    );
  }

  const company = companyQuery.data;
  const warehouses = (warehousesQuery.data?.content ?? []).filter((warehouse) => warehouse.companyId === company.id || warehouse.companyId == null);
  const employees = (employeesQuery.data?.content ?? []).filter((employee) => employee.companyId === company.id);
  const vehicles = (vehiclesQuery.data?.content ?? []).filter((vehicle) => vehicle.companyId === company.id || vehicle.companyId == null);

  const tabs: { value: CompanyDetailsTab; label: ReactNode }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'resources', label: 'Resources' },
    { value: 'commentsAttachments', label: 'Comments & attachments' },
    { value: 'domainEvents', label: 'Domain events' },
    { value: 'changeHistory', label: 'Change history' },
  ];

  return (
    <EntityDetailsLayout
      overline="Organization"
      title={company.name}
      description={`Company #${company.id} • ${company.countryName ?? company.countryCode ?? 'No country'}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as CompanyDetailsTab)}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={() => navigate(`/change-history?entityName=COMPANY&entityId=${company.id}`)}>
            Full history
          </Button>
          <Button variant="outlined" onClick={() => navigate('/companies')}>
            Back to list
          </Button>
        </Stack>
      }
    >
      {activeTab === 'overview' ? (
        <Stack spacing={3}>
          <SectionCard title="General information" description="Core company identity, location and scoping data.">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="ID" value={company.id} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Name" value={company.name} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <StatusChip value={company.active ? 'ACTIVE' : 'INACTIVE'} />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Country" value={`${company.countryName ?? '—'}${company.countryCode ? ` (${company.countryCode})` : ''}`} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Currency" value={company.effectiveCurrencyCode ?? company.currencyCode ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Timezone" value={company.effectiveTimezone ?? company.timezoneDisplayName ?? company.timezone ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Address" value={company.address ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="City" value={company.cityName ?? company.city ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Postal code" value={company.postalCode ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Phone" value={company.phoneNumber ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Email" value={company.email ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Tax number" value={company.taxNumber ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Registration number" value={company.registrationNumber ?? '—'} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Created at" value={formatDate(company.createdAt)} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><InfoRow label="Updated at" value={formatDate(company.updatedAt)} /></Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Bootstrap company admin">
            <Stack spacing={2}>
              <Alert severity="info">
                This company can be connected with an automatically generated COMPANY_ADMIN account.
              </Alert>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Admin user ID" value={company.adminUserId ?? '—'} /></Grid>
                <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Admin employee ID" value={company.adminEmployeeId ?? '—'} /></Grid>
                <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Admin full name" value={company.adminFullName ?? '—'} /></Grid>
                <Grid size={{ xs: 12, md: 3 }}><InfoRow label="Admin email" value={company.adminEmail ?? '—'} /></Grid>
              </Grid>
            </Stack>
          </SectionCard>
        </Stack>
      ) : null}

      {activeTab === 'resources' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <RelatedDataSection
              title="Warehouses"
              description="Warehouse records connected with this company scope."
              action={<Button variant="outlined" onClick={() => navigate('/warehouses')}>Open warehouses</Button>}
              loading={warehousesQuery.isLoading}
              error={warehousesQuery.isError}
              onRetry={() => { void warehousesQuery.refetch(); }}
              empty={!warehousesQuery.isLoading && !warehousesQuery.isError && warehouses.length === 0}
              emptyTitle="No warehouses"
            >
              <Stack spacing={1.25}>
                {warehouses.map((warehouse) => (
                  <Stack key={warehouse.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={800}>{warehouse.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{warehouse.city} · {warehouse.capacity}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusChip value={warehouse.status} />
                      <Button size="small" onClick={() => navigate(`/warehouses/${warehouse.id}`)}>Open</Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </RelatedDataSection>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <RelatedDataSection
              title="Employees"
              description="Employee records inside this company."
              action={<Button variant="outlined" onClick={() => navigate('/employees')}>Open employees</Button>}
              loading={employeesQuery.isLoading}
              error={employeesQuery.isError}
              onRetry={() => { void employeesQuery.refetch(); }}
              empty={!employeesQuery.isLoading && !employeesQuery.isError && employees.length === 0}
              emptyTitle="No employees"
            >
              <Stack spacing={1.25}>
                {employees.map((employee) => (
                  <Stack key={employee.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={800}>{employee.firstName} {employee.lastName}</Typography>
                    <Typography variant="body2" color="text.secondary">{employee.position} · {employee.email}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusChip value={employee.active ? 'ACTIVE' : 'INACTIVE'} />
                      <Button size="small" onClick={() => navigate(`/employees/${employee.id}`)}>Open</Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </RelatedDataSection>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <RelatedDataSection
              title="Vehicles"
              description="Fleet resources inside this company."
              action={<Button variant="outlined" onClick={() => navigate('/vehicles')}>Open vehicles</Button>}
              loading={vehiclesQuery.isLoading}
              error={vehiclesQuery.isError}
              onRetry={() => { void vehiclesQuery.refetch(); }}
              empty={!vehiclesQuery.isLoading && !vehiclesQuery.isError && vehicles.length === 0}
              emptyTitle="No vehicles"
            >
              <Stack spacing={1.25}>
                {vehicles.map((vehicle) => (
                  <Stack key={vehicle.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={800}>{vehicle.registrationNumber}</Typography>
                    <Typography variant="body2" color="text.secondary">{vehicle.brand} {vehicle.model} · {vehicle.type}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusChip value={vehicle.status} />
                      <Button size="small" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>Open</Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </RelatedDataSection>
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'commentsAttachments' ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <CommentsPanel entityType="COMPANY" entityId={company.id} allowCreate={canManage} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AttachmentsPanel entityType="COMPANY" entityId={company.id} allowCreate={canManage} />
          </Grid>
        </Grid>
      ) : null}

      {activeTab === 'domainEvents' ? <DomainEventsPanel entityType="COMPANY" entityId={company.id} /> : null}

      {activeTab === 'changeHistory' ? <ChangeHistoryPanel entityName="COMPANY" entityId={company.id} /> : null}
    </EntityDetailsLayout>
  );
}
