import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import ErrorState from '../../../shared/components/ErrorState/ErrorState';
import InlineLoader from '../../../shared/components/Loader/InlineLoader';
import { normalizeApiError } from '../../../core/api/apiError';
import { downloadFile } from '../../../core/utils/downloadFile';
import { importTemplates, type ImportResultResponse, type ImportType } from '../api/dataExchangeApi';

const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const csvColumnsByType: Record<ImportType, string> = {
  products: 'name, description, sku, unit, price, fragile, weight, companyId',
  vehicles: 'registrationNumber, brand, model, type, capacity, maxWeight, maxVolume, maxItems, fuelType, yearOfProduction, status, companyId',
  warehouses: 'name, address, city, postalCode, countryId, timezoneId, latitude, longitude, capacity, status, employeeId, companyId',
  'warehouse-inventory': 'warehouseId, productId, quantity, minStockLevel',
  employees: 'firstName, lastName, jmbg, phoneNumber, email, address, city, postalCode, countryId, timezoneId, primaryWarehouseId, position, employmentDate, salary, userId, companyId',
};

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

function fileNameForTemplate(type: ImportType) {
  return `${type}-import-template.csv`;
}

type CsvImportDialogProps = {
  open: boolean;
  type: ImportType;
  title: string;
  description?: string;
  loading?: boolean;
  result?: ImportResultResponse | null;
  error?: unknown;
  onClose: () => void;
  onImport: (file: File) => void;
};

export default function CsvImportDialog({
  open,
  type,
  title,
  description,
  loading = false,
  result,
  error,
  onClose,
  onImport,
}: CsvImportDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileError, setSelectedFileError] = useState<string | null>(null);

  const resetLocalState = () => {
    setSelectedFile(null);
    setSelectedFileError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetLocalState();
        onClose();
      }}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {description ?? 'CSV import uses the same backend validation and role scope as manual entry.'}
          </Typography>

          <Alert severity="info">
            CSV columns: {csvColumnsByType[type]}
          </Alert>

          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              overflow: 'auto',
              fontSize: 12,
            }}
          >
            {importTemplates[type].trim()}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="outlined" component="label" startIcon={<DescriptionRoundedIcon />} disabled={loading}>
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
                }}
              />
            </Button>

            <Button
              variant="outlined"
              startIcon={<CloudDownloadRoundedIcon />}
              disabled={loading}
              onClick={() => {
                downloadFile({
                  data: importTemplates[type],
                  fileName: fileNameForTemplate(type),
                  mimeType: 'text/csv;charset=utf-8',
                });
              }}
            >
              Download template
            </Button>

            <Button
              variant="contained"
              startIcon={<CloudUploadRoundedIcon />}
              disabled={!selectedFile || Boolean(selectedFileError) || loading}
              onClick={() => {
                const validationError = validateCsvFile(selectedFile);
                if (validationError) {
                  setSelectedFileError(validationError);
                  return;
                }

                onImport(selectedFile as File);
              }}
            >
              Import
            </Button>
          </Stack>

          {selectedFile ? (
            <Typography variant="body2">
              Selected file: {selectedFile.name} · {formatFileSize(selectedFile.size)}
            </Typography>
          ) : null}

          {selectedFileError ? <Alert severity="error">{selectedFileError}</Alert> : null}
          {loading ? <InlineLoader message="Importing CSV..." /> : null}

          {error ? (
            <ErrorState
              title="Import failed"
              description={normalizeApiError(error, 'Backend import endpoint failed.').message}
              details={normalizeApiError(error).fieldErrors}
            />
          ) : null}

          {result ? (
            <Alert severity={result.failedRows > 0 ? 'warning' : 'success'}>
              <Stack spacing={1}>
                <Typography variant="body2">
                  Mode: {result.transactionMode}. Imported {result.importedRows} of {result.totalRows} rows. Failed rows: {result.failedRows}.
                </Typography>
                {result.errors.length > 0 ? (
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
                        {result.errors.map((rowError) => (
                          <TableRow key={`${rowError.line}-${rowError.field}-${rowError.message}-${rowError.value ?? ''}`}>
                            <TableCell>{rowError.line}</TableCell>
                            <TableCell>{rowError.field}</TableCell>
                            <TableCell>{rowError.value ?? '-'}</TableCell>
                            <TableCell>{rowError.message}</TableCell>
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
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            resetLocalState();
            onClose();
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
