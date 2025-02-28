import React, { useState } from 'react';
import './LoginPage.css';
import './forgot-password.js';
import './create-account.js';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Check if email matches the regex pattern
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    // Clear the error if email is valid
    setEmailError('');

    // Simulate successful login
    onLogin();
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <h2>Login to Angular Minds</h2>

        <div className="input-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {/* Show email error message if validation fails */}
          {emailError && <p className="error">{emailError}</p>}
        </div>

        <div className="input-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Login</button>

        <div className="links">
          <a href="/forgot-password">Forgot Password?</a>
          <br /><br />
          <a href="/create-account">Create New Account</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
