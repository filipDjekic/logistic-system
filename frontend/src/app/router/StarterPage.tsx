import {
  alpha,
  Box,
  Button,
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
import logoMini from '../../assets/images/logo.png';
import { appEnv } from '../../core/config/env';

const featureCards = [
  {
    title: 'Fleet and transport',
    description: 'Track vehicles, drivers, transport orders, and execution status.',
    icon: LocalShippingRoundedIcon,
  },
  {
    title: 'Warehouses and inventory',
    description: 'Manage warehouses, products, stock levels, and stock movements.',
    icon: WarehouseRoundedIcon,
  },
  {
    title: 'Tasks and operations',
    description: 'Assign loading, unloading, warehouse, and transport-related work.',
    icon: TaskAltRoundedIcon,
  },
  {
    title: 'Employees and access',
    description: 'Control employee records, roles, shifts, and secured system access.',
    icon: Groups2RoundedIcon,
  },
];

function HeroVisual() {
  const theme = useTheme();

  const statusCards = [
    {
      title: 'Transport control',
      value: 'Orders, vehicles, drivers',
      icon: LocalShippingRoundedIcon,
    },
    {
      title: 'Warehouse visibility',
      value: 'Stock, products, movements',
      icon: WarehouseRoundedIcon,
    },
    {
      title: 'Task execution',
      value: 'Assigned operational work',
      icon: TaskAltRoundedIcon,
    },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 300, md: 390 },
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
        background:
          theme.palette.mode === 'dark'
            ? `
              radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.24)}, transparent 30%),
              radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.16)}, transparent 32%),
              linear-gradient(180deg, ${alpha('#111827', 0.98)}, ${alpha('#020617', 0.98)})
            `
            : `
              radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.18)}, transparent 30%),
              radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.14)}, transparent 32%),
              linear-gradient(180deg, #FFFFFF, #F6F8FC)
            `,
        boxShadow: theme.shadows[3],
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${alpha(theme.palette.divider, 0.36)} 1px, transparent 1px),
            linear-gradient(90deg, ${alpha(theme.palette.divider, 0.36)} 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          opacity: 0.28,
        }}
      />

      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          top: { xs: 18, md: 28 },
          left: { xs: 18, md: 28 },
          right: { xs: 18, md: 28 },
          p: { xs: 2, md: 2.5 },
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Inventory2RoundedIcon />
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Logistics operations hub
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Central overview of daily logistics resources and work.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Stack
        spacing={1.5}
        sx={{
          position: 'absolute',
          left: { xs: 18, md: 36 },
          right: { xs: 18, md: 36 },
          bottom: { xs: 18, md: 30 },
        }}
      >
        {statusCards.map((item) => {
          const Icon = item.icon;

          return (
            <Paper
              key={item.title}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.88),
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 1.25,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
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
            </Paper>
          );
        })}
      </Stack>
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
      <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: { xs: 2, md: 2.5 },
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
              px: { xs: 2, md: 3 },
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
                  Logistics management system
                </Typography>
              </Box>
            </Stack>

            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              Sign in
            </Button>
          </Stack>

          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 6 } }}>
            <Grid container spacing={{ xs: 4, md: 5 }} alignItems="center">
              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={6}>

                  <Box>
                    <Typography
                      variant="h2"
                      sx={{
                        maxWidth: 620,
                        mb: 2,
                        fontSize: { xs: '2.35rem', md: '3.4rem' },
                        fontWeight: 850,
                        letterSpacing: '-0.04em',
                      }}
                    >
                      One system for logistics control
                    </Typography>

                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ maxWidth: 560 }}
                    >
                      Manage vehicles, warehouses, inventory, employees, tasks, and
                      transport operations from a single secured platform.
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
                      Open platform
                    </Button>

                    <Typography variant="body2" color="text.secondary">
                      Access depends on the assigned user role.
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 7 }}>
                <HeroVisual />
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              px: { xs: 2, md: 3 },
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
                The system covers the main logistics workflow: resources, stock,
                employees, transport execution, task assignment, and operational tracking.
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
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Stack spacing={2}>
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1.5,
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

          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 5 } }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.25, md: 3 },
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%',
                  }}
                >
                  <Stack spacing={2}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      Platform scope
                    </Typography>

                    <Typography variant="body1" color="text.secondary">
                      The application is designed for controlled logistics management,
                      with data organized around companies, employees, resources, and
                      daily operational processes.
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.25, md: 3 },
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%',
                    bgcolor: alpha(theme.palette.secondary.main, 0.07),
                  }}
                >
                  <Stack spacing={1.5}>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      Secure access
                    </Typography>

                    <Typography variant="body1" color="text.secondary">
                      Users enter the system through authenticated accounts. Available
                      actions are limited by role and company scope.
                    </Typography>

                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardRoundedIcon />}
                      sx={{ alignSelf: 'flex-start', mt: 1 }}
                    >
                      Continue to login
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}