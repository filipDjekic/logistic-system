export type ChangeType = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';

export type ChangeHistoryResponse = {
  id: number;
  entityName: string;
  entityId: number;
  changeType: ChangeType;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  userId: number;
};

export type ChangeHistoryFiltersState = {
  search: string;
  changeType: ChangeType | 'ALL';
  entityName: string;
  entityId: string;
  userId: string;
};

export const changeTypeOptions: ChangeType[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'STATUS_CHANGE',
];
