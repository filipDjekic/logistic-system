const requiredEnv = {
    API_BASE_URL: import.meta.env.API_BASE_URL,
};

if(!requiredEnv.API_BASE_URL) {
    throw new Error("Missing required env variable (API_BASE_URL)");
}

export const env = {
    apiBaseUrl: requiredEnv.API_BASE_URL,
} as const;