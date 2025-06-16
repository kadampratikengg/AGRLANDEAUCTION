import React, { useState } from 'react';
import './LoginPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
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

    try {
      // Send request to backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/forgot-password`, 

        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div className='login-page'>
      <form onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>

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

        <button type='submit'>Send Reset Link</button>

        {message && <p className='message'>{message}</p>}
        {error && <p className='error'>{error}</p>}
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
