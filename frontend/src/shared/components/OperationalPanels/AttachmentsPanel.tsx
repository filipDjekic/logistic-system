import { useRef, useState } from 'react';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { appEnv } from '../../../core/config/env';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import {
  useOperationalAttachments,
  useUploadOperationalAttachment,
} from '../../../features/activity-timeline/hooks/useActivityTimeline';
import type { OperationalEntityType } from '../../../features/activity-timeline/types/activityTimeline.types';
import RelatedDataSection from '../EntityDetails/RelatedDataSection';

type AttachmentsPanelProps = {
  entityType: OperationalEntityType;
  entityId: number | null;
  allowCreate?: boolean;
};

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'csv', 'docx', 'xlsx'];

function validateAttachmentFile(file: File | null) {
  if (!file) return null;
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) return 'Attachment file size must be 10 MB or less.';

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
    return `Unsupported attachment file type. Allowed: ${ALLOWED_ATTACHMENT_EXTENSIONS.join(', ')}.`;
  }

  return null;
}

function formatBytes(value: number | null) {
  if (value == null) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function resolveAttachmentUrl(fileUrl: string) {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  return `${appEnv.apiBaseUrl}${fileUrl}`;
}

export default function AttachmentsPanel({ entityType, entityId, allowCreate = true }: AttachmentsPanelProps) {
  const { showSnackbar } = useAppSnackbar();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsQuery = useOperationalAttachments(entityType, entityId);
  const uploadAttachmentMutation = useUploadOperationalAttachment();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const attachments = attachmentsQuery.data ?? [];
  const canSubmit = Boolean(entityId && file && !fileError) && !uploadAttachmentMutation.isPending;

  const handleSubmit = () => {
    if (!entityId || !file) return;

    const validationError = validateAttachmentFile(file);
    if (validationError) {
      setFileError(validationError);
      showSnackbar({ message: validationError, severity: 'error' });
      return;
    }

    uploadAttachmentMutation.mutate(
      {
        entityType,
        entityId,
        file,
        description: description.trim() || null,
      },
      {
        onSuccess: () => {
          setFile(null);
          setFileError(null);
          setDescription('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          showSnackbar({ message: 'Attachment uploaded.', severity: 'success' });
        },
        onError: (error) => {
          showSnackbar({ message: getErrorMessage(error), severity: 'error' });
        },
      },
    );
  };

  return (
    <RelatedDataSection
      title="Attachments"
      description="Documents and evidence connected with this entity. Upload stores the file and keeps the audit trail."
      loading={attachmentsQuery.isLoading}
      error={attachmentsQuery.isError}
      onRetry={() => { void attachmentsQuery.refetch(); }}
      empty={!attachmentsQuery.isLoading && !attachmentsQuery.isError && attachments.length === 0 && !allowCreate}
      emptyTitle="No attachments"
      emptyDescription="There are no operational attachments for this entity yet."
    >
      {allowCreate ? (
        <Stack spacing={1.5}>
          <Alert severity="info">
            Upload a file instead of manually writing a file location. Supported: PDF, images, TXT, CSV, DOCX and XLSX up to 10 MB.
          </Alert>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
            <Button variant="outlined" component="label">
              Choose document
              <input
                ref={fileInputRef}
                hidden
                type="file"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setFile(nextFile);
                  setFileError(validateAttachmentFile(nextFile));
                }}
              />
            </Button>
            <Typography variant="body2" color={file ? 'text.primary' : 'text.secondary'}>
              {file ? `${file.name} · ${formatBytes(file.size)}` : 'No file selected'}
            </Typography>
          </Stack>

          {fileError ? <Alert severity="error">{fileError}</Alert> : null}

          <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} fullWidth />
          <Stack alignItems="flex-end">
            <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>Upload attachment</Button>
          </Stack>
        </Stack>
      ) : null}

      {attachments.length === 0 ? (
        <Typography color="text.secondary">No attachments have been added yet.</Typography>
      ) : (
        <Stack spacing={1.25}>
          {attachments.map((attachment) => (
            <Stack key={attachment.id} spacing={0.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Link href={resolveAttachmentUrl(attachment.fileUrl)} target="_blank" rel="noreferrer" fontWeight={800}>{attachment.fileName}</Link>
              {attachment.description ? <Typography variant="body2" color="text.secondary">{attachment.description}</Typography> : null}
              <Typography variant="caption" color="text.secondary">
                {attachment.uploadedByName} · {attachment.contentType ?? 'file'} · {formatBytes(attachment.sizeBytes)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </RelatedDataSection>
  );
}
