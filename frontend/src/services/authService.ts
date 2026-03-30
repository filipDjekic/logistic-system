import api from "../api/axios";

export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
  return res.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};