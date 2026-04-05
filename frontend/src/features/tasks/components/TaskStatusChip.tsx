import StatusChip from '../../../shared/components/StatusChip/StatusChip';
import type { TaskStatus } from '../types/task.types';

type TaskStatusChipProps = {
  status: TaskStatus;
};

export default function TaskStatusChip({ status }: TaskStatusChipProps) {
  return <StatusChip value={status} />;
}