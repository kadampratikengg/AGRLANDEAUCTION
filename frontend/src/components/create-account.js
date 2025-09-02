import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateAccountPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);   // ✅ used now
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordError('');
    setErrorMessage('');

    setLoading(true);   // ✅ start loading

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/check-email`,
        { email },
        { withCredentials: true }
      );

      if (response.data.exists) {
        setEmailError('Email already registered.');
        return;
      }

      // Redirect to PlansPage with account details
      navigate("/planespage", {
        state: { email, password, confirmPassword }
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to check email availability');
    } finally {
      setLoading(false);   // ✅ stop loading
    }
  };

  return (
    <div className='login-page'>
      <form onSubmit={handleSubmit}>
        <h2>Create New Account</h2>
        <div className='input-field'>
          <label>Email</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailError && <p className='error'>{emailError}</p>}
        </div>
        <div className='input-field'>
          <label>Password</label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className='input-field'>
          <label>Confirm Password</label>
          <input
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordError && <p className='error'>{passwordError}</p>}
        </div>
        <button type='submit' disabled={loading}>
          {loading ? 'Processing...' : 'Create Account'}
        </button>
        {errorMessage && <p className='error'>{errorMessage}</p>}
      </form>
    </div>
  );
};

export default CreateAccountPage;
