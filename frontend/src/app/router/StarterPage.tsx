import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link as RouterLink } from 'react-router-dom';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ImportExportRoundedIcon from '@mui/icons-material/ImportExportRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import logoMini from '../../assets/images/logo.png';
import { appEnv } from '../../core/config/env';

const featureCards = [
  {
    title: 'Fleet and transport',
    description: 'Plan and follow vehicles, drivers, transport routes, cargo execution, and current operational status.',
    icon: LocalShippingRoundedIcon,
    details: ['Vehicles', 'Drivers', 'Transport orders', 'Availability'],
  },
  {
    title: 'Warehouses and inventory',
    description: 'Control warehouses, zones, products, stock levels, warehouse capacity, and every stock movement.',
    icon: WarehouseRoundedIcon,
    details: ['Warehouses', 'Zones', 'Products', 'Stock movements'],
  },
  {
    title: 'Tasks and operations',
    description: 'Assign loading, unloading, warehouse preparation, transport support, and operational follow-up work.',
    icon: TaskAltRoundedIcon,
    details: ['Assignments', 'Priorities', 'Statuses', 'Operational work'],
  },
  {
    title: 'Employees and access',
    description: 'Manage employee records, positions, shifts, user accounts, secured permissions, and role-based access.',
    icon: Groups2RoundedIcon,
    details: ['Employees', 'Shifts', 'Roles', 'Permissions'],
  },
];

const requestSteps = [
  { title: 'Submit request', description: 'Enter company, location, contact, and initial administrator data.', icon: AssignmentTurnedInRoundedIcon },
  { title: 'Owner review', description: 'The platform owner verifies the request before creating a workspace.', icon: RateReviewRoundedIcon },
  { title: 'Workspace activation', description: 'After approval, the company and administrator account become active.', icon: VerifiedUserRoundedIcon },
];

const heroBenefits = [
  'Centralized logistics management',
  'Real-time operational visibility',
  'Role-based secured access',
  'Inventory and transport lifecycle tracking',
];

const platformHighlights = [
  { title: 'JWT security', description: 'Protected access and role permissions for every workspace.', icon: SecurityRoundedIcon },
  { title: 'Live notifications', description: 'Operational changes are surfaced without manual page hunting.', icon: NotificationsActiveRoundedIcon },
  { title: 'Audit history', description: 'Important status and stock changes remain traceable.', icon: HistoryRoundedIcon },
  { title: 'CSV import/export', description: 'Bulk data entry and reporting workflows are supported.', icon: ImportExportRoundedIcon },
  { title: 'Operational analytics', description: 'Dashboards summarize fleet, stock, task, and transport activity.', icon: InsightsRoundedIcon },
];

const previewStats = [
  { label: 'Vehicles online', value: '84%', progress: 84 },
  { label: 'Warehouse capacity', value: '68%', progress: 68 },
  { label: 'Tasks completed', value: '42/57', progress: 74 },
];

const recentActivity = [
  'Transport assigned to available driver',
  'Stock movement recorded in main warehouse',
  'Vehicle status changed to active',
  'Loading task marked as completed',
];

