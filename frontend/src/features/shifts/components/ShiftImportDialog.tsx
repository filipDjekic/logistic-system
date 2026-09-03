import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { downloadFile } from '../../../core/utils/downloadFile';
import type { ShiftImportPreviewResponse } from '../types/shift.types';
import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn } from '../../../shared/types/common.types';

const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const shiftImportTemplate =
  'employeeId,startTime,endTime,timezoneId,warehouseId,notes\n1,2026-06-01T06:00,2026-06-01T14:00,1,2,Morning shift\n';

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

type ShiftImportDialogProps = {
  open: boolean;
  preview?: ShiftImportPreviewResponse;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onPreview: (file: File) => void;
  onConfirm: () => void;
};

export default function ShiftImportDialog({
  open,
  preview,
  loading,
  error,
  onClose,
  onPreview,
  onConfirm,
}: ShiftImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileError, setSelectedFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  type PreviewRow = ShiftImportPreviewResponse['rows'][number];
  const previewColumns: DataTableColumn<PreviewRow>[] = [
    { id: 'line', header: 'Line', accessor: 'rowNumber', nowrap: true },
    { id: 'status', header: 'Status', render: (row) => <Chip size="small" label={row.valid ? 'Valid' : 'Invalid'} color={row.valid ? 'success' : 'error'} />, nowrap: true },
    { id: 'employee', header: 'Employee', render: (row) => row.employeeLabel ?? row.employeeId ?? '-', nowrap: true },
    { id: 'start', header: 'Start', render: (row) => row.startTime ?? '-', nowrap: true },
    { id: 'end', header: 'End', render: (row) => row.endTime ?? '-', nowrap: true },
    { id: 'warehouse', header: 'Warehouse', render: (row) => row.warehouseId ?? '-', nowrap: true },
    { id: 'errors', header: 'Errors', render: (row) => row.errors.length > 0 ? row.errors.join(' | ') : '-', nowrap: true },
  ];

  const resetLocalState = () => {
    setSelectedFile(null);
    setSelectedFileError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const closeDialog = () => {
    resetLocalState();
    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : closeDialog} maxWidth="lg" fullWidth>
      <DialogTitle>Import shifts from CSV</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {loading ? <LinearProgress /> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Typography variant="body2" color="text.secondary">
            Every row is checked before import. Review the preview, then confirm the valid records.
          </Typography>

          <Alert severity="info">
            CSV columns: employeeId, startTime, endTime, timezoneId, warehouseId, notes. Required columns: employeeId,
            startTime, endTime, timezoneId. Optional columns: warehouseId, notes. Datetime format: 2026-06-01T06:00.
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
            {shiftImportTemplate.trim()}
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
                  const validationError = validateCsvFile(nextFile);
                  setSelectedFile(nextFile);
                  setSelectedFileError(validationError);

                  if (nextFile && !validationError) {
                    onPreview(nextFile);
                  }
                }}
              />
            </Button>

            <Button
              variant="outlined"
              startIcon={<CloudDownloadRoundedIcon />}
              disabled={loading}
              onClick={() => {
                downloadFile({
                  data: shiftImportTemplate,
                  fileName: 'shifts-import-template.csv',
                  mimeType: 'text/csv;charset=utf-8',
                });
              }}
            >
              Download template
            </Button>

            <Button
              variant="contained"
              startIcon={<CloudUploadRoundedIcon />}
              disabled={loading || !preview?.importable}
              onClick={onConfirm}
            >
              Confirm import
            </Button>
          </Stack>

          {selectedFile ? (
            <Typography variant="body2">
              Selected file: {selectedFile.name} · {formatFileSize(selectedFile.size)}
            </Typography>
          ) : null}

          {selectedFileError ? <Alert severity="error">{selectedFileError}</Alert> : null}

          {preview ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`Total: ${preview.totalRows}`} />
                <Chip label={`Valid: ${preview.validRows}`} color="success" />
                <Chip label={`Invalid: ${preview.invalidRows}`} color={preview.invalidRows > 0 ? 'error' : 'default'} />
              </Stack>
              <DataTable columns={previewColumns} rows={preview.rows} getRowId={(row) => row.rowNumber} size="small" maxHeight={420} minWidth={900} enableClientWindowing fixedRowHeight={44} getRowStatus={(row) => row.valid ? 'COMPLETED' : 'FAILED'} />
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} disabled={loading}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
