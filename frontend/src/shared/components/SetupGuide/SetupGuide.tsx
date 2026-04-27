import type { ReactNode } from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

type SetupGuideAction = {
  label: string;
  to: string;
};

type SetupGuideItem = {
  title: string;
  description: string;
  done?: boolean;
  action?: SetupGuideAction;
};

type SetupGuideProps = {
  title: string;
  description: string;
  items: SetupGuideItem[];
  footer?: ReactNode;
};

export default function SetupGuide({ title, description, items, footer }: SetupGuideProps) {
  const visibleItems = items.filter((item) => !item.done);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: { xs: 1.5, sm: 2 },
        bgcolor:
          theme.palette.mode === 'dark'
            ? 'rgba(245, 158, 11, 0.08)'
            : 'rgba(245, 158, 11, 0.06)',
      })}
    >
      <Stack spacing={1.5}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle1" fontWeight={800}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          {visibleItems.map((item) => (
            <Stack
              key={item.title}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={1.25}
              sx={(theme) => ({
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              })}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                {item.done ? (
                  <CheckCircleRoundedIcon color="success" fontSize="small" />
                ) : (
                  <ErrorOutlineRoundedIcon color="warning" fontSize="small" />
                )}
                <Stack spacing={0.25}>
                  <Typography variant="body2" fontWeight={700}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                </Stack>
              </Stack>

              {item.action ? (
                <Button
                  component={RouterLink}
                  to={item.action.to}
                  size="small"
                  variant="outlined"
                  sx={{ flexShrink: 0 }}
                >
                  {item.action.label}
                </Button>
              ) : null}
            </Stack>
          ))}
        </Stack>

        {footer ? <Box>{footer}</Box> : null}
      </Stack>
    </Box>
  );
}
