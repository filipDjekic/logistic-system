import { useRef, useState } from 'react';
import { Alert, Button, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import { appEnv } from '../../../core/config/env';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import {
  useOperationalAttachments,
  useUploadOperationalAttachment,
} from '../../../features/activity-timeline/hooks/useActivityTimeline';
import type { OperationalAttachmentType, OperationalEntityType } from '../../../features/activity-timeline/types/activityTimeline.types';
import RelatedDataSection from '../EntityDetails/RelatedDataSection';

type AttachmentTypeOption = {
  value: OperationalAttachmentType;
  label: string;
};

type AttachmentsPanelProps = {
  entityType: OperationalEntityType;
  entityId: number | null;
  allowCreate?: boolean;
  title?: string;
  description?: string;
  attachmentTypeOptions?: readonly AttachmentTypeOption[];
  defaultAttachmentType?: OperationalAttachmentType;
};

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'csv', 'docx', 'xlsx'];

const defaultAttachmentTypeOptions: AttachmentTypeOption[] = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'DELIVERY_NOTE', label: 'Delivery note' },
  { value: 'REPORT', label: 'Report' },
  { value: 'DAMAGE_PHOTO', label: 'Damage photo' },
  { value: 'WRITE_OFF_EVIDENCE', label: 'Write-off evidence' },
  { value: 'ADJUSTMENT_EVIDENCE', label: 'Adjustment evidence' },
  { value: 'OTHER', label: 'Other' },
];

function attachmentTypeLabel(value: OperationalAttachmentType | null | undefined, options: readonly AttachmentTypeOption[]) {
  return options.find((option) => option.value === value)?.label ?? value?.replaceAll('_', ' ') ?? 'Document';
}

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

export default function AttachmentsPanel({
  entityType,
  entityId,
  allowCreate = true,
  title = 'Attachments',
  description: panelDescription = 'Documents and evidence connected with this entity. Upload stores the file and keeps the audit trail.',
  attachmentTypeOptions = defaultAttachmentTypeOptions,
  defaultAttachmentType = 'DOCUMENT',
}: AttachmentsPanelProps) {
  const { showSnackbar } = useAppSnackbar();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsQuery = useOperationalAttachments(entityType, entityId);
  const uploadAttachmentMutation = useUploadOperationalAttachment();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<OperationalAttachmentType>(defaultAttachmentType);
  const [attachmentDescription, setAttachmentDescription] = useState('');

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
        attachmentType,
        description: attachmentDescription.trim() || null,
      },
      {
        onSuccess: () => {
          setFile(null);
          setFileError(null);
          setAttachmentType(defaultAttachmentType);
          setAttachmentDescription('');
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
      title={title}
      description={panelDescription}
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

          <TextField
            select
            label="Attachment type"
            value={attachmentType}
            onChange={(event) => setAttachmentType(event.target.value as OperationalAttachmentType)}
            fullWidth
          >
            {attachmentTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>

          <TextField label="Description" value={attachmentDescription} onChange={(event) => setAttachmentDescription(event.target.value)} fullWidth />
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
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Link href={resolveAttachmentUrl(attachment.fileUrl)} target="_blank" rel="noreferrer" fontWeight={800}>{attachment.fileName}</Link>
                <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.25, border: 1, borderColor: 'divider', borderRadius: 999 }}>
                  {attachmentTypeLabel(attachment.attachmentType, attachmentTypeOptions)}
                </Typography>
              </Stack>
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
