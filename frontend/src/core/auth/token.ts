const TOKEY_KEY = "access_token";

export const getToken = (): string | null => {
    return localStorage.getItem(TOKEY_KEY);
};

export const setToken = (token: string): void => {
    localStorage.setItem(TOKEY_KEY, token);
};

export const removeToken = (): void => {
    localStorage.removeItem(TOKEY_KEY);
};

export const hasToken = (): boolean => {
    return Boolean(getToken());
};