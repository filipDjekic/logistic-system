import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import StatusChip from '../StatusChip/StatusChip';

type LifecycleStatusGraphProps<TStatus extends string> = {
  statuses: readonly TStatus[];
  currentStatus: TStatus;
  allowedNextStatuses?: readonly TStatus[];
  terminalStatuses?: readonly TStatus[];
};

export default function LifecycleStatusGraph<TStatus extends string>({
  statuses,
  currentStatus,
  allowedNextStatuses = [],
  terminalStatuses = [],
}: LifecycleStatusGraphProps<TStatus>) {
  const currentIndex = statuses.indexOf(currentStatus);
  const allowedSet = new Set<string>(allowedNextStatuses);
  const terminalSet = new Set<string>(terminalStatuses);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
        {statuses.map((status, index) => {
          const isCurrent = status === currentStatus;
          const isCompleted = currentIndex >= 0 && index < currentIndex && !terminalSet.has(currentStatus);
          const isAllowed = allowedSet.has(status);
          const isTerminal = terminalSet.has(status);

          return (
            <Stack key={status} direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  border: 1,
                  borderColor: isCurrent ? 'primary.main' : isAllowed ? 'success.main' : 'divider',
                  bgcolor: isCurrent ? 'primary.50' : isAllowed ? 'success.50' : 'background.paper',
                  minWidth: 120,
                }}
              >
                <Stack spacing={0.75} alignItems="flex-start">
                  <StatusChip value={status} />
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {isCurrent ? <Chip size="small" color="primary" label="Current" /> : null}
                    {isAllowed ? <Chip size="small" color="success" variant="outlined" label="Allowed next" /> : null}
                    {isCompleted ? <Chip size="small" variant="outlined" label="Passed" /> : null}
                    {isTerminal ? <Chip size="small" variant="outlined" label="Terminal" /> : null}
                  </Stack>
                </Stack>
              </Box>
              {index < statuses.length - 1 ? <Divider flexItem orientation="vertical" /> : null}
            </Stack>
          );
        })}
      </Stack>

      {allowedNextStatuses.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No allowed next transition is currently available for this entity and role.
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Allowed next: {allowedNextStatuses.join(', ')}.
        </Typography>
      )}
    </Stack>
  );
}
