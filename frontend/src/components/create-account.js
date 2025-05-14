import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const CreateAccountPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailError('');

    // Password and confirm password validation
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordError('');
    setErrorMessage('');

    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/create-account',
        { email, password, confirmPassword },
        { withCredentials: true }
      );

      if (response.data.message === 'Account created successfully') {
        alert('Account created successfully!');
        navigate('/'); // Redirect to LoginPage
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Something went wrong');
      } else if (error.request) {
        setErrorMessage('No response from the server.');
      } else {
        setErrorMessage('Request failed: ' + error.message);
      }
    } finally {
      setLoading(false);
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
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        {errorMessage && <p className='error'>{errorMessage}</p>}
      </form>
    </div>
  );
};

export default CreateAccountPage;