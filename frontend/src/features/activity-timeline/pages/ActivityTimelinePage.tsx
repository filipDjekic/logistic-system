import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import {
  useActivityTimeline,
  useCreateOperationalAttachment,
  useCreateOperationalComment,
  useRecentActivityTimeline,
} from '../hooks/useActivityTimeline';
import type { OperationalEntityType } from '../types/activityTimeline.types';

const entityTypes: OperationalEntityType[] = [
  'TRANSPORT_ORDER',
  'TASK',
  'WAREHOUSE',
  'WAREHOUSE_INVENTORY',
  'STOCK_MOVEMENT',
  'SHIFT',
  'EMPLOYEE',
  'VEHICLE',
  'VEHICLE_MAINTENANCE',
  'PRODUCT',
  'COMPANY',
  'GENERAL',
];

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.replace('T', ' ') : date.toLocaleString();
}

export default function ActivityTimelinePage() {
  const [entityType, setEntityType] = useState<OperationalEntityType | ''>('TRANSPORT_ORDER');
  const [entityId, setEntityId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');

  const timelineQuery = useActivityTimeline(entityType, entityId);
  const recentQuery = useRecentActivityTimeline();
  const createCommentMutation = useCreateOperationalComment();
  const createAttachmentMutation = useCreateOperationalAttachment();

  const timeline = useMemo(
    () => (entityType && entityId ? timelineQuery.data ?? [] : recentQuery.data ?? []),
    [entityId, entityType, recentQuery.data, timelineQuery.data],
  );

  const loading = entityType && entityId ? timelineQuery.isLoading : recentQuery.isLoading;
  const hasError = entityType && entityId ? timelineQuery.isError : recentQuery.isError;

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Operations"
        title="Activity timeline"
        description="Central place for operational comments, attachment metadata and domain events for transports, tasks, warehouses, inventory and vehicles."
      />

      <SectionCard title="Entity context" description="Select an operational entity to open its comment, attachment and event thread.">
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField select label="Entity type" fullWidth value={entityType} onChange={(event) => setEntityType(event.target.value as OperationalEntityType)}>
              {entityTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Entity ID"
              type="number"
              fullWidth
              value={entityId ?? ''}
              onChange={(event) => setEntityId(event.target.value ? Number(event.target.value) : null)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Alert severity={entityType && entityId ? 'success' : 'info'}>
              {entityType && entityId ? `Showing ${entityType} #${entityId}` : 'Showing recent domain events until entity is selected.'}
            </Alert>
          </Grid>
        </Grid>
      </SectionCard>

      {entityType && entityId ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SectionCard title="Add comment" description="Write operational notes without changing audit history.">
              <Stack spacing={2}>
                <TextField label="Comment" multiline minRows={4} value={comment} onChange={(event) => setComment(event.target.value)} fullWidth />
                <Button
                  variant="contained"
                  disabled={!comment.trim() || createCommentMutation.isPending}
                  onClick={() => createCommentMutation.mutate({ entityType, entityId, content: comment.trim() }, { onSuccess: () => setComment('') })}
                >
                  Add comment
                </Button>
              </Stack>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Add attachment metadata" description="Stores a document/link reference for the selected operational entity.">
              <Stack spacing={2}>
                <TextField label="File name" value={fileName} onChange={(event) => setFileName(event.target.value)} fullWidth />
                <TextField label="File URL / path" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} fullWidth />
                <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} fullWidth />
                <Button
                  variant="contained"
                  disabled={!fileName.trim() || !fileUrl.trim() || createAttachmentMutation.isPending}
                  onClick={() => createAttachmentMutation.mutate({ entityType, entityId, fileName: fileName.trim(), fileUrl: fileUrl.trim(), description: description.trim() || undefined }, { onSuccess: () => { setFileName(''); setFileUrl(''); setDescription(''); } })}
                >
                  Add attachment
                </Button>
              </Stack>
            </SectionCard>
          </Grid>
        </Grid>
      ) : null}

      <SectionCard title={entityType && entityId ? 'Entity timeline' : 'Recent domain events'} description="Newest operational events are shown first.">
        <Stack spacing={2}>
          {hasError ? <Alert severity="error">Unable to load activity timeline.</Alert> : null}
          {loading ? <Typography color="text.secondary">Loading...</Typography> : null}
          {!loading && timeline.length === 0 ? <Alert severity="info">No activity yet.</Alert> : null}
          {timeline.map((item) => (
            <Box key={`${item.type}-${item.sourceId}-${item.occurredAt}`} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip size="small" label={item.type} />
                  <Chip size="small" label={`${item.entityType} #${item.entityId}`} variant="outlined" />
                  <Typography variant="caption" color="text.secondary">{formatDate(item.occurredAt)}</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
                {item.description ? <Typography variant="body2" color="text.secondary">{item.description}</Typography> : null}
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  {item.actorName ?? 'System'} {item.actorEmail ? <> · <Link href={`mailto:${item.actorEmail}`}>{item.actorEmail}</Link></> : null}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