function HeroVisual() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 520, md: 520 },
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.26)}, transparent 31%), radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.16)}, transparent 34%), linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.default, 0.98)})`,
        boxShadow: theme.shadows[3],
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${alpha(theme.palette.divider, 0.36)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.divider, 0.36)} 1px, transparent 1px)`, backgroundSize: '30px 30px', opacity: 0.24 }} />
      <Paper elevation={0} sx={{ position: 'absolute', top: { xs: 18, md: 28 }, left: { xs: 18, md: 28 }, right: { xs: 18, md: 28 }, p: { xs: 2, md: 2.5 }, borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.background.paper, 0.9), backdropFilter: 'blur(10px)' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 2.25 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 46, height: 46, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', flexShrink: 0 }}><Inventory2RoundedIcon /></Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>Today&apos;s operations</Typography>
              <Typography variant="body2" color="text.secondary">Live overview for resources, work, and execution.</Typography>
            </Box>
          </Stack>
          <Chip label="Live" color="success" size="small" />
        </Stack>

        <Grid container spacing={1.5}>
          {previewStats.map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.default, 0.56) }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 850, my: 0.5 }}>{item.value}</Typography>
                <LinearProgress variant="determinate" value={item.progress} sx={{ height: 6, borderRadius: 99 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ position: 'absolute', top: { xs: 268, sm: 222, md: 230 }, left: { xs: 18, md: 36 }, width: { xs: 'calc(100% - 36px)', md: 310 }, p: 2, borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.background.paper, 0.9), backdropFilter: 'blur(10px)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 1.5 }}>Recent activity</Typography>
        <Stack spacing={1.1}>
          {recentActivity.map((activity) => (
            <Stack key={activity} direction="row" spacing={1} alignItems="flex-start">
              <CheckCircleRoundedIcon color="success" sx={{ fontSize: 18, mt: 0.15 }} />
              <Typography variant="body2" color="text.secondary">{activity}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ position: 'absolute', right: { xs: 18, md: 36 }, bottom: { xs: 18, md: 30 }, width: { xs: 'calc(100% - 36px)', md: 330 }, p: 2, borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.background.paper, 0.9), backdropFilter: 'blur(10px)' }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 1.25, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', flexShrink: 0 }}><LocalShippingRoundedIcon fontSize="small" /></Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>Active transport</Typography>
            <Typography variant="caption" color="text.secondary">Warehouse A → Distribution center</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Grid container spacing={1.5}>
          {[
            ['Driver', 'Assigned'],
            ['Vehicle', 'Available'],
            ['Cargo', 'Prepared'],
            ['Status', 'In progress'],
          ].map(([label, value]) => (
            <Grid key={label} size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{value}</Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}

export default function StarterPage() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, backgroundColor: 'background.default' }}>
      <Box sx={{ maxWidth: 1380, mx: 'auto' }}>
        <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: { xs: 2, md: 3 }, border: `1px solid ${theme.palette.divider}`, backgroundColor: 'background.paper', boxShadow: theme.shadows[2] }}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" spacing={2} sx={{ px: { xs: 2, md: 3 }, py: 1.75, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box component="img" src={logoMini} alt={`${appEnv.appName} logo`} sx={{ width: 38, height: 38, objectFit: 'contain' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 850, lineHeight: 1.1 }}>{appEnv.appName}</Typography>
                <Typography variant="caption" color="text.secondary">Logistics management platform</Typography>
              </Box>
            </Stack>
          </Stack>

          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 7 } }}>
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="h2" sx={{ maxWidth: 660, mb: 2, fontSize: { xs: '2.35rem', md: '3.55rem' }, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1.02 }}>One secured system for logistics control</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 570, fontSize: '1.05rem' }}>Manage vehicles, warehouses, inventory, employees, shifts, tasks, and transport operations from one operational workspace.</Typography>
                  </Box>

                  <Stack spacing={1.15}>
                    {heroBenefits.map((benefit) => (
                      <Stack key={benefit} direction="row" spacing={1} alignItems="center">
                        <CheckCircleRoundedIcon color="success" sx={{ fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{benefit}</Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Button component={RouterLink} to="/register-company" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />}>Register company</Button>
                    <Button component={RouterLink} to="/login" variant="outlined" size="large">Login</Button>
                  </Stack>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, lg: 7 }}><HeroVisual /></Grid>
            </Grid>
          </Box>

          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 5 }, bgcolor: alpha(theme.palette.primary.main, 0.035), borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={2}>
              {platformHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <Grid key={item.title} size={{ xs: 12, sm: 6, lg: 2.4 }}>
                    <Paper elevation={0} sx={{ p: 2.25, height: '100%', borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
                      <Stack spacing={1.5}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}><Icon /></Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 0.5 }}>{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 5 } }}>
            <Stack spacing={1.25} sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 850 }}>Core modules</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 820 }}>The system covers the main logistics workflow: resources, stock, employees, transport execution, task assignment, secured access, and operational tracking.</Typography>
            </Stack>
            <Grid container spacing={2}>
              {featureCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Grid key={item.title} size={{ xs: 12, sm: 6, xl: 3 }}>
                    <Paper elevation={0} sx={{ p: 2.5, height: '100%', borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, transition: theme.transitions.create(['transform', 'box-shadow', 'border-color']), '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[4], borderColor: alpha(theme.palette.primary.main, 0.32) } }}>
                      <Stack spacing={2}>
                        <Box sx={{ width: 50, height: 50, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}><Icon /></Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>{item.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                        </Box>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {item.details.map((detail) => <Chip key={detail} label={detail} size="small" variant="outlined" />)}
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 5 }, bgcolor: alpha(theme.palette.primary.main, 0.03), borderTop: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={1.25}>
                  <Typography variant="h4" sx={{ fontWeight: 850 }}>Controlled company onboarding</Typography>
                  <Typography variant="body1" color="text.secondary">A company is not created directly from the public page. Each request is reviewed first to keep workspace creation controlled and prevent unauthorized access.</Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Grid container spacing={2}>
                  {requestSteps.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Grid key={item.title} size={{ xs: 12, sm: 4 }}>
                        <Paper elevation={0} sx={{ p: 2.5, height: '100%', borderRadius: 2.5, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
                          <Stack spacing={2}>
                            <Box sx={{ width: 50, height: 50, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}><Icon /></Box>
                            <Box><Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 1 }}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.description}</Typography></Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            </Grid>
          </Box>

          <Box component="footer" sx={{ px: { xs: 2, md: 3 }, py: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.text.primary, 0.025) }}>
            <Grid container spacing={3} alignItems="flex-start">
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography fontWeight={850}>Software Solutions d.o.o.</Typography>
                <Typography variant="body2" color="text.secondary">Enterprise logistics platform for controlled workspaces, operational resources, and access management.</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 1 }}>Product</Typography>
                <Typography variant="body2" color="text.secondary">Features · Login · Register company</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 1 }}>Contact</Typography>
                <Typography variant="body2" color="text.secondary">Kod kuce, 35000 Jagodina, Serbia · e14filipdjekic@gmail.com · +381 35 240 0000</Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
