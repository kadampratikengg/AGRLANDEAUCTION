import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './App.css';

const Settings = ({ setIsAuthenticated }) => {
  const [subUserEmail, setSubUserEmail] = useState('');
  const [subUserPassword, setSubUserPassword] = useState('');
  const [subUserPermissions, setSubUserPermissions] = useState({
    voting: true,
    manage: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleCreateSubUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!subUserEmail || !subUserPassword) {
      setError('Email and password are required');
      return;
    }

    const permissions = [];
    if (subUserPermissions.voting) permissions.push('/voting/:eventId');
    if (subUserPermissions.manage) permissions.push('/manage');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sub-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: subUserEmail,
          password: subUserPassword,
          permissions,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create sub-user');
      }

      setSuccess('Sub-user created successfully');
      setSubUserEmail('');
      setSubUserPassword('');
      setSubUserPermissions({ voting: true, manage: true });
      navigate('/dashboard'); // Redirect to dashboard after success
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <Sidebar setIsAuthenticated={setIsAuthenticated} />
        <div className="content">
          <h2>Settings</h2>
          <div className="sub-user-section">
            <h3>Create Sub-User</h3>
            <form onSubmit={handleCreateSubUser}>
              <label htmlFor="subUserEmail">Email:</label>
              <input
                type="email"
                id="subUserEmail"
                value={subUserEmail}
                onChange={(e) => setSubUserEmail(e.target.value)}
                required
              />

              <label htmlFor="subUserPassword">Password:</label>
              <input
                type="password"
                id="subUserPassword"
                value={subUserPassword}
                onChange={(e) => setSubUserPassword(e.target.value)}
                required
              />

              <div className="permissions">
                <label>
                  <input
                    type="checkbox"
                    checked={subUserPermissions.voting}
                    onChange={() =>
                      setSubUserPermissions((prev) => ({
                        ...prev,
                        voting: !prev.voting,
                      }))
                    }
                  />
                  Access to Voting
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={subUserPermissions.manage}
                    onChange={() =>
                      setSubUserPermissions((prev) => ({
                        ...prev,
                        manage: !prev.manage,
                      }))
                    }
                  />
                  Access to Manage
                </label>
              </div>

              <button type="submit">Create Sub-User</button>
            </form>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;