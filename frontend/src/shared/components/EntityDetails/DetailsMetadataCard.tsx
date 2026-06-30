import type { ReactNode } from 'react';
import { Grid } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import SectionCard from '../SectionCard/SectionCard';
import DetailsField from './DetailsField';
import type { DetailsFieldProps } from './DetailsField';

type DetailsMetadataField = DetailsFieldProps & {
  key?: string;
  size?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
};

type DetailsMetadataCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  fields?: DetailsMetadataField[];
  children?: ReactNode;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  sx?: SxProps<Theme>;
};

const defaultColumns = { xs: 12, sm: 6, md: 3 };

export default function DetailsMetadataCard({
  title = 'Metadata',
  description = 'System ownership and audit metadata for this record.',
  action,
  fields,
  children,
  columns = defaultColumns,
  sx,
}: DetailsMetadataCardProps) {
  const hasFields = Boolean(fields?.length);

  return (
    <SectionCard title={title} description={description} action={action} sx={sx}>
      {hasFields ? (
        <Grid container spacing={1.5}>
          {fields?.map((field, index) => {
            const { key, size, ...fieldProps } = field;
            return (
              <Grid key={key ?? String(index)} size={size ?? columns}>
                <DetailsField {...fieldProps} dense />
              </Grid>
            );
          })}
        </Grid>
      ) : null}
      {children}
    </SectionCard>
  );
}

export type { DetailsMetadataCardProps, DetailsMetadataField };
