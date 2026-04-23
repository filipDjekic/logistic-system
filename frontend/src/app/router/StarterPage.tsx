import {
  alpha,
  Box,
  Button,
  Chip,
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
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import logoMini from '../../assets/images/logo.png';
import { appEnv } from '../../core/config/env';

const featureCards = [
  {
    title: 'Fleet and transport',
    description:
      'Monitor vehicle availability, transport execution, and delivery flow from one interface.',
    icon: LocalShippingRoundedIcon,
  },
  {
    title: 'Warehouses and inventory',
    description:
      'Keep stock visibility, warehouse structure, and movement history organized and searchable.',
    icon: WarehouseRoundedIcon,
  },
  {
    title: 'Operational tasks',
    description:
      'Assign and track loading, unloading, and warehouse work with clearer execution status.',
    icon: TaskAltRoundedIcon,
  },
  {
    title: 'Employees and roles',
    description:
      'Support structured access, employee records, and role-based work across the platform.',
    icon: Groups2RoundedIcon,
  },
];

const quickStats = [
  { value: '24/7', label: 'Operational visibility' },
  { value: '1', label: 'Centralized platform' },
  { value: 'Role-based', label: 'Secure access model' },
  { value: 'Live', label: 'Process overview' },
];

const processSteps = [
  {
    step: '01',
    title: 'Plan',
    description: 'Define resources, warehouses, products, and transport structure.',
  },
  {
    step: '02',
    title: 'Execute',
    description: 'Coordinate transport orders, assign employees, and run tasks.',
  },
  {
    step: '03',
    title: 'Track',
    description: 'Follow inventory, activity history, and operational status changes.',
  },
  {
    step: '04',
    title: 'Improve',
    description: 'Review dashboard metrics and optimize daily logistics work.',
  },
];

const moduleHighlights = [
  'Vehicles',
  'Warehouses',
  'Inventory',
  'Products',
  'Transport orders',
  'Tasks',
  'Employees',
  'Notifications',
  'Activity logs',
  'Change history',
];

function HeroVisual() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 320, md: 420 },
        borderRadius: 6,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
        background: theme.palette.mode === 'dark'
          ? `
            radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.26)}, transparent 28%),
            radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.22)}, transparent 30%),
            linear-gradient(180deg, ${alpha('#0F172A', 0.96)}, ${alpha('#0B1220', 0.98)})
          `
          : `
            radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.20)}, transparent 28%),
            radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.18)}, transparent 30%),
            linear-gradient(180deg, #FFFFFF, #F4F7FC)
          `,
        boxShadow: theme.shadows[3],
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${alpha(theme.palette.divider, 0.4)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.divider, 0.4)} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          opacity: 0.32,
        }}
      />

      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          top: { xs: 20, md: 28 },
          left: { xs: 20, md: 28 },
          right: { xs: 20, md: 120 },
          p: 2.25,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.86),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.75 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 3,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <AnalyticsRoundedIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Operations overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unified visibility across logistics modules
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={1.5}>
          {quickStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.background.default, 0.6),
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.25 }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          left: { xs: 20, md: 56 },
          right: { xs: 20, md: 180 },
          bottom: { xs: 20, md: 32 },
          p: 2,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Grid container spacing={1.5}>
          {[
            {
              title: 'Warehouse capacity',
              value: 'Mapped and structured',
              icon: WarehouseRoundedIcon,
            },
            {
              title: 'Transport flow',
              value: 'Assigned and monitored',
              icon: LocalShippingRoundedIcon,
            },
            {
              title: 'Task execution',
              value: 'Operationally aligned',
              icon: TaskAltRoundedIcon,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="flex-start"
                  sx={{
                    p: 1.25,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: 'primary.main',
                      flexShrink: 0,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.value}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Box
        sx={{
          position: 'absolute',
          top: { xs: 26, md: 34 },
          right: { xs: 20, md: 28 },
          width: { xs: 72, md: 88 },
          height: { xs: 72, md: 88 },
          borderRadius: '28px',
          display: { xs: 'none', md: 'grid' },
          placeItems: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: 'primary.main',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        }}
      >
        <Inventory2RoundedIcon sx={{ fontSize: 40 }} />
      </Box>
    </Box>
  );
}

export default function StarterPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        backgroundColor: 'background.default',
      }}
    >
      <Box sx={{ maxWidth: 1240, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: { xs: 4, md: 6 },
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
            boxShadow: theme.shadows[2],
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: { xs: 2, md: 3.5 },
              py: 1.75,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                component="img"
                src={logoMini}
                alt={`${appEnv.appName} logo`}
                sx={{
                  width: 36,
                  height: 36,
                  objectFit: 'contain',
                }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  {appEnv.appName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Logistics management platform
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component={RouterLink}
                to="/login"
                color="inherit"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Log in
              </Button>

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Open platform
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              px: { xs: 2, md: 3.5 },
              py: 1.25,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Centralized control over vehicles, warehouses, inventory, employees, and transport operations.
              </Typography>

              <Chip
                icon={<ShieldRoundedIcon />}
                label="JWT authentication and role-based access"
                color="primary"
                variant="outlined"
                sx={{ bgcolor: alpha(theme.palette.background.paper, 0.7) }}
              />
            </Stack>
          </Box>

          <Box sx={{ px: { xs: 2, md: 3.5 }, py: { xs: 4, md: 6 } }}>
            <Grid container spacing={{ xs: 4, md: 5 }} alignItems="center">
              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={3}>
                  <Chip
                    label="Logistics system"
                    color="primary"
                    sx={{ alignSelf: 'flex-start' }}
                  />

                  <Box>
                    <Typography
                      variant="h2"
                      sx={{
                        maxWidth: 620,
                        mb: 2,
                        fontSize: { xs: '2.5rem', md: '3.6rem' },
                      }}
                    >
                      One interface for daily logistics control
                    </Typography>

                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ maxWidth: 560 }}
                    >
                      Organize operational data, monitor transport flow, manage warehouse activity,
                      and keep teams aligned through a cleaner workflow across the full system.
                    </Typography>
                  </Box>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                  >
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardRoundedIcon />}
                    >
                      Go to login
                    </Button>

                    <Typography variant="body2" color="text.secondary">
                      Access is controlled through existing user accounts and assigned roles.
                    </Typography>
                  </Stack>

                  <Grid container spacing={1.5}>
                    {quickStats.map((item) => (
                      <Grid key={item.label} size={{ xs: 6, md: 3 }}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.75,
                            borderRadius: 3.5,
                            border: `1px solid ${theme.palette.divider}`,
                            height: '100%',
                          }}
                        >
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            {item.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 7 }}>
                <HeroVisual />
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              px: { xs: 2, md: 3.5 },
              py: { xs: 4, md: 5 },
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              borderTop: `1px solid ${theme.palette.divider}`,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack spacing={1.25} sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Core modules
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
                The starter page now looks like an actual product entry point instead of a placeholder.
                It presents the real system scope and keeps the page visually aligned with the rest of the app.
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              {featureCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Grid key={item.title} size={{ xs: 12, sm: 6, xl: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        height: '100%',
                        borderRadius: 4,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                          }}
                        >
                          <Icon />
                        </Box>

                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <Box sx={{ px: { xs: 2, md: 3.5 }, py: { xs: 4, md: 5 } }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.25, md: 3 },
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%',
                  }}
                >
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                        Operational flow
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Present the product as a structured workflow, not a generic landing page.
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      {processSteps.map((item) => (
                        <Grid key={item.step} size={{ xs: 12, md: 6 }}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 3.5,
                              border: `1px solid ${theme.palette.divider}`,
                              height: '100%',
                            }}
                          >
                            <Typography
                              variant="overline"
                              sx={{
                                color: 'primary.main',
                                fontWeight: 800,
                                letterSpacing: '0.12em',
                              }}
                            >
                              Step {item.step}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.75 }}>
                              {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.25, md: 3 },
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%',
                  }}
                >
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                        Included modules
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        The page reflects the actual product domain instead of empty placeholders.
                      </Typography>
                    </Box>

                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {moduleHighlights.map((item) => (
                        <Chip
                          key={item}
                          label={item}
                          variant="outlined"
                          sx={{ borderRadius: 999 }}
                        />
                      ))}
                    </Stack>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3.5,
                        bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.14)}`,
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2.5,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha(theme.palette.secondary.main, 0.14),
                            color: 'secondary.main',
                            flexShrink: 0,
                          }}
                        >
                          <AnalyticsRoundedIcon />
                        </Box>

                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                            Built for oversight and execution
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Useful both for administrative control and day-to-day operational work.
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              px: { xs: 2, md: 3.5 },
              py: { xs: 3, md: 4 },
              borderTop: `1px solid ${theme.palette.divider}`,
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)}, transparent)`
                : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Access the platform
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use your existing account to continue into the logistics system.
                </Typography>
              </Box>

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Sign in
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}