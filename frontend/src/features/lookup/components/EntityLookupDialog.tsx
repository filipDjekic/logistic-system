import CloseIcon from '@mui/icons-material/Close';
import { Chip, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { SearchSelectPanel, useDebouncedValue } from '../../../shared/search-select';
import type { SearchSelectColumn } from '../../../shared/search-select';
import { useEntityLookup } from '../hooks/useEntityLookup';
import type { LookupEntityType, LookupOption } from '../types/lookup.types';

const nonSelectableStatuses = new Set(['INACTIVE', 'ARCHIVED', 'DISABLED', 'DELETED']);

const lookupColumns: SearchSelectColumn<LookupOption>[] = [
  {
    key: 'record',
    label: 'Record',
    render: (option) => (
      <Stack spacing={0.25}>
        <Typography variant="body2" fontWeight={600}>
          {option.label}
        </Typography>
        {option.subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {option.subtitle}
          </Typography>
        ) : null}
      </Stack>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 160,
    render: (option) => (option.status ? <Chip size="small" label={option.status} /> : '-'),
  },
];

export type EntityLookupDialogProps = {
  open: boolean;
  title: string;
  entityType: LookupEntityType;
  value?: LookupOption | null;
  onClose: () => void;
  onSelect: (option: LookupOption) => void;
  searchPlaceholder?: string;
  pageSize?: number;
  disabledOptionIds?: number[];
  sort?: string;
  activeOnly?: boolean;
  warehouseId?: number | string | null;
  accessMode?: 'read' | 'mutate';
};

export function EntityLookupDialog({
  open,
  title,
  entityType,
  value,
  onClose,
  onSelect,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  disabledOptionIds = [],
  sort,
  activeOnly,
  warehouseId,
  accessMode,
}: EntityLookupDialogProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const lookupQuery = useEntityLookup(
    entityType,
    {
      search: debouncedSearch || undefined,
      page,
      size: pageSize,
      ...(sort ? { sort } : {}),
      ...(activeOnly !== undefined ? { activeOnly } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      ...(accessMode ? { accessMode } : {}),
    },
    open,
  );

  const options = lookupQuery.data?.content ?? [];
  const totalPages = lookupQuery.data?.totalPages ?? 0;

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch);
    setPage(0);
  };

  const handleSelect = (option: LookupOption) => {
    onSelect(option);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton aria-label="Close lookup" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <SearchSelectPanel
          title={title}
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          rows={options}
          columns={lookupColumns}
          getRowKey={(option) => option.id}
          selectedId={value?.id ?? null}
          selectedLabel={value?.label ?? null}
          onSelect={handleSelect}
          getSelectDisabled={(option) =>
            disabledOptionIds.includes(option.id) || nonSelectableStatuses.has((option.status ?? '').toUpperCase())
          }
          loading={lookupQuery.isFetching}
          error={lookupQuery.error ? getErrorMessage(lookupQuery.error) : null}
          emptyMessage="No records found."
          page={page}
          pageCount={totalPages}
          onPageChange={setPage}
        />
      </DialogContent>
    </Dialog>
  );
}
