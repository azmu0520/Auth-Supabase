import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./root/App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
