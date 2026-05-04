import type { ReactNode } from 'react';
import { Stack } from '@mui/material';
import SectionCard from '../SectionCard/SectionCard';

type Props = {
  title: string;
  description?: string;
  toolbar?: ReactNode;
  filters?: ReactNode;
  summary?: ReactNode;
  table: ReactNode;
};

export default function TableLayout({ title, description, toolbar, filters, summary, table }: Props) {
  return (
    <SectionCard title={title} description={description}>
      <Stack spacing={2}>
        {toolbar}
        {filters}
        {summary}
        {table}
      </Stack>
    </SectionCard>
  );
}
