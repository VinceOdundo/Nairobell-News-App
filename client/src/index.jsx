import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import {AuthContextProvider} from "./contexts/authContext";
import {BrowserRouter, Router} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";


const queryClient = new QueryClient()

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthContextProvider>
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </AuthContextProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
