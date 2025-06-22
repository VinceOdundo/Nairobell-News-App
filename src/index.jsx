import React from "react";
import ReactDOM from "react-dom/client";
import App from "../client/src/App";
import "./index.css";

import { AuthProvider } from "./contexts/AuthContext";
import { AuthContextProvider } from "./contexts/AuthContextLegacy";
import { BrowserRouter, Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthContextProvider>
          <BrowserRouter>
            <App />
            <Toaster position="top-right" />
          </BrowserRouter>
        </AuthContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
