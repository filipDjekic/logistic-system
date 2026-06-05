import { useEffect, useState } from 'react';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';

export type TableDensity = 'comfortable' | 'compact';

export const TABLE_DENSITY_STORAGE_KEY = 'logistics.tableDensity';
export const TABLE_DENSITY_CHANGED_EVENT = 'logistics:table-density-changed';

export function readStoredTableDensity(): TableDensity {
  if (typeof window === 'undefined') {
    return 'comfortable';
  }

  return window.localStorage.getItem(TABLE_DENSITY_STORAGE_KEY) === 'compact'
    ? 'compact'
    : 'comfortable';
}

export function writeStoredTableDensity(value: TableDensity) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(TABLE_DENSITY_CHANGED_EVENT, { detail: value }));
}

export default function TableDensityControl() {
  const [density, setDensity] = useState<TableDensity>(() => readStoredTableDensity());

  useEffect(() => {
    const handleDensityChange = () => setDensity(readStoredTableDensity());

    window.addEventListener(TABLE_DENSITY_CHANGED_EVENT, handleDensityChange);
    window.addEventListener('storage', handleDensityChange);

    return () => {
      window.removeEventListener(TABLE_DENSITY_CHANGED_EVENT, handleDensityChange);
      window.removeEventListener('storage', handleDensityChange);
    };
  }, []);

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={density}
      aria-label="Table density"
      onChange={(_, nextDensity: TableDensity | null) => {
        if (nextDensity) {
          setDensity(nextDensity);
          writeStoredTableDensity(nextDensity);
        }
      }}
      sx={{
        '& .MuiToggleButton-root': {
          px: 1,
          minWidth: 36,
        },
      }}
    >
      <ToggleButton value="comfortable" aria-label="Comfortable table density">
        <Tooltip title="Comfortable table density">
          <ViewComfyIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="compact" aria-label="Compact table density">
        <Tooltip title="Compact table density">
          <ViewCompactIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
