export type OperationalEntityType =
  | 'TRANSPORT_ORDER' | 'TASK' | 'WAREHOUSE' | 'WAREHOUSE_INVENTORY'
  | 'STOCK_MOVEMENT' | 'SHIFT' | 'EMPLOYEE' | 'VEHICLE'
  | 'VEHICLE_MAINTENANCE' | 'PRODUCT' | 'COMPANY' | 'NOTIFICATION' | 'GENERAL';

export type OperationalAttachmentType =
  | 'DOCUMENT' | 'DELIVERY_NOTE' | 'REPORT' | 'DAMAGE_PHOTO'
  | 'WRITE_OFF_EVIDENCE' | 'ADJUSTMENT_EVIDENCE' | 'OTHER';

export type ActivityTimelineItem = {
  type: 'COMMENT' | 'ATTACHMENT' | 'DOMAIN_EVENT';
  sourceId: number;
  entityType: OperationalEntityType;
  entityId: number;
  title: string;
  description: string | null;
  actorName: string | null;
  actorEmail: string | null;
  occurredAt: string | null;
};

export type OperationalComment = {
  id: number; entityType: OperationalEntityType; entityId: number; content: string;
  internalNote: boolean; companyId: number | null; authorId: number; authorEmail: string;
  authorName: string; createdAt: string; updatedAt: string | null;
};

export type OperationalAttachment = {
  id: number; entityType: OperationalEntityType; entityId: number;
  attachmentType: OperationalAttachmentType; fileName: string; contentType: string | null;
  fileUrl: string; sizeBytes: number | null; description: string | null;
  companyId: number | null; uploadedById: number; uploadedByEmail: string;
  uploadedByName: string; createdAt: string;
};

export type OperationalCommentCreate = {
  entityType: OperationalEntityType; entityId: number; content: string; internalNote?: boolean;
};
export type OperationalAttachmentCreate = {
  entityType: OperationalEntityType; entityId: number; attachmentType?: OperationalAttachmentType;
  fileName: string; contentType?: string | null; fileUrl: string; sizeBytes?: number | null;
  description?: string | null;
};
export type OperationalAttachmentUpload = {
  entityType: OperationalEntityType; entityId: number; file: File;
  attachmentType?: OperationalAttachmentType; description?: string | null;
};

export type ChangeType = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
export type ChangeHistoryResponse = {
  id: number; entityName: string; entityId: number; entityIdentifier: string | null;
  changeType: ChangeType; fieldName: string | null; oldValue: string | null;
  newValue: string | null; userId: number;
};
export type ChangeHistoryQueryParams = {
  search?: string; changeType?: ChangeType; entityName?: string;
  entityId?: number | null; userId?: number | null;
};
