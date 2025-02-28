import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import Routes from v6
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import CreateAccountPage from './components/create-account';
import ForgotPasswordPage from './components/forgot-password';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); // Sidebar minimized state

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev); // Toggle the sidebar minimized state
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated ? (
          <div className="authenticated-layout">
            <Navbar />
            <div className="sidebar-and-content">
              <Sidebar isMinimized={isMinimized} toggleMinimize={toggleMinimize} />
              <div className="content">
                <Routes> 
                  <Route path="/" element={<h2>Welcome</h2>} />  {/* Main page after login */}
                  {/* Add other routes for authenticated users */}
                  {/* Example: */}
                  <Route path="/dashboard" element={<h2>Dashboard</h2>} />
                </Routes>
              </div>
            </div>
          </div>
        ) : (
          <Routes>
            {/* Route to LoginPage */}
            <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
            {/* Add routes for Create Account and Forgot Password */}
            <Route path="/create-account" element={<CreateAccountPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;
