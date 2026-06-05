export type ApiListResponse<T> = T[];

export type ApiPageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type PaginationQueryParams = {
  page: number;
  size: number;
};

export type ApiFieldErrorResponse = {
  field: string;
  message: string;
};

export type ApiErrorResponse = {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string;
  message?: string;
  path?: string;
  fieldErrors?: ApiFieldErrorResponse[] | Record<string, string>;
  fieldErrorMap?: Record<string, string>;
};
