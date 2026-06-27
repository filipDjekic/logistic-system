import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Chip, FormHelperText, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { EntityLookupDialog } from './EntityLookupDialog';
import type { LookupEntityType, LookupOption } from '../types/lookup.types';

export type EntityLookupFieldProps = {
  label: string;
  entityType: LookupEntityType;
  value?: LookupOption | null;
  onChange: (option: LookupOption | null) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  dialogTitle?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  disabledOptionIds?: number[];
  sort?: string;
  activeOnly?: boolean;
  warehouseId?: number | string | null;
  accessMode?: 'read' | 'mutate';
};

export function EntityLookupField({
  label,
  entityType,
  value = null,
  onChange,
  disabled = false,
  required = false,
  error = false,
  helperText,
  placeholder = 'Not selected',
  dialogTitle,
  searchPlaceholder,
  pageSize,
  disabledOptionIds,
  sort,
  activeOnly,
  warehouseId,
  accessMode,
}: EntityLookupFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Typography variant="caption" color={error ? 'error' : 'text.secondary'} fontWeight={700}>
        {label}{required ? ' *' : ''}
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        sx={{
          mt: 0.75,
          p: 1,
          border: 1,
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 1,
          bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
          cursor: disabled ? 'default' : 'pointer',
          '&:hover': disabled ? undefined : {
            borderColor: 'primary.main',
          },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {value ? (
            <Stack spacing={0.25}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" fontWeight={700} noWrap>
                  {value.label}
                </Typography>
                {value.status ? <Chip size="small" label={value.status} /> : null}
              </Stack>
              {value.subtitle ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {value.subtitle}
                </Typography>
              ) : null}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {placeholder}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {value ? (
            <IconButton
              size="small"
              aria-label={`Clear ${label}`}
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          ) : null}
          <Button
            size="small"
            variant={value ? 'outlined' : 'contained'}
            startIcon={<SearchIcon />}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              setOpen(true);
            }}
          >
            {value ? 'Change' : 'Choose'}
          </Button>
        </Stack>
      </Stack>

      {helperText ? <FormHelperText error={error}>{helperText}</FormHelperText> : null}

      <EntityLookupDialog
        open={open}
        title={dialogTitle ?? `Choose ${label}`}
        entityType={entityType}
        value={value}
        onClose={() => setOpen(false)}
        onSelect={onChange}
        searchPlaceholder={searchPlaceholder}
        pageSize={pageSize}
        disabledOptionIds={disabledOptionIds}
        sort={sort}
        activeOnly={activeOnly}
        warehouseId={warehouseId}
        accessMode={accessMode}
      />
    </Box>
  );
}
