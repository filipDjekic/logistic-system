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
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import logoMini from '../../assets/images/logo.png';
import { appEnv } from '../../core/config/env';

const featureCards = [
  { title: 'Fleet and transport', description: 'Track vehicles, drivers, transport orders, and execution status.', icon: LocalShippingRoundedIcon },
  { title: 'Warehouses and inventory', description: 'Manage warehouses, products, stock levels, and stock movements.', icon: WarehouseRoundedIcon },
  { title: 'Tasks and operations', description: 'Assign loading, unloading, warehouse, and transport-related work.', icon: TaskAltRoundedIcon },
  { title: 'Employees and access', description: 'Control employee records, roles, shifts, and secured system access.', icon: Groups2RoundedIcon },
];

const requestSteps = [
  { title: 'Submit request', description: 'Enter company, location and administrator data.', icon: AssignmentTurnedInRoundedIcon },
  { title: 'Overlord review', description: 'The request is checked before a workspace is created.', icon: RateReviewRoundedIcon },
  { title: 'Workspace activation', description: 'After approval, the company and admin account become active.', icon: VerifiedUserRoundedIcon },
];

function HeroVisual() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: 320, md: 420 },
        borderRadius: 2.5,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.light, 0.24)}, transparent 30%), radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.light, 0.16)}, transparent 32%), linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.default, 0.98)})`,
        boxShadow: theme.shadows[3],
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${alpha(theme.palette.divider, 0.36)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.divider, 0.36)} 1px, transparent 1px)`, backgroundSize: '30px 30px', opacity: 0.25 }} />
      <Paper elevation={0} sx={{ position: 'absolute', top: { xs: 18, md: 28 }, left: { xs: 18, md: 28 }, right: { xs: 18, md: 28 }, p: { xs: 2, md: 2.5 }, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.background.paper, 0.9), backdropFilter: 'blur(10px)' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', flexShrink: 0 }}><Inventory2RoundedIcon /></Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Logistics operations hub</Typography>
            <Typography variant="body2" color="text.secondary">Central overview of daily logistics resources and work.</Typography>
          </Box>
        </Stack>
      </Paper>
      <Stack spacing={1.5} sx={{ position: 'absolute', left: { xs: 18, md: 36 }, right: { xs: 18, md: 36 }, bottom: { xs: 18, md: 30 } }}>
        {featureCards.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <Paper key={item.title} elevation={0} sx={{ p: 1.5, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.background.paper, 0.88), backdropFilter: 'blur(10px)' }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box sx={{ width: 38, height: 38, borderRadius: 1.25, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', flexShrink: 0 }}><Icon fontSize="small" /></Box>
                <Box><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.description}</Typography></Box>
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
    <Box sx={{ minHeight: '100vh', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, backgroundColor: 'background.default' }}>
      <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
        <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: { xs: 2, md: 2.5 }, border: `1px solid ${theme.palette.divider}`, backgroundColor: 'background.paper', boxShadow: theme.shadows[2] }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: { xs: 2, md: 3 }, py: 1.75, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box component="img" src={logoMini} alt={`${appEnv.appName} logo`} sx={{ width: 36, height: 36, objectFit: 'contain' }} />
              <Box><Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{appEnv.appName}</Typography><Typography variant="caption" color="text.secondary">Logistics management system</Typography></Box>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
               <Button component={RouterLink} to="/login" variant="outlined">Login</Button>
                <Button component={RouterLink} to="/register-company" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />}>Register company</Button>
            </Stack>
          </Stack>

          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 6 } }}>
            <Grid container spacing={{ xs: 4, md: 5 }} alignItems="center">
              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="h2" sx={{ maxWidth: 620, mb: 2, fontSize: { xs: '2.35rem', md: '3.4rem' }, fontWeight: 850, letterSpacing: '-0.04em' }}>One system for logistics control</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>Manage vehicles, warehouses, inventory, employees, tasks, and transport operations from a single secured platform.</Typography>
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Button component={RouterLink} to="/register-company" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />}>Register company</Button>
                  </Stack>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, lg: 7 }}><HeroVisual /></Grid>
            </Grid>
          </Box>

          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 5 }, bgcolor: alpha(theme.palette.primary.main, 0.03), borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stack spacing={1.25} sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>How company registration works</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>A company is not created directly from the public page. A request is submitted first, then reviewed and approved by the platform owner.</Typography>
            </Stack>
            <Grid container spacing={2}>
              {requestSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 2.5, height: '100%', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                      <Stack spacing={2}>
                        <Box sx={{ width: 50, height: 50, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}><Icon /></Box>
                        <Box><Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.description}</Typography></Box>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 5 } }}>
            <Stack spacing={1.25} sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>Core modules</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>The system covers the main logistics workflow: resources, stock, employees, transport execution, task assignment, and operational tracking.</Typography>
            </Stack>
            <Grid container spacing={2}>
              {featureCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Grid key={item.title} size={{ xs: 12, sm: 6, xl: 3 }}>
                    <Paper elevation={0} sx={{ p: 2.5, height: '100%', borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                      <Stack spacing={2}>
                        <Box sx={{ width: 50, height: 50, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}><Icon /></Box>
                        <Box><Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.description}</Typography></Box>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <Box component="footer" sx={{ px: { xs: 2, md: 3 }, py: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.text.primary, 0.025) }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography fontWeight={800}>Filip Software Solutions d.o.o.</Typography>
                <Typography variant="body2" color="text.secondary">Kod kuce, 35000 Jagodina, Serbia · e14filipdjekic@gmail.com · +381 35 240 0000</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="body2" color="text.secondary" textAlign={{ xs: 'left', md: 'right' }}>Platform owner for logistics workspace onboarding, access control and operational management.</Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
