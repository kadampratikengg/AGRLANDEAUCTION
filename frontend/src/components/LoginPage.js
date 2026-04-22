import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiLock, FiMail, FiShield } from 'react-icons/fi';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.data.isValidSubscription) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        localStorage.setItem('isAuthenticated', 'true');
        onLogin();
      } else {
        navigate('/planspage', {
          state: { email, userId: response.data.userId }
        });
        setErrorMessage('Your subscription has expired. Please select a plan to continue.');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'An error occurred while logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell auth-shell--compact">
      <section className="auth-art-panel">
        <span className="auth-badge"><FiShield /> Secure voting access</span>
        <h1>Manage digital voting with confidence and control.</h1>
        <p>Sign in to create voting events, manage voter data, monitor participation, and view results from one dashboard.</p>
        <div className="auth-art-card">
          <strong>Voting control room</strong>
          <span>Protected access for election and voting administrators.</span>
        </div>
      </section>

      <section className="auth-card" aria-label="Login form">
        <div className="auth-card__header">
          <span className="auth-kicker">Welcome back</span>
          <h2>Voting Login</h2>
          <p>Use your registered voting administrator account to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span><FiMail /> Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>
          {emailError && <p className="auth-error">{emailError}</p>}

          <label className="auth-field">
            <span><FiLock /> Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          <button type="submit" className="auth-primary-button" disabled={loading}>
            {loading ? 'Processing...' : 'Login to Voting'} <FiArrowRight />
          </button>

          {errorMessage && <p className="auth-error auth-error--block">{errorMessage}</p>}
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/create-account">Create new account</Link>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
