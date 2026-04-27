import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '../../shared/types/api.types';

export type NormalizedApiError = {
  status: number | null;
  title: string;
  message: string;
  error: string | null;
  path: string | null;
  timestamp: string | null;
  fieldErrors: string[];
  isAxiosError: boolean;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function cleanMessage(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function titleForStatus(status: number | null): string {
  switch (status) {
    case 400:
      return 'Invalid request';
    case 401:
      return 'Session expired';
    case 403:
      return 'Access denied';
    case 404:
      return 'Not found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Validation failed';
    case 500:
      return 'Server error';
    default:
      return 'Request failed';
  }
}

function defaultMessageForStatus(status: number | null, fallbackMessage: string): string {
  switch (status) {
    case 400:
      return 'The submitted data is invalid. Check required fields and values.';
    case 401:
      return 'Your session is no longer valid. Log in again.';
    case 403:
      return 'Your role does not have permission to perform this action.';
    case 404:
      return 'The requested record does not exist or is outside your company scope.';
    case 409:
      return 'This action conflicts with existing data or current record status.';
    case 422:
      return 'Some fields are invalid. Check the form and try again.';
    case 500:
      return 'The server failed to complete the request. Try again after checking the submitted data.';
    default:
      return fallbackMessage;
  }
}

function normalizeFieldErrors(message: string): string[] {
  return message
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.includes(':') && part.length > 0);
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
  fallbackMessage = 'The request could not be completed. Check the data and try again.',
): NormalizedApiError {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status ?? null;
    const data = axiosError.response?.data;

    if (isApiErrorResponse(data)) {
      const message = cleanMessage(data.message) ?? defaultMessageForStatus(data.status, fallbackMessage);

      return {
        status: data.status,
        title: titleForStatus(data.status),
        message,
        error: data.error,
        path: data.path,
        timestamp: data.timestamp,
        fieldErrors: normalizeFieldErrors(message),
        isAxiosError: true,
      };
    }

    if (!axiosError.response) {
      return {
        status: null,
        title: 'Network error',
        message: 'Backend is not reachable. Check that the server is running and try again.',
        error: null,
        path: null,
        timestamp: null,
        fieldErrors: [],
        isAxiosError: true,
      };
    }

    return {
      status,
      title: titleForStatus(status),
      message: defaultMessageForStatus(status, cleanMessage(axiosError.message) ?? fallbackMessage),
      error: null,
      path: null,
      timestamp: null,
      fieldErrors: [],
      isAxiosError: true,
    };
  }

  if (error instanceof Error && isNonEmptyString(error.message)) {
    return {
      status: null,
      title: 'Request failed',
      message: error.message,
      error: null,
      path: null,
      timestamp: null,
      fieldErrors: [],
      isAxiosError: false,
    };
  }

  if (isNonEmptyString(error)) {
    return {
      status: null,
      title: 'Request failed',
      message: error,
      error: null,
      path: null,
      timestamp: null,
      fieldErrors: [],
      isAxiosError: false,
    };
  }

  return {
    status: null,
    title: 'Request failed',
    message: fallbackMessage,
    error: null,
    path: null,
    timestamp: null,
    fieldErrors: [],
    isAxiosError: false,
  };
}

export function getErrorTitle(error: unknown, fallbackMessage?: string): string {
  return normalizeApiError(error, fallbackMessage).title;
}

export function getErrorDescription(error: unknown, fallbackMessage?: string): string {
  return normalizeApiError(error, fallbackMessage).message;
}
