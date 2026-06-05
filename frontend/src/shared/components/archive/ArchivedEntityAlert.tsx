import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import { Alert, AlertTitle } from '@mui/material';

type ArchivedEntityAlertProps = {
  entityLabel: string;
};

export default function ArchivedEntityAlert({ entityLabel }: ArchivedEntityAlertProps) {
  return (
    <Alert severity="warning" icon={<ArchiveOutlinedIcon fontSize="inherit" />}>
      <AlertTitle>{entityLabel} is archived</AlertTitle>
      Archived records stay visible for history and traceability, but operational edits and new workflow actions should be blocked until the record is restored.
    </Alert>
  );
}
