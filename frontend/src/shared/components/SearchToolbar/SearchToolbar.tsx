import { useEffect, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';

type SearchToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  debounceMs?: number;
};

export default function SearchToolbar({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  fullWidth = false,
  debounceMs = 400,
}: SearchToolbarProps) {
  const [localValue, setLocalValue] = useState(value);
  const hasValue = localValue.trim().length > 0;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) return undefined;
    const timeoutId = window.setTimeout(() => onChange(localValue), debounceMs);
    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, localValue, onChange, value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <TextField
      value={localValue}
      onChange={(event) => setLocalValue(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      fullWidth={fullWidth}
      size="small"
      inputProps={{ 'aria-label': placeholder }}
      sx={{
        minWidth: fullWidth ? undefined : { xs: '100%', sm: 260 },
        width: { xs: '100%', sm: fullWidth ? '100%' : 'auto' },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: hasValue ? (
          <InputAdornment position="end">
            <Tooltip title="Clear search">
              <IconButton edge="end" size="small" aria-label="Clear search" onClick={handleClear} disabled={disabled}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}
