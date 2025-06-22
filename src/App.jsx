import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NewsProvider } from './contexts/NewsContext'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

function App() {
  return (
    <AuthProvider>
      <NewsProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Router>
      </NewsProvider>
    </AuthProvider>
  )
}

export default App