import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/home";
import Landing from "./pages/landing";
import Profile from "./pages/profile";
import Login from "./pages/login";
import Register from "./pages/register";
import { AuthContext } from "./contexts/AuthContextLegacy";
import { NewsContext } from "./contexts/NewsContext";

function App() {
  const { currentUser } = useContext(AuthContext);
  const { setSearchQuery } = useContext(NewsContext);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

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
      <Navbar onSearch={handleSearch} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/home"
          element={!currentUser ? <Navigate to="/login" /> : <Home />}
        />
        <Route
          path="/profile"
          element={!currentUser ? <Navigate to="/login" /> : <Profile />}
        />
      </Routes>
    </div>
  );
}

export default App;
