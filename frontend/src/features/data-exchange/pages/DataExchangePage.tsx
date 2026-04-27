import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import { downloadFile } from '../../../core/utils/downloadFile';
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
    description: 'CSV columns: registrationNumber, brand, model, type, capacity, fuelType, yearOfProduction, status, companyId',
  },
  {
    value: 'warehouses',
    label: 'Warehouses',
    description: 'CSV columns: name, address, city, capacity, status, employeeId, companyId',
  },
  {
    value: 'warehouse-inventory',
    label: 'Warehouse inventory',
    description: 'CSV columns: warehouseId, productId, quantity, minStockLevel',
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

function fileNameForExport(type: ExportType) {
  return `${type}.csv`;
}

function fileNameForTemplate(type: ImportType) {
  return `${type}-import-template.csv`;
}

export default function DataExchangePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [importType, setImportType] = useState<ImportType>('products');
  const [exportType, setExportType] = useState<ExportType>('transport-report');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResultResponse | null>(null);

  const importMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) {
        throw new Error('CSV file is required.');
      }

      return dataExchangeApi.importCsv(importType, selectedFile);
    },
    onSuccess: (result) => {
      setImportResult(result);
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => dataExchangeApi.exportCsv(exportType),
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
        description="Import operational master data from CSV files and export report data as CSV."
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
        }}
      >
        <SectionCard title="Import CSV" description="CSV import uses the same backend validation and company scoping as manual creation.">
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
              {importTypeOptions.map((option) => (
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
                    setSelectedFile(event.target.files?.[0] ?? null);
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
                disabled={!selectedFile || importMutation.isPending}
                onClick={() => importMutation.mutate()}
              >
                Import
              </Button>
            </Stack>

            {selectedFile ? (
              <Typography variant="body2">Selected file: {selectedFile.name}</Typography>
            ) : null}

            {importMutation.isPending ? <InlineLoader message="Importing CSV..." size={22} /> : null}

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
                    Imported {importResult.importedRows} of {importResult.totalRows} rows. Failed rows: {importResult.failedRows}.
                  </Typography>
                  {importResult.errors.slice(0, 10).map((error) => (
                    <Typography key={error} variant="caption" display="block">
                      {error}
                    </Typography>
                  ))}
                </Stack>
              </Alert>
            ) : null}
          </Stack>
        </SectionCard>

        <SectionCard title="Export CSV" description="CSV export is generated from the existing report services and respects role-based data scope.">
          <Stack spacing={2}>
            <TextField
              select
              size="small"
              label="Export type"
              value={exportType}
              onChange={(event) => setExportType(event.target.value as ExportType)}
            >
              {exportTypeOptions.map((option) => (
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

            {exportMutation.isPending ? <InlineLoader message="Preparing CSV export..." size={22} /> : null}

            {exportMutation.isError ? (
              <ErrorState
                title="Export failed"
                description={normalizeApiError(exportMutation.error, 'Backend export endpoint failed.').message}
                details={normalizeApiError(exportMutation.error).fieldErrors}
              />
            ) : null}
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}
