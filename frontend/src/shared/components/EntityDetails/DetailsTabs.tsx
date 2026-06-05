import type { ReactNode } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

type DetailsTab = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type DetailsTabsProps = {
  value: string;
  tabs: DetailsTab[];
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export default function DetailsTabs({ value, tabs, onChange, ariaLabel = 'Details sections' }: DetailsTabsProps) {
  const activeTab = tabs.find((tab) => tab.value === value);

  return (
    <Box>
      <Box sx={{ display: { xs: 'block', sm: 'none' }, px: 1.5, pt: 1.25, pb: 0.75 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Current section
        </Typography>
        <Typography variant="body2" fontWeight={800} noWrap>
          {activeTab?.label ?? 'Details'}
        </Typography>
      </Box>

      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { borderRadius: 999, backgroundColor: 'divider' },
        }}
      >
        <Tabs
          value={value}
          onChange={(_, nextValue: string) => onChange(nextValue)}
          aria-label={ariaLabel}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: { xs: 42, sm: 48 },
            px: { xs: 0.5, sm: 1 },
            '& .MuiTab-root': {
              minHeight: { xs: 42, sm: 48 },
              minWidth: { xs: 112, sm: 132 },
              px: { xs: 1.25, sm: 2 },
              fontSize: { xs: '0.76rem', sm: '0.875rem' },
              whiteSpace: 'nowrap',
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} disabled={tab.disabled} />
          ))}
        </Tabs>
      </Box>
    </Box>
  );
}
