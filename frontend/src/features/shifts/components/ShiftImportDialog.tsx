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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { downloadFile } from '../../../core/utils/downloadFile';
import type { ShiftImportPreviewResponse } from '../types/shift.types';

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
            CSV import first validates every row and shows preview. Import is confirmed only after all rows pass backend validation.
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
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Line</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Employee</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Warehouse</TableCell>
                      <TableCell>Errors</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>
                          <Chip size="small" label={row.valid ? 'Valid' : 'Invalid'} color={row.valid ? 'success' : 'error'} />
                        </TableCell>
                        <TableCell>{row.employeeLabel ?? row.employeeId ?? '-'}</TableCell>
                        <TableCell>{row.startTime ?? '-'}</TableCell>
                        <TableCell>{row.endTime ?? '-'}</TableCell>
                        <TableCell>{row.warehouseId ?? '-'}</TableCell>
                        <TableCell>{row.errors.length > 0 ? row.errors.join(' | ') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
