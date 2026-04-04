import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';

type SearchToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
};

export default function SearchToolbar({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  fullWidth = false,
}: SearchToolbarProps) {
  const hasValue = value.trim().length > 0;

  return (
    <TextField
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      fullWidth={fullWidth}
      size="small"
      sx={{ minWidth: fullWidth ? undefined : 260 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: hasValue ? (
          <InputAdornment position="end">
            <Tooltip title="Clear search">
              <IconButton
                edge="end"
                size="small"
                aria-label="Clear search"
                onClick={() => onChange('')}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}