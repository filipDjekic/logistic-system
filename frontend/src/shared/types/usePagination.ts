import { useMemo, useState } from 'react';

type UsePaginationOptions = {
  initialPage?: number;
  initialSize?: number;
  pageSizeOptions?: number[];
};

export function usePagination(options?: UsePaginationOptions) {
  const [page, setPage] = useState(options?.initialPage ?? 0);
  const [size, setSize] = useState(options?.initialSize ?? 10);

  const pageSizeOptions = useMemo(
    () => options?.pageSizeOptions ?? [5, 10, 20, 50],
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