export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  userId: number;
  role: string;
};

export type AuthMeResponse = {
  userId: number;
  email: string;
  role: string;
};