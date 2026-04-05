export type ShiftStatus = 'PLANNED' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';

export type ShiftResponse = {
  id: number;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  notes: string;
  employeeId: number;
};

export type ShiftCreateRequest = {
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  notes: string;
  employeeId: number;
};

export type ShiftUpdateRequest = {
  id?: number;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  notes?: string;
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
  status: ShiftStatus;
  notes: string;
  employeeId: number | '';
};