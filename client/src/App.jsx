import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/home";
import Landing from "./pages/landing";
import Profile from "./pages/profile";
import Login from "./pages/login";
import Register from "./pages/register";
import { AuthContext } from "../contexts/authContext";
import { useContext } from "react";
import { NewsContextProvider } from "../contexts/NewsContext";
import { QueryClient, QueryClientProvider } from "react-query";

function App() {
  const { currentUser } = useContext(AuthContext);

  const queryClient = new QueryClient();

  const ProtectedRoute = ({ element, redirectTo, path }) => {
    if (!currentUser) {
      return <Navigate to={redirectTo} />;
    }

    // if the user is authenticated and tries to access the landing page, redirect them to the home page
    if (path === "/") {
      return <Navigate to="/home" />;
    }

    return element;
  };

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <ProtectedRoute
          path="/"
          element={
            <NewsContextProvider>
              <QueryClientProvider client={queryClient}>
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </QueryClientProvider>
            </NewsContextProvider>
          }
          redirectTo="/login"
        />
      </Routes>
    </div>
  );
}

export default App;
