import type { PropsWithChildren, ReactNode } from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';

const cardContentPadding = { xs: 1.5, sm: 2, md: 2.5 };

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
          <CardContent sx={{ p: cardContentPadding, pb: { xs: 1.5, md: 2 } }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
            >
              <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                {title ? <Typography variant="h6">{title}</Typography> : null}
                {description ? (
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                    {description}
                  </Typography>
                ) : null}
              </Stack>

              {action ? (
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ width: { xs: '100%', sm: 'auto' }, '& > *': { width: { xs: '100%', sm: 'auto' } } }}
                >
                  {action}
                </Stack>
              ) : null}
            </Stack>
          </CardContent>

          <Divider />
        </>
      ) : null}

      <CardContent sx={{ p: cardContentPadding, '&:last-child': { pb: cardContentPadding }, ...contentSx }}>{children}</CardContent>
    </Card>
  );
}
