import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Stack, Typography } from '@mui/material';
import SectionCard from '../SectionCard/SectionCard';

type RecommendedNextStepAction = {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  disabled?: boolean;
};

type RecommendedNextStepProps = {
  title: string;
  description: ReactNode;
  severity?: 'info' | 'success' | 'warning' | 'error';
  actions?: RecommendedNextStepAction[];
};

export default function RecommendedNextStep({
  title,
  description,
  severity = 'info',
  actions = [],
}: RecommendedNextStepProps) {
  return (
    <SectionCard title="Recommended next step" description="Context-aware guidance for the current record state.">
      <Alert severity={severity} variant="outlined">
        <Stack spacing={1.5}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" fontWeight={900}>{title}</Typography>
            <Typography variant="body2">{description}</Typography>
          </Stack>

          {actions.length > 0 ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
              {actions.map((action) => {
                const button = (
                  <Button
                    key={action.label}
                    size="small"
                    variant={action.variant ?? 'contained'}
                    disabled={action.disabled}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </Button>
                );

                if (!action.to) {
                  return button;
                }

                return (
                  <Button
                    key={action.label}
                    size="small"
                    variant={action.variant ?? 'contained'}
                    component={RouterLink}
                    to={action.to}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </Stack>
          ) : null}
        </Stack>
      </Alert>
    </SectionCard>
  );
}
