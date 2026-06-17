import type { TemporalView } from '../../../core/utils/timezoneFormat';

export type ShiftStatus = 'PLANNED' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';

export type ShiftResponse = {
  id: number;
  startTime: string;
  endTime: string;
  startTimeView?: TemporalView | null;
  endTimeView?: TemporalView | null;
  status: ShiftStatus;
  notes: string;
  timezoneId: number;
  timezoneName?: string | null;
  timezoneDisplayName?: string | null;
  timezone?: string | null;
  employeeId: number;
  warehouseId?: number | null;
  warehouseName?: string | null;
};

export type ShiftCreateRequest = {
  startTime: string;
  endTime: string;
  startTimeView?: TemporalView | null;
  endTimeView?: TemporalView | null;
  notes: string;
  timezoneId: number;
  timezoneName?: string | null;
  timezoneDisplayName?: string | null;
  timezone?: string | null;
  employeeId: number;
  warehouseId?: number | null;
  warehouseName?: string | null;
};

export type ShiftUpdateRequest = {
  startTime: string;
  endTime: string;
  startTimeView?: TemporalView | null;
  endTimeView?: TemporalView | null;
  notes?: string;
  timezoneId: number;
  timezoneName?: string | null;
  timezoneDisplayName?: string | null;
  timezone?: string | null;
  warehouseId?: number | null;
};

export type ShiftFiltersState = {
  search: string;
  status: ShiftStatus | 'ALL';
};

export type ShiftEmployeeOption = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export type ShiftFormValues = {
  startTime: string;
  endTime: string;
  startTimeView?: TemporalView | null;
  endTimeView?: TemporalView | null;
  notes: string;
  timezoneId?: number | '';
  employeeId: number | '';
  warehouseId?: number | '';
};


export type ShiftImportRowPreview = {
  rowNumber: number;
  valid: boolean;
  employeeId?: number | null;
  employeeLabel?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  timezoneId?: number | null;
  warehouseId?: number | null;
  notes?: string | null;
  errors: string[];
};

export type ShiftImportPreviewResponse = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importable: boolean;
  importedRows?: number | null;
  rows: ShiftImportRowPreview[];
};
