import { useState, type ReactNode } from 'react';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { alpha, Box, Button, Chip, Collapse, Stack, Typography } from '@mui/material';

export type ActiveFilterChip = {
  key: string;
  label: string;
  onDelete?: () => void;
};

type Props = {
  children: ReactNode;
  minColumnWidth?: number;
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  activeFilters?: ActiveFilterChip[];
  lookupSection?: ReactNode;
};

export default function FilterPanel({
  children,
  minColumnWidth = 220,
  title = 'Filters',
  description,
  collapsible = true,
  defaultExpanded = true,
  activeFilters = [],
  lookupSection,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasActiveFilters = activeFilters.length > 0;
  const content = (
    <Stack spacing={1.5}>
      {lookupSection ? (
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2,
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            backgroundColor: 'action.hover',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Lookup filters
          </Typography>
          {lookupSection}
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`,
          },
          gap: 1.25,
          alignItems: 'start',
          '& .MuiFormControl-root': {
            width: '100%',
            minWidth: 0,
          },
        }}
      >
        {children}
      </Box>
    </Stack>
  );

  return (
    <Box
      sx={(theme) => ({
        p: { xs: 1.25, sm: 1.5 },
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.paper',
        boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.04)}`,
      })}
    >
      <Stack spacing={1.25}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <FilterListRoundedIcon fontSize="small" color="action" />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                {title}
              </Typography>
              {description ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {description}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          {collapsible ? (
            <Button
              size="small"
              variant="text"
              endIcon={<KeyboardArrowDownRoundedIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />}
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? 'Hide' : 'Show'}
            </Button>
          ) : null}
        </Stack>

        {hasActiveFilters ? (
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {activeFilters.map((filter) => (
              <Chip key={filter.key} size="small" label={filter.label} onDelete={filter.onDelete} sx={{ fontWeight: 700 }} />
            ))}
          </Stack>
        ) : null}

        {collapsible ? <Collapse in={expanded}>{content}</Collapse> : content}
      </Stack>
    </Box>
  );
}
