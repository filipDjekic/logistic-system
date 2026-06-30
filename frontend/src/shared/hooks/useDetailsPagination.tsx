import { useState } from 'react';
import type { ReactNode } from 'react';
import type { PageResponse } from '../../core/api/pagination';
import ServerTablePagination from '../components/ServerTablePagination/ServerTablePagination';

type DetailsPaginationState<T> = {
  page: number;
  size: number;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  reset: () => void;
  pagination: (data: PageResponse<T> | undefined, disabled?: boolean) => ReactNode;
};

export default function useDetailsPagination<T = unknown>(defaultSize = 10): DetailsPaginationState<T> {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(defaultSize);

  const reset = () => setPage(0);

  const pagination = (data: PageResponse<T> | undefined, disabled = false) => (
    <ServerTablePagination<T>
      page={data}
      disabled={disabled}
      onPageChange={setPage}
      onSizeChange={(nextSize) => {
        setPage(0);
        setSize(nextSize);
      }}
    />
  );

  return { page, size, setPage, setSize, reset, pagination };
}
