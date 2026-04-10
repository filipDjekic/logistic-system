import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../shared/types/api.types';

export type NormalizedApiError = {
  status: number | null;
  message: string;
  error: string | null;
  path: string | null;
  timestamp: string | null;
  isAxiosError: boolean;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ApiErrorResponse>;

  return (
    typeof candidate.status === 'number' &&
    typeof candidate.message === 'string' &&
    typeof candidate.error === 'string' &&
    typeof candidate.path === 'string'
  );
}

export function normalizeApiError(
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.',
): NormalizedApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const data = axiosError.response?.data;

    if (isApiErrorResponse(data)) {
      return {
        status: data.status,
        message: isNonEmptyString(data.message) ? data.message : fallbackMessage,
        error: data.error,
        path: data.path,
        timestamp: data.timestamp,
        isAxiosError: true,
      };
    }

    if (isNonEmptyString(axiosError.message)) {
      return {
        status: axiosError.response?.status ?? null,
        message: axiosError.message,
        error: null,
        path: null,
        timestamp: null,
        isAxiosError: true,
      };
    }
  }

  if (error instanceof Error && isNonEmptyString(error.message)) {
    return {
      status: null,
      message: error.message,
      error: null,
      path: null,
      timestamp: null,
      isAxiosError: false,
    };
  }

  if (isNonEmptyString(error)) {
    return {
      status: null,
      message: error,
      error: null,
      path: null,
      timestamp: null,
      isAxiosError: false,
    };
  }

  return {
    status: null,
    message: fallbackMessage,
    error: null,
    path: null,
    timestamp: null,
    isAxiosError: false,
  };
}