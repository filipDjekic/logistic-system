import type { ReactNode } from 'react';
import { alpha, Avatar, Box, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import StatusChip from '../StatusChip/StatusChip';
import DetailsActionBar from './DetailsActionBar';
import type { DetailsAction } from './DetailsActionBar';

type HeroInfo = {
  label: ReactNode;
  value: ReactNode;
};

type DetailsHeroProps = {
  overline?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  avatar?: ReactNode;
  status?: string | null;
  lifecycleStatus?: string | null;
  statusNode?: ReactNode;
  lifecycleNode?: ReactNode;
  primaryInfo?: HeroInfo[];
  actions?: DetailsAction[];
  actionSlot?: ReactNode;
  sx?: SxProps<Theme>;
};

export default function DetailsHero({
  overline,
  title,
  subtitle,
  description,
  avatar,
  status,
  lifecycleStatus,
  statusNode,
  lifecycleNode,
  primaryInfo,
  actions,
  actionSlot,
  sx,
}: DetailsHeroProps) {
  const hasPrimaryInfo = Boolean(primaryInfo?.length);

  return (
    <Box
      sx={(theme) => ({
        p: { xs: 1.5, sm: 2, md: 2.5 },
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.background.paper, 0.96)} 48%, ${alpha(theme.palette.secondary.main, 0.05)})`,
        boxShadow: theme.shadows[1],
        minWidth: 0,
        ...((typeof sx === 'function' ? sx(theme) : sx) as object),
      })}
    >
      <Stack spacing={{ xs: 2, md: 2.5 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
          spacing={{ xs: 2, md: 3 }}
          sx={{ minWidth: 0 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
            {avatar ? (
              <Avatar sx={{ width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 }, fontWeight: 900 }}>
                {avatar}
              </Avatar>
            ) : null}

            <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
              {overline ? (
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.1em', fontWeight: 900, lineHeight: 1.2 }}>
                  {overline}
                </Typography>
              ) : null}

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.125rem' },
                    lineHeight: { xs: 1.18, md: 1.22 },
                    overflowWrap: 'anywhere',
                    minWidth: 0,
                  }}
                >
                  {title}
                </Typography>
                {statusNode ?? (status ? <StatusChip value={status} emphasis="strong" /> : null)}
                {lifecycleNode ?? (lifecycleStatus ? <StatusChip value={lifecycleStatus} variant="outlined" emphasis="strong" /> : null)}
              </Stack>

              {subtitle ? (
                <Typography variant="subtitle2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                  {subtitle}
                </Typography>
              ) : null}

              {description ? (
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 860, overflowWrap: 'anywhere' }}>
                  {description}
                </Typography>
              ) : null}
            </Stack>
          </Stack>

          <DetailsActionBar actions={actions}>{actionSlot}</DetailsActionBar>
        </Stack>

        {hasPrimaryInfo ? (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ minWidth: 0 }}
          >
            {primaryInfo?.map((item, index) => (
              <Box
                key={index}
                sx={(theme) => ({
                  flex: { xs: '1 1 100%', sm: '1 1 180px' },
                  minWidth: 0,
                  p: 1.25,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.72),
                })}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
                  {item.value ?? '—'}
                </Typography>
              </Box>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

export type { DetailsHeroProps, HeroInfo };
