import axios from "axios";
import { env } from "@/core/config/env";
import { getToken } from "../auth/token";

export const api = axios.create({
    baseURL: env.apiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();

    if(token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
})