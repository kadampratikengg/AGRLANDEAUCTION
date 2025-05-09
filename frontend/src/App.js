import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import CreateAccountPage from './components/create-account';
import ForgotPasswordPage from './components/forgot-password';
import Dashboard from './pages/dashboard';
import Manage from './pages/manage';
import Bids from './pages/bids';
import Settings from './pages/settings';
import Profile from './pages/profile';
import Voting from './pages/Voting';
import Start from './pages/start';
import Result from './pages/result';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is authenticated when the app loads
  useEffect(() => {
    // Retrieve authentication state from localStorage
    const storedAuthState = localStorage.getItem('isAuthenticated');

    // If storedAuthState is not null or not 'true', consider user as unauthenticated
    setIsAuthenticated(storedAuthState === 'true');
  }, []);

  // Handle login and store the authentication state in localStorage
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true'); // Save authentication state to localStorage
  };

  return (
    <Router>
      <div className='App'>
        <Routes>
          {/* If the user is authenticated, redirect them to /dashboard */}
          {isAuthenticated ? (
            <>
              <Route path='/' element={<Navigate to='/dashboard' />} />
              <Route path='/dashboard' element={<Dashboard setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/manage' element={<Manage setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/bids' element={<Bids setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/profile' element={<Profile setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/settings' element={<Settings setIsAuthenticated={setIsAuthenticated} />} />
              <Route path="/voting/:eventId" element={<Voting setIsAuthenticated={setIsAuthenticated}/>} />
              <Route path="/voting/:eventId/start" element={<Start setIsAuthenticated={setIsAuthenticated}/>} />
              <Route path="/results/:eventId" element={<Result setIsAuthenticated={setIsAuthenticated}/>} /> {/* Add Results route */}
            </>
          ) : (
            <>
              <Route path='/' element={<LoginPage onLogin={handleLogin} />} />
              <Route path='/create-account' element={<CreateAccountPage />} />
              <Route path='/forgot-password' element={<ForgotPasswordPage />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
};

export default App;