import { useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
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

const optionalText = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const companyBasePayload = (values: CompanySchemaValues) => ({
  name: values.name,
  countryId: values.countryId,
  timezoneId: Number(values.timezoneId),
  address: optionalText(values.address),
  cityId: values.cityId ? Number(values.cityId) : null,
  city: optionalText(values.city),
  postalCode: optionalText(values.postalCode),
  phoneNumber: optionalText(values.phoneNumber),
  email: optionalText(values.email),
  taxNumber: optionalText(values.taxNumber),
  registrationNumber: optionalText(values.registrationNumber),
});

export default function CompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
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
        (company.countryName ?? '').toLowerCase().includes(search)  ||
        (company.timezoneName ?? company.timezone ?? '').toLowerCase().includes(search) ||
        (company.timezoneDisplayName ?? '').toLowerCase().includes(search) ||
        (company.adminFullName ?? '').toLowerCase().includes(search) ||
        (company.adminEmail ?? '').toLowerCase().includes(search) ||
        String(company.id).includes(search) ||
        String(company.adminUserId ?? '').includes(search) ||
        String(company.adminEmployeeId ?? '').includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [companiesQuery.data, filters]);

  const isSaving = createCompanyMutation.isPending || updateCompanyMutation.isPending;

  useEffect(() => {
    if (searchParams.get('create') !== '1' || dialogOpen) {
      return;
    }

    setDialogMode('create');
    setSelectedCompany(null);
    setDialogOpen(true);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('create');
    setSearchParams(nextSearchParams, { replace: true });
  }, [dialogOpen, searchParams, setSearchParams]);

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

      <TableLayout
        title="Company list"
        description="A company should never exist without its initial administrative account."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            searchPlaceholder="Search by company name, country, admin, timezone, or IDs"
            onRefresh={() => { void companiesQuery.refetch(); }}
            refreshDisabled={companiesQuery.isFetching}
          />
        }
        filters={
          <FilterPanel minColumnWidth={180}>
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
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </TextField>
          </FilterPanel>
        }
        table={
          <CompaniesTable
            rows={filteredRows}
            loading={companiesQuery.isLoading}
            error={companiesQuery.isError}
            onRetry={() => { void companiesQuery.refetch(); }}
            onEdit={(company: CompanyResponse) => {
              setDialogMode('edit');
              setSelectedCompany(company);
              setDialogOpen(true);
            }}
          />
        }
      />

      <CompanyFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={selectedCompany}
        loading={isSaving}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values: CompanySchemaValues) => {
          if (dialogMode === 'create') {
            createCompanyMutation.mutate({
              ...companyBasePayload(values),
              admin: {
                password: values.adminPassword,
                firstName: values.adminFirstName,
                lastName: values.adminLastName,
                jmbg: values.adminJmbg,
                phoneNumber: values.adminPhoneNumber,
                employmentDate: values.adminEmploymentDate,
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
              ...companyBasePayload(values),
              active: values.active,
            },
          });
        }}
      />
    </Stack>
  );
}
