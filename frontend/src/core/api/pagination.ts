export type SortDirection = 'asc' | 'desc';

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type PageParams = {
  page?: number;
  size?: number;
  sort?: string;
};

export type SortState = {
  field: string;
  direction: SortDirection;
};

export const DEFAULT_PAGE_SIZE = 20;

export function buildSortParam(sort: SortState) {
  return `${sort.field},${sort.direction}`;
}

export function unwrapPageContent<T>(data: T[] | PageResponse<T>) {
  return Array.isArray(data) ? data : data.content;
}
