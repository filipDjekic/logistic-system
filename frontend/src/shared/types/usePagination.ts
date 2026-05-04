import { useMemo, useState } from 'react';
import { appConfig } from '../../core/config/appConfig';

type UsePaginationOptions = {
  initialPage?: number;
  initialSize?: number;
  pageSizeOptions?: number[];
};

export function usePagination(options?: UsePaginationOptions) {
  const [page, setPage] = useState(options?.initialPage ?? 0);
  const [size, setSize] = useState(options?.initialSize ?? appConfig.pagination.defaultPageSize);

  const pageSizeOptions = useMemo(
    () => options?.pageSizeOptions ?? [...appConfig.pagination.pageSizeOptions],
    [options?.pageSizeOptions],
  );

  const handlePageChange = (_event: unknown, nextPage: number) => {
    setPage(nextPage);
  };

  const handleSizeChange = (nextSize: number) => {
    setSize(nextSize);
    setPage(0);
  };

  const resetPage = () => {
    setPage(0);
  };

  return {
    page,
    size,
    pageSizeOptions,
    setPage,
    setSize,
    handlePageChange,
    handleSizeChange,
    resetPage,
  };
}