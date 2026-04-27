export type ActivityLogResponse = {
  id: number;
  action: string;
  entityName: string;
  entityId: number | null;
  description: string | null;
  createdAt: string;
  userId: number;
};

export type ActivityLogFiltersState = {
  search: string;
  action: string;
  entityName: string;
  userId: string;
};

export type ActivityLogQueryParams = {
  search?: string;
  action?: string;
  entityName?: string;
  userId?: number;
};
