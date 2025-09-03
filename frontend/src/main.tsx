import "@fortawesome/fontawesome-free/css/all.min.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={"292867197714-hqll2rb5nvhdp22l614rjk2fscmab42d.apps.googleusercontent.com"}>
        <Toaster position="top-right" />
        <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
