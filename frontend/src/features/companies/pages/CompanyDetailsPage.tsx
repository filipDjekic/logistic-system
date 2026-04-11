import { Navigate, useParams } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { useCompany } from '../hooks/useCompany';

export default function CompanyDetailsPage() {
  const params = useParams();
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