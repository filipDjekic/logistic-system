import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUnreadNotificationsCount } from '../hooks/useUnreadNotificationsCount';

export default function NotificationBadge() {
  const navigate = useNavigate();
  const unreadCountQuery = useUnreadNotificationsCount();

  const unreadCount = unreadCountQuery.data ?? 0;

  return (
    <Tooltip title="Notifications">
      <span>
        <IconButton
          onClick={() => navigate('/notifications')}
          disabled={unreadCountQuery.isLoading && unreadCount === 0}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsNoneRoundedIcon />
          </Badge>
        </IconButton>
      </span>
    </Tooltip>
  );
}