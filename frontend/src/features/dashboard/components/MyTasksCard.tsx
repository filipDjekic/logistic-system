import dayjs from 'dayjs';
import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { TaskResponse } from '../api/dashboardApi';

type MyTasksCardProps = {
  tasks: TaskResponse[];
};

export default function MyTasksCard({ tasks }: MyTasksCardProps) {
  const navigate = useNavigate();
  const visibleTasks = [...tasks]
    .sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })
    .slice(0, 5);

  return (
    <SectionCard
      title="My tasks"
      description="Your nearest and most relevant assigned tasks."
      action={
        <Button variant="outlined" onClick={() => navigate('/notifications')}>
          Notifications
        </Button>
      }
    >
      {tasks.length === 0 ? (
        <EmptyState
          title="No assigned tasks"
          description="You currently do not have any tasks assigned to your account."
        />
      ) : (
        <Stack spacing={1.5}>
          {visibleTasks.map((task) => (
            <Stack
              key={task.id}
              spacing={1}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
              >
                <Typography variant="body1" fontWeight={700}>
                  {task.title}
                </Typography>

                <Stack direction="row" spacing={1}>
                  <StatusChip value={task.priority} />
                  <StatusChip value={task.status} />
                </Stack>
              </Stack>

              {task.description ? (
                <Typography variant="body2" color="text.secondary">
                  {task.description}
                </Typography>
              ) : null}

              <Typography variant="body2" color="text.secondary">
                Due: {task.dueDate ? dayjs(task.dueDate).format('DD.MM.YYYY. HH:mm') : '-'}
              </Typography>

              {task.transportOrderId ? (
                <Typography variant="body2" color="text.secondary">
                  Transport order ID: {task.transportOrderId}
                </Typography>
              ) : null}
            </Stack>
          ))}
        </Stack>
      )}
    </SectionCard>
  );
}