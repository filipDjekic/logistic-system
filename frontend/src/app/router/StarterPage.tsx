import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link as RouterLink } from 'react-router-dom';
import logoMini from '../../assets/images/logo.png';
import { appEnv } from '../../core/config/env';

const features = [
  {
    title: 'Fleet overview',
    description:
      'Track vehicles, availability, and operational status from one place.',
    imageAlt: 'Placeholder for fleet management icon',
  },
  {
    title: 'Warehouse control',
    description:
      'Keep warehouse structure, stock visibility, and inventory flow organized.',
    imageAlt: 'Placeholder for warehouse and inventory icon',
  },
  {
    title: 'Transport coordination',
    description:
      'Support planning, assignment, and monitoring of transport operations.',
    imageAlt: 'Placeholder for transport operations icon',
  },
  {
    title: 'Task execution',
    description:
      'Assign operational tasks and follow employee execution more clearly.',
    imageAlt: 'Placeholder for task management icon',
  },
];

const showcaseItems = [
  'Placeholder for dashboard preview card',
  'Placeholder for transport module preview card',
  'Placeholder for warehouse module preview card',
  'Placeholder for notifications or analytics preview card',
];

function ImagePlaceholder({
  alt,
  height,
}: {
  alt: string;
  height: number | { xs: number; md: number };
}) {
  return (
    <Box
      role="img"
      aria-label={alt}
      sx={{
        width: '100%',
        height,
        borderRadius: 2,
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        backgroundColor: 'action.hover',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {alt}
      </Typography>
    </Box>
  );
}

export default function StarterPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        py: { xs: 2, md: 3 },
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: 'background.paper',
          }}
        >
          {/* TOP BAR */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: { xs: 2, md: 3 },
              py: 1.5,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                component="img"
                src={logoMini}
                alt={`${appEnv.appName} logo`}
                sx={{
                  width: 28,
                  height: 28,
                  objectFit: 'contain',
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
                {appEnv.appName}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component={RouterLink}
                to="/login"
                color="inherit"
                sx={{ textTransform: 'none' }}
              >
                Log in
              </Button>

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                sx={{ textTransform: 'none' }}
              >
                Start here
              </Button>
            </Stack>
          </Stack>

          {/* ANNOUNCEMENT BAR */}
          <Box
            sx={{
              px: 2,
              py: 1,
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Centralized logistics workflow management for vehicles, warehouses,
              transport, and operational tasks.
            </Typography>
          </Box>

          {/* HERO */}
          <Box
            sx={{
              px: { xs: 2, md: 4 },
              py: { xs: 4, md: 6 },
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)',
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2.5}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.1,
                      maxWidth: 420,
                    }}
                  >
                    Manage logistics operations more clearly
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: 460 }}
                  >
                    One platform for fleet visibility, warehouse organization,
                    inventory tracking, transport coordination, employee tasks,
                    and operational monitoring.
                  </Typography>

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      component={RouterLink}
                      to="/login"
                      variant="contained"
                      size="large"
                      sx={{ textTransform: 'none' }}
                    >
                      Go to login
                    </Button>
                  </Stack>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <ImagePlaceholder
                  alt="Placeholder for hero illustration showing logistics platform visual"
                  height={{ xs: 260, md: 340 }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* FEATURES */}
          <Box
            sx={{
              px: { xs: 2, md: 4 },
              py: { xs: 4, md: 5 },
              backgroundColor: 'background.paper',
            }}
          >
            <Grid container spacing={2.5}>
              {features.map((feature) => (
                <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Stack
                    spacing={2}
                    alignItems="center"
                    textAlign="center"
                    sx={{ height: '100%' }}
                  >
                    <Box sx={{ width: '100%', maxWidth: 88 }}>
                      <ImagePlaceholder alt={feature.imageAlt} height={72} />
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {feature.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* SHOWCASE SECTION */}
          <Box
            sx={{
              px: { xs: 2, md: 4 },
              py: { xs: 4, md: 5 },
              bgcolor: 'secondary.main',
              color: 'secondary.contrastText',
            }}
          >
            <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Built for everyday logistics work
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  maxWidth: 720,
                  opacity: 0.9,
                }}
              >
                Use one consistent system to organize operational data, reduce manual
                coordination, and keep teams aligned across transport and warehouse flows.
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              {showcaseItems.map((altText) => (
                <Grid key={altText} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Box
                      role="img"
                      aria-label={altText}
                      sx={{
                        width: '100%',
                        height: 140,
                        borderRadius: 2,
                        border: '1px dashed rgba(255,255,255,0.35)',
                        display: 'grid',
                        placeItems: 'center',
                        textAlign: 'center',
                        px: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {altText}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* CONTACT + CTA */}
          <Box
            sx={{
              px: { xs: 2, md: 4 },
              py: { xs: 4, md: 5 },
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={1}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Need access to the platform?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contact the provider or sign in with your existing account.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: contact@logistics-system.local
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: +381 11 400 500
                  </Typography>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row', md: 'column' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', md: 'flex-end' }}
                >
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="contained"
                    size="large"
                    sx={{ textTransform: 'none', minWidth: 180 }}
                  >
                    Sign in
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}