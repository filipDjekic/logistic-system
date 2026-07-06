import { vi } from 'vitest';

export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
};

export function mockApiSuccess<T>(data: T) {
  return Promise.resolve({ data });
}

export function mockApiError(status: number, message = 'Request failed') {
  return Promise.reject({
    response: {
      status,
      data: {
        message,
      },
    },
  });
}

export function resetApiMocks() {
  Object.values(mockApiClient).forEach((value) => {
    if (typeof value === 'function' && 'mockReset' in value) {
      value.mockReset();
    }
  });

  mockApiClient.interceptors.request.use.mockReset();
  mockApiClient.interceptors.response.use.mockReset();
}
