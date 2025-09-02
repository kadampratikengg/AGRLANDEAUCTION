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
import PlansPage from './components/PlansPage';   // ✅ fixed

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedAuthState = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(storedAuthState === 'true');
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  return (
    <Router>
      <div className='App'>
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path='/' element={<Navigate to='/dashboard' />} />
              <Route path='/dashboard' element={<Dashboard setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/manage' element={<Manage setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/bids' element={<Bids setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/profile' element={<Profile setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/settings' element={<Settings setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/voting/:eventId' element={<Voting setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/voting/:eventId/start' element={<Start setIsAuthenticated={setIsAuthenticated} />} />
              <Route path='/results/:eventId' element={<Result setIsAuthenticated={setIsAuthenticated} />} />
            </>
          ) : (
            <>
              <Route path='/' element={<LoginPage onLogin={handleLogin} />} />
              <Route path='/create-account' element={<CreateAccountPage />} />
              <Route path='/forgot-password' element={<ForgotPasswordPage />} />
              <Route path='/planespage' element={<PlansPage />} />   {/* ✅ fixed */}
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
