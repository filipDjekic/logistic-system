import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Stack, Typography } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { useCompany } from '../hooks/useCompany';

export default function CompanyDetailsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const id = Number(params.id);
  const isValidId = Number.isInteger(id) && id > 0;

  const companyQuery = useCompany(id, isValidId);

  if (!isValidId) {
    return <Navigate to="/companies" replace />;
  }

  if (companyQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeader title="Company details" description="Loading company details..." />
      </Stack>
    );
  }

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <Stack spacing={3}>
        <PageHeader
          title="Company details"
          description="The requested company could not be loaded."
        />
      </Stack>
    );
  }

  const company = companyQuery.data;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Organization"
        title={company.name}
        description="Company root record used for future ownership and scoping."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/change-history?entityName=COMPANY&entityId=${company.id}`)}
            >
              View history
            </Button>
            <Button variant="outlined" onClick={() => navigate('/companies')}>
              Back to list
            </Button>
          </Stack>
        }
      />

      <SectionCard title="General information">
        <Stack spacing={1.5}>
          <Typography variant="body2">
            <strong>ID:</strong> {company.id}
          </Typography>
          <Typography variant="body2">
            <strong>Name:</strong> {company.name}
          </Typography>
          <Typography variant="body2">
            <strong>Status:</strong> {company.active ? 'Active' : 'Inactive'}
          </Typography>
          <Typography variant="body2">
            <strong>Country:</strong> {company.countryName ?? '—'} {company.countryCode ? `(${company.countryCode})` : ''}
          </Typography>
          <Typography variant="body2">
            <strong>Currency:</strong> {company.effectiveCurrencyCode ?? company.currencyCode ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Timezone:</strong> {company.effectiveTimezone ?? company.timezone ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Address:</strong> {company.address ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>City:</strong> {company.city ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Phone:</strong> {company.phoneNumber ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {company.email ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Tax number:</strong> {company.taxNumber ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Registration number:</strong> {company.registrationNumber ?? '—'}
          </Typography>
        </Stack>
      </SectionCard>

      <SectionCard title="Bootstrap company admin">
        <Stack spacing={1.5}>
          <Alert severity="info">
            This company was created together with an automatically generated COMPANY_ADMIN account.
          </Alert>
          <Typography variant="body2">
            <strong>Admin user ID:</strong> {company.adminUserId ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Admin employee ID:</strong> {company.adminEmployeeId ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Admin full name:</strong> {company.adminFullName ?? '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Admin email:</strong> {company.adminEmail ?? '—'}
          </Typography>
        </Stack>
      </SectionCard>

      <SectionCard title="Audit information">
        <Stack spacing={1.5}>
          <Typography variant="body2">
            <strong>Created at:</strong> {new Date(company.createdAt).toLocaleString()}
          </Typography>
          <Typography variant="body2">
            <strong>Updated at:</strong>{' '}
            {company.updatedAt ? new Date(company.updatedAt).toLocaleString() : '—'}
          </Typography>
        </Stack>
      </SectionCard>
    </Stack>
  );
}
