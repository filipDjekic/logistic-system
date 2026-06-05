import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import { Alert, Box, Button, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import { downloadFile } from '../../../core/utils/downloadFile';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES, type Role } from '../../../core/constants/roles';
import { normalizeApiError } from '../../../core/api/apiError';
import {
  dataExchangeApi,
  importTemplates,
  type ExportType,
  type ImportResultResponse,
  type ImportType,
} from '../api/dataExchangeApi';

const importTypeOptions: Array<{ value: ImportType; label: string; description: string }> = [
  {
    value: 'products',
    label: 'Products',
    description: 'CSV columns: name, description, sku, unit, price, fragile, weight, companyId',
  },
  {
    value: 'vehicles',
    label: 'Vehicles',
    description: 'CSV columns: registrationNumber, brand, model, type, capacity, maxWeight, maxVolume, maxItems, fuelType, yearOfProduction, status, companyId',
  },
  {
    value: 'warehouses',
    label: 'Warehouses',
    description: 'CSV columns: name, address, city, postalCode, countryId, timezoneId, latitude, longitude, capacity, status, employeeId, companyId',
  },
  {
    value: 'warehouse-inventory',
    label: 'Warehouse inventory',
    description: 'CSV columns: warehouseId, productId, quantity, minStockLevel',
  },
  {
    value: 'employees',
    label: 'Employees',
    description: 'CSV columns: firstName, lastName, jmbg, phoneNumber, email, address, city, postalCode, countryId, timezoneId, primaryWarehouseId, position, employmentDate, salary, userId, companyId',
  },
];

const exportTypeOptions: Array<{ value: ExportType; label: string; description: string }> = [
  {
    value: 'transport-report',
    label: 'Transport report CSV',
    description: 'Exports current transport report rows.',
  },
  {
    value: 'inventory-report',
    label: 'Inventory report CSV',
    description: 'Exports inventory rows and stock movement rows.',
  },
  {
    value: 'employee-task-report',
    label: 'Employee / task report CSV',
    description: 'Exports employee rows and task rows.',
  },
];

function getAllowedImportTypes(role: Role | null | undefined): ImportType[] {
  switch (role) {
    case ROLES.OVERLORD:
    case ROLES.COMPANY_ADMIN:
      return ['products', 'vehicles', 'warehouses', 'warehouse-inventory', 'employees'];
    case ROLES.HR_MANAGER:
      return ['employees'];
    case ROLES.WAREHOUSE_MANAGER:
      return ['products', 'warehouses', 'warehouse-inventory'];
    default:
      return [];
  }
}

function getAllowedExportTypes(role: Role | null | undefined): ExportType[] {
  switch (role) {
    case ROLES.OVERLORD:
    case ROLES.COMPANY_ADMIN:
      return ['transport-report', 'inventory-report', 'employee-task-report'];
    case ROLES.HR_MANAGER:
      return ['employee-task-report'];
    case ROLES.WAREHOUSE_MANAGER:
      return ['transport-report', 'inventory-report'];
    case ROLES.DISPATCHER:
      return ['transport-report'];
    default:
      return [];
  }
}

const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function validateCsvFile(file: File | null) {
  if (!file) return 'CSV file is required.';
  if (!file.name.toLowerCase().endsWith('.csv')) return 'Only .csv files are supported.';
  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) return 'CSV file size must be 5 MB or less.';
  return null;
}

