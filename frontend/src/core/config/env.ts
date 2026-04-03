type AppEnv = {
  appName: string;
  apiBaseUrl: string;
};

function getRequiredEnv(name: 'VITE_APP_NAME' | 'VITE_API_BASE_URL'): string {
  const value = import.meta.env[name];

  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const appEnv: AppEnv = {
  appName: getRequiredEnv('VITE_APP_NAME'),
  apiBaseUrl: getRequiredEnv('VITE_API_BASE_URL'),
};