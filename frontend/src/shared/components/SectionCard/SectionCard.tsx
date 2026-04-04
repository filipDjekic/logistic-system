import type { PropsWithChildren, ReactNode } from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';

type SectionCardProps = PropsWithChildren<{
  title?: string;
  description?: string;
  action?: ReactNode;
  contentSx?: object;
}>;

export default function SectionCard({
  title,
  description,
  action,
  children,
  contentSx,
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <Card>
      {hasHeader ? (
        <>
          <CardContent sx={{ pb: 2 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
            >
              <Stack spacing={0.5}>
                {title ? <Typography variant="h6">{title}</Typography> : null}
                {description ? (
                  <Typography variant="body2" color="text.secondary">
                    {description}
                  </Typography>
                ) : null}
              </Stack>

              {action ? <Stack direction="row" spacing={1}>{action}</Stack> : null}
            </Stack>
          </CardContent>

          <Divider />
        </>
      ) : null}

      <CardContent sx={{ ...contentSx }}>{children}</CardContent>
    </Card>
  );
}