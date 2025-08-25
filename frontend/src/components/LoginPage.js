import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { initiatePayment } from './razorpay';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPlanPopup, setShowPlanPopup] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const plans = [
    { duration: '1 Month', amount: 1000, gst: 0.2, total: 1200, validityDays: 30 },
    { duration: '3 Months', amount: 3000, gst: 0.2, total: 3600, validityDays: 90 },
    { duration: '6 Months', amount: 6000, gst: 0.2, total: 7200, validityDays: 180 },
  ];

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePlanSelect = (plan) => {
    initiatePayment(plan, email, userId, setErrorMessage, setLoading, navigate, onLogin);
    setShowPlanPopup(false);
  };

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
        setUserId(response.data.userId);
        setShowPlanPopup(true);
        setErrorMessage('Your subscription has expired. Please select a plan to continue.');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'An error occurred while logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <h2>Login to A M</h2>
        <div className="input-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Login'}
        </button>
        {errorMessage && <p className="error">{errorMessage}</p>}
        <div className="links">
          <a href="/forgot-password">Forgot Password?</a>
          <br /><br />
          <a href="/create-account">Create New Account</a>
        </div>
      </form>

      {showPlanPopup && (
        <div className='plan-popup'>
          <div className='plan-popup-content'>
            <h3>Select a Subscription Plan</h3>
            {plans.map((plan) => (
              <div key={plan.duration} className='plan-option'>
                <button onClick={() => handlePlanSelect(plan)}>
                  {plan.duration} - ₹{plan.total} (₹{plan.amount} + 20% GST)
                </button>
              </div>
            ))}
            <button onClick={() => setShowPlanPopup(false)}>Cancel</button>
          </div>
        </div>
      )}
      <style>
        {`
          .plan-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }
          .plan-popup-content {
            background: white;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
          }
          .plan-option {
            margin: 10px 0;
          }
          .plan-option button {
            padding: 10px;
            width: 100%;
            background: #3399cc;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          .plan-option button:hover {
            background: #287aa9;
          }
          .plan-popup-content button:last-child {
            margin-top: 20px;
            background: #ccc;
            color: black;
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;