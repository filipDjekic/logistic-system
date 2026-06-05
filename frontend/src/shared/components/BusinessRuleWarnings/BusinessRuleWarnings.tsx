import { Alert, Stack } from '@mui/material';

export type BusinessRuleWarning = {
  key: string;
  severity?: 'warning' | 'error' | 'info';
  message: string;
};

type BusinessRuleWarningsProps = {
  warnings: BusinessRuleWarning[];
};

export default function BusinessRuleWarnings({ warnings }: BusinessRuleWarningsProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {warnings.map((warning) => (
        <Alert key={warning.key} severity={warning.severity ?? 'warning'}>
          {warning.message}
        </Alert>
      ))}
    </Stack>
  );
}
