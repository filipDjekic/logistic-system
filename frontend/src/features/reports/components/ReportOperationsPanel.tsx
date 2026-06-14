import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { Alert, Box, Button, Chip, Divider, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';

export type ReportExportFormat = 'CSV' | 'XLSX';

export type ReportPreset = {
  id: string;
  label: string;
  description: string;
  apply: () => void;
};

export type ReportSnapshot = {
  label: string;
  value: string | number;
  helper?: string;
  severity?: 'default' | 'success' | 'warning' | 'error' | 'info';
};

type SavedReportFilter<TState> = {
  id: string;
  name: string;
  createdAt: string;
  state: TState;
  summary: string;
};

type ReportOperationsPanelProps<TState> = {
  storageKey: string;
  currentState: TState;
  currentSummary: string;
  presets: ReportPreset[];
  snapshots: ReportSnapshot[];
  exportFormat: ReportExportFormat;
  onExportFormatChange: (format: ReportExportFormat) => void;
  onApplySavedFilter: (state: TState) => void;
};

function readSavedFilters<TState>(storageKey: string): SavedReportFilter<TState>[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) as SavedReportFilter<TState>[] : [];
  } catch {
    return [];
  }
}

function writeSavedFilters<TState>(storageKey: string, value: SavedReportFilter<TState>[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

export default function ReportOperationsPanel<TState>({
  storageKey,
  currentState,
  currentSummary,
  presets,
  snapshots,
  exportFormat,
  onExportFormatChange,
  onApplySavedFilter,
}: ReportOperationsPanelProps<TState>) {
  const [filterName, setFilterName] = useState('');
  const [savedFilters, setSavedFilters] = useState<SavedReportFilter<TState>[]>(() => readSavedFilters<TState>(storageKey));

  const scheduleProfileCount = savedFilters.length;

  const snapshotItems = useMemo(() => snapshots.filter((item) => item.value !== undefined && item.value !== null), [snapshots]);

  function saveCurrentFilter() {
    const trimmedName = filterName.trim() || `Saved filter ${savedFilters.length + 1}`;
    const next: SavedReportFilter<TState>[] = [
      {
        id: `${Date.now()}`,
        name: trimmedName,
        createdAt: new Date().toISOString(),
        state: currentState,
        summary: currentSummary,
      },
      ...savedFilters,
    ].slice(0, 8);

    setSavedFilters(next);
    writeSavedFilters(storageKey, next);
    setFilterName('');
  }

  function deleteSavedFilter(id: string) {
    const next = savedFilters.filter((item) => item.id !== id);
    setSavedFilters(next);
    writeSavedFilters(storageKey, next);
  }

  return (
    <SectionCard
      title="Report operations"
      description="Saved filters, presets, export profile and operational snapshots for this report."
    >
      <Stack spacing={2.5}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1.1fr 1fr' } }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TuneRoundedIcon fontSize="small" />
              <Typography variant="subtitle2">Report presets</Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {presets.map((preset) => (
                <Button key={preset.id} size="small" variant="outlined" onClick={preset.apply} title={preset.description}>
                  {preset.label}
                </Button>
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Presets apply common operational filters without changing backend report logic.
            </Typography>
          </Stack>

          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FileDownloadRoundedIcon fontSize="small" />
              <Typography variant="subtitle2">Export profile</Typography>
            </Stack>
            <TextField
              select
              size="small"
              label="Format"
              value={exportFormat}
              onChange={(event) => onExportFormatChange(event.target.value as ReportExportFormat)}
              sx={{ maxWidth: 260 }}
            >
              <MenuItem value="CSV">CSV · raw data</MenuItem>
              <MenuItem value="XLSX">XLSX · spreadsheet profile</MenuItem>
            </TextField>
            <Typography variant="caption" color="text.secondary">
              CSV is best for integrations. XLSX is best for manual analysis in spreadsheet tools.
            </Typography>
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1.1fr 1fr' } }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SaveRoundedIcon fontSize="small" />
              <Typography variant="subtitle2">Saved filters</Typography>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                size="small"
                label="Saved filter name"
                value={filterName}
                onChange={(event) => setFilterName(event.target.value)}
                placeholder="Monthly delayed transports"
                fullWidth
              />
              <Button variant="contained" onClick={saveCurrentFilter}>Save</Button>
            </Stack>
            {savedFilters.length > 0 ? (
              <Stack spacing={1}>
                {savedFilters.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', border: 1, borderColor: 'divider', borderRadius: 2, px: 1.25, py: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700}>{item.name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{item.summary}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => onApplySavedFilter(item.state)}>Apply</Button>
                      <Button size="small" color="inherit" onClick={() => deleteSavedFilter(item.id)}><DeleteOutlineRoundedIcon fontSize="small" /></Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No saved filters yet.</Typography>
            )}
          </Stack>

          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ScheduleRoundedIcon fontSize="small" />
              <Typography variant="subtitle2">Schedule-ready profiles</Typography>
            </Stack>
            <Alert severity="info">
              Saved filters are now structured as reusable export profiles. A real scheduled exporter can run these profiles later without changing the report screen contract.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Available schedule-ready profiles: {scheduleProfileCount}
            </Typography>
          </Stack>
        </Box>

        {snapshotItems.length > 0 ? (
          <>
            <Divider />
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Operational snapshot</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {snapshotItems.map((item) => (
                  <Chip
                    key={item.label}
                    label={`${item.label}: ${item.value}${item.helper ? ` · ${item.helper}` : ''}`}
                    color={item.severity === 'default' ? undefined : item.severity}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Stack>
          </>
        ) : null}
      </Stack>
    </SectionCard>
  );
}
