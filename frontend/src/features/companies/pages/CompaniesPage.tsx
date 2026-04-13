import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import CompanyFormDialog from '../components/CompanyFormDialog';
import CompaniesTable from '../components/CompaniesTable';
import { useCompanies } from '../hooks/useCompanies';
import { useCreateCompany } from '../hooks/useCreateCompany';
import { useUpdateCompany } from '../hooks/useUpdateCompany';
import type { CompanyResponse } from '../types/company.types';
import type { CompanySchemaValues } from '../validation/companySchema';

type CompanyFiltersState = {
  search: string;
  status: 'ALL' | 'ACTIVE' | 'INACTIVE';
};

export default function CompaniesPage() {
  const [filters, setFilters] = useState<CompanyFiltersState>({
    search: '',
    status: 'ALL',
  });

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedCompany, setSelectedCompany] = useState<CompanyResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const companiesQuery = useCompanies(true);
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (companiesQuery.data ?? []).filter((company) => {
      const matchesStatus =
        filters.status === 'ALL' ||
        (filters.status === 'ACTIVE' && company.active) ||
        (filters.status === 'INACTIVE' && !company.active);

      const matchesSearch =
        search.length === 0 ||
        company.name.toLowerCase().includes(search) ||
        (company.adminFullName ?? '').toLowerCase().includes(search) ||
        (company.adminEmail ?? '').toLowerCase().includes(search) ||
        String(company.id).includes(search) ||
        String(company.adminUserId ?? '').includes(search) ||
        String(company.adminEmployeeId ?? '').includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [companiesQuery.data, filters]);

  const isSaving = createCompanyMutation.isPending || updateCompanyMutation.isPending;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Organization"
        title="Companies"
        description="Create each company together with its bootstrap COMPANY_ADMIN and employee profile."
        actions={
          <Button
            variant="contained"
            onClick={() => {
              setDialogMode('create');
              setSelectedCompany(null);
              setDialogOpen(true);
            }}
          >
            Create company
          </Button>
        }
      />

      <SectionCard
        title="Company list"
        description="A company should never exist without its initial administrative account."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by company name, admin name, admin email, or IDs"
              fullWidth
            />

            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value as CompanyFiltersState['status'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                void companiesQuery.refetch();
              }}
              disabled={companiesQuery.isFetching}
            >
              Refresh
            </Button>
          </Stack>

          <CompaniesTable
            rows={filteredRows}
            loading={companiesQuery.isLoading}
            error={companiesQuery.isError}
            onRetry={() => {
              void companiesQuery.refetch();
            }}
            onEdit={(company) => {
              setDialogMode('edit');
              setSelectedCompany(company);
              setDialogOpen(true);
            }}
          />
        </Stack>
      </SectionCard>

      <CompanyFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={selectedCompany}
        loading={isSaving}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values: CompanySchemaValues) => {
          if (dialogMode === 'create') {
            createCompanyMutation.mutate({
              name: values.name,
              admin: {
                password: values.adminPassword,
                firstName: values.adminFirstName,
                lastName: values.adminLastName,
                employee: {
                  jmbg: values.adminJmbg,
                  phoneNumber: values.adminPhoneNumber,
                  employmentDate: values.adminEmploymentDate,
                },
              },
            });
            return;
          }

          if (!selectedCompany) {
            return;
          }

          updateCompanyMutation.mutate({
            id: selectedCompany.id,
            data: {
              name: values.name,
              active: values.active,
            },
          });
        }}
      />
    </Stack>
  );
}
