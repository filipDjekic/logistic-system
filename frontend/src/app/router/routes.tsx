import type { RouteObject } from "react-router-dom";
import LoginPage from "@/features/auth/pages/LoginPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <LoginPage />,
  },
];