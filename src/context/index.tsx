import { AuthProvider } from "./AuthContext";
import React from "react";
const MainProvider = ({ children }: { children: React.ReactNode }) => {
  <AuthProvider>{children}</AuthProvider>;
};

export default MainProvider;