function formatFileSize(value: number) {
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function fileNameForExport(type: ExportType) {
  return `${type}.csv`;
}

function fileNameForTemplate(type: ImportType) {
  return `${type}-import-template.csv`;
}

export default function DataExchangePage() {
  const auth = useAuthStore();
  const role = auth.user?.role;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [importType, setImportType] = useState<ImportType>('products');
  const [exportType, setExportType] = useState<ExportType>('transport-report');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileError, setSelectedFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResultResponse | null>(null);

  const capabilitiesQuery = useQuery({
    queryKey: ['data-exchange-capabilities'],
    queryFn: dataExchangeApi.getCapabilities,
    staleTime: 5 * 60 * 1000,
  });

  const allowedImportTypes = useMemo(
    () => capabilitiesQuery.data?.importTypes ?? getAllowedImportTypes(role),
    [capabilitiesQuery.data?.importTypes, role],
  );
  const allowedExportTypes = useMemo(
    () => capabilitiesQuery.data?.exportTypes ?? getAllowedExportTypes(role),
    [capabilitiesQuery.data?.exportTypes, role],
  );
  const visibleImportTypeOptions = useMemo(
    () => importTypeOptions.filter((option) => allowedImportTypes.includes(option.value)),
    [allowedImportTypes],
  );
  const visibleExportTypeOptions = useMemo(
    () => exportTypeOptions.filter((option) => allowedExportTypes.includes(option.value)),
    [allowedExportTypes],
  );
  const canImport = visibleImportTypeOptions.length > 0;
  const canExport = visibleExportTypeOptions.length > 0;

  useEffect(() => {
    if (visibleImportTypeOptions.length > 0 && !allowedImportTypes.includes(importType)) {
      setImportType(visibleImportTypeOptions[0].value);
      setSelectedFile(null);
      setSelectedFileError(null);
      setImportResult(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [allowedImportTypes, importType, visibleImportTypeOptions]);

  useEffect(() => {
    if (visibleExportTypeOptions.length > 0 && !allowedExportTypes.includes(exportType)) {
      setExportType(visibleExportTypeOptions[0].value);
    }
  }, [allowedExportTypes, exportType, visibleExportTypeOptions]);

  const importMutation = useMutation({
    mutationFn: () => {
      const validationError = validateCsvFile(selectedFile);
      if (validationError) {
        throw new Error(validationError);
      }

      if (!allowedImportTypes.includes(importType)) {
        throw new Error('Current role is not allowed to import this CSV type.');
      }

      return dataExchangeApi.importCsv(importType, selectedFile as File);
    },
    onSuccess: (result) => {
      setImportResult(result);
      setSelectedFile(null);
      setSelectedFileError(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => {
      if (!allowedExportTypes.includes(exportType)) {
        throw new Error('Current role is not allowed to export this CSV type.');
      }

      return dataExchangeApi.exportCsv(exportType);
    },
    onSuccess: (blob) => {
      downloadFile({
        data: blob,
        fileName: fileNameForExport(exportType),
        mimeType: 'text/csv;charset=utf-8',
      });
    },
  });

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Data exchange"
        title="Import / Export"
        description="Import CSV is all-or-nothing: one invalid row blocks the whole file and returns row-level errors. Export generates report CSV files."
      />

      <SectionCard
        title="Role-based data exchange"
        description="This page now reads backend capabilities first, then shows only import/export workflows that your current role is allowed to execute."
      >
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Imports are operational writes and must follow the same company scope, validation and lifecycle rules as manual entry.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Exports are read/report workflows. Use them from reports or dashboard widgets when the goal is analysis, not data creation.
          </Typography>
          {capabilitiesQuery.isError ? (
            <Alert severity="warning">
              Could not load backend data-exchange capabilities. The UI is using the local role matrix as fallback.
            </Alert>
          ) : null}
        </Stack>
      </SectionCard>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        {canImport ? (
        <SectionCard title="Import CSV" description="CSV import calls the same backend create services as manual entry. OVERLORD imports for company-owned entities must include companyId.">
          <Stack spacing={2}>
            <TextField
              select
              size="small"
              label="Import type"
              value={importType}
              onChange={(event) => {
                setImportType(event.target.value as ImportType);
                setImportResult(null);
              }}
            >
              {visibleImportTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="body2" color="text.secondary">
              {importTypeOptions.find((option) => option.value === importType)?.description}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button variant="outlined" component="label" startIcon={<DescriptionRoundedIcon />}>
                Select CSV file
                <input
                  ref={inputRef}
                  hidden
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setSelectedFile(nextFile);
                    setSelectedFileError(validateCsvFile(nextFile));
                    setImportResult(null);
                  }}
                />
              </Button>

              <Button
                variant="outlined"
                startIcon={<CloudDownloadRoundedIcon />}
                onClick={() => {
                  downloadFile({
                    data: importTemplates[importType],
                    fileName: fileNameForTemplate(importType),
                    mimeType: 'text/csv;charset=utf-8',
                  });
                }}
              >
                Download template
              </Button>

              <Button
                variant="contained"
                startIcon={<CloudUploadRoundedIcon />}
                disabled={!selectedFile || Boolean(selectedFileError) || importMutation.isPending}
                onClick={() => importMutation.mutate()}
              >
                Import
              </Button>
            </Stack>

            {selectedFile ? (
              <Typography variant="body2">Selected file: {selectedFile.name} · {formatFileSize(selectedFile.size)}</Typography>
            ) : null}

            {selectedFileError ? <Alert severity="error">{selectedFileError}</Alert> : null}

            {importMutation.isPending ? <InlineLoader message="Importing CSV..." /> : null}

            {importMutation.isError ? (
              <ErrorState
                title="Import failed"
                description={normalizeApiError(importMutation.error, 'Backend import endpoint failed.').message}
                details={normalizeApiError(importMutation.error).fieldErrors}
              />
            ) : null}

            {importResult ? (
              <Alert severity={importResult.failedRows > 0 ? 'warning' : 'success'}>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Mode: {importResult.transactionMode}. Imported {importResult.importedRows} of {importResult.totalRows} rows. Failed rows: {importResult.failedRows}.
                  </Typography>
                  {importResult.errors.length > 0 ? (
                    <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Line</TableCell>
                            <TableCell>Field</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Error</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {importResult.errors.map((error) => (
                            <TableRow key={`${error.line}-${error.field}-${error.message}-${error.value ?? ''}`}>
                              <TableCell>{error.line}</TableCell>
                              <TableCell>{error.field}</TableCell>
                              <TableCell>{error.value ?? '-'}</TableCell>
                              <TableCell>{error.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  ) : null}
                </Stack>
              </Alert>
            ) : null}
          </Stack>
        </SectionCard>
        ) : (
          <SectionCard title="Import CSV" description="CSV import is not available for your role.">
            <Alert severity="info">Your role can use this page only for permitted CSV exports.</Alert>
          </SectionCard>
        )}

        {canExport ? (
        <SectionCard title="Export CSV" description="CSV export is generated from the existing report services and respects role-based data scope.">
          <Stack spacing={2}>
            <TextField
              select
              size="small"
              label="Export type"
              value={exportType}
              onChange={(event) => setExportType(event.target.value as ExportType)}
            >
              {visibleExportTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="body2" color="text.secondary">
              {exportTypeOptions.find((option) => option.value === exportType)?.description}
            </Typography>

            <Button
              variant="contained"
              startIcon={<CloudDownloadRoundedIcon />}
              disabled={exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              Export CSV
            </Button>

            {exportMutation.isPending ? <InlineLoader message="Preparing CSV export..."/> : null}

            {exportMutation.isError ? (
              <ErrorState
                title="Export failed"
                description={normalizeApiError(exportMutation.error, 'Backend export endpoint failed.').message}
                details={normalizeApiError(exportMutation.error).fieldErrors}
              />
            ) : null}
          </Stack>
        </SectionCard>
        ) : (
          <SectionCard title="Export CSV" description="CSV export is not available for your role.">
            <Alert severity="info">No export type is available for your current role.</Alert>
          </SectionCard>
        )}
      </Box>
    </Stack>
  );
}
