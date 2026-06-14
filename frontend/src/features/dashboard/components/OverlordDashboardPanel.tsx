import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import StatCard from '../../../shared/components/StatCard/StatCard';
import DashboardAlerts from './DashboardAlerts';
import type { OverlordDashboardResponse } from '../api/dashboardApi';

type Props = {
  data: OverlordDashboardResponse;
};

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
}

function getStatusCount(statuses: Record<string, number>, ...keys: string[]) {
  return keys.reduce((total, key) => total + Number(statuses[key] ?? 0), 0);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

export default function OverlordDashboardPanel({ data }: Props) {
  const activeUsers = getStatusCount(data.usersByStatus, 'ACTIVE');
  const inactiveUsers = Math.max(Number(data.usersTotal ?? 0) - activeUsers, 0);
  const systemAlerts = Number(data.alerts?.length ?? 0);

  const cards = [
    {
      key: 'companies',
      title: 'Companies',
      value: formatNumber(data.companiesTotal),
      subtitle: `${formatNumber(data.activeCompanies)} active companies`,
      icon: <BusinessRoundedIcon fontSize="small" />,
      accent: 'primary' as const,
    },
    {
      key: 'users',
      title: 'User access',
      value: formatNumber(data.usersTotal),
      subtitle: `${formatNumber(activeUsers)} active · ${formatNumber(inactiveUsers)} inactive`,
      icon: <GroupsRoundedIcon fontSize="small" />,
      accent: inactiveUsers > 0 ? ('warning' as const) : ('success' as const),
    },
    {
      key: 'audit',
      title: 'Audit trail',
      value: formatNumber(data.changeHistoryTotal),
      subtitle: `${formatNumber(data.activityLogsTotal)} activity logs`,
      icon: <HistoryRoundedIcon fontSize="small" />,
      accent: 'info' as const,
    },
    {
      key: 'alerts',
      title: 'System alerts',
      value: formatNumber(systemAlerts),
      subtitle: systemAlerts > 0 ? 'Requires review' : 'No active dashboard alerts',
      icon: <WarningAmberRoundedIcon fontSize="small" />,
      accent: systemAlerts > 0 ? ('error' as const) : ('success' as const),
    },
  ];

  const latestActivity = data.recentActivities[0];

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {cards.map((card) => (
          <StatCard
            key={card.key}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            accent={card.accent}
          />
        ))}
      </Box>

      <DashboardAlerts alerts={data.alerts} />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' },
        }}
      >
        <SectionCard
          title="System governance"
          description="Overlord dashboard is limited to platform ownership, access control and audit health. Operational warehouse and transport metrics remain inside role-specific workspaces."
        >
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${formatNumber(data.companiesTotal)} companies`} variant="outlined" />
              <Chip label={`${formatNumber(data.activeCompanies)} active`} color="success" variant="outlined" />
              <Chip label={`${formatNumber(data.usersTotal)} users`} variant="outlined" />
              <Chip
                label={`${formatNumber(inactiveUsers)} inactive users`}
                color={inactiveUsers > 0 ? 'warning' : 'success'}
                variant="outlined"
              />
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="body2">
                Companies are the primary Overlord scope. Use this dashboard to detect platform-level setup, access and audit issues.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inventory, transport, fleet and warehouse totals are intentionally not repeated here because they belong to company and operational roles.
              </Typography>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard
          title="Access and audit snapshot"
          description="Compact control view for users, activity logs and entity change history."
        >
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: 'grid',
                gap: 1.25,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 800 }}>
                  Active users
                </Typography>
                <Typography variant="h6">{formatNumber(activeUsers)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 800 }}>
                  Activity logs
                </Typography>
                <Typography variant="h6">{formatNumber(data.activityLogsTotal)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 800 }}>
                  Change history
                </Typography>
                <Typography variant="h6">{formatNumber(data.changeHistoryTotal)}</Typography>
              </Box>
            </Box>

            <Divider />

            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <SecurityRoundedIcon color="primary" fontSize="small" />
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">Latest audited activity</Typography>
                {latestActivity ? (
                  <>
                    <Typography variant="body2">
                      {latestActivity.action} · {latestActivity.entityName} #{latestActivity.entityId ?? '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {latestActivity.description ?? latestActivity.entityIdentifier ?? 'No description'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {latestActivity.userEmail ?? 'system'} · {formatDateTime(latestActivity.createdAt)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent activity.
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard title="Recent system activity" description="Last platform audit entries for Overlord review.">
        <Stack spacing={1.25}>
          {data.recentActivities.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No recent activity.
            </Typography>
          ) : (
            data.recentActivities.slice(0, 5).map((activity) => (
              <Box
                key={activity.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2">
                      {activity.action} · {activity.entityName} #{activity.entityId ?? '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.description ?? activity.entityIdentifier ?? 'No description'}
                    </Typography>
                  </Stack>

                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {formatDateTime(activity.createdAt)}
                  </Typography>
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  {activity.userEmail ?? 'system'}
                </Typography>
              </Box>
            ))
          )}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
