import api from "../api/axios";

export type LoginResponse = {
  token: string;
  userId: number;
  role: string;
};

export const login = async (email: string, password: string) => {
  const res = await api.post<LoginResponse>("/auth/login", { email, password });

  localStorage.setItem("token", res.data.token);
  localStorage.setItem("userId", String(res.data.userId));
  localStorage.setItem("role", res.data.role);

  return res.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
};

export const getStoredAuth = () => ({
  token: localStorage.getItem("token"),
  userId: localStorage.getItem("userId"),
  role: localStorage.getItem("role"),
});