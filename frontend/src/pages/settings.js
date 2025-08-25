import React, { useState } from 'react';
import './App.css';
import {
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
  FaTachometerAlt,
  FaCogs,
  FaGavel,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Settings = ({ setIsAuthenticated }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [subUserEmail, setSubUserEmail] = useState('');
  const [subUserPassword, setSubUserPassword] = useState('');
  const [subUserPermissions, setSubUserPermissions] = useState({
    voting: true,
    manage: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const toggleSidebar = () => {
    setIsSidebarMinimized((prevState) => !prevState);
  };

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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className='dashboard'>
      <div className={`sidebar ${isSidebarMinimized ? 'minimized' : ''}`}>
        <button className='minimize-btn' onClick={toggleSidebar}>
          {isSidebarMinimized ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        <ul>
          <li>
            <button onClick={() => navigate('/dashboard')}>
              <FaTachometerAlt size={20} />
              {!isSidebarMinimized && 'Dashboard'}
            </button>
          </li>
          <li>
            <button onClick={() => navigate('/manage')}>
              <FaCogs size={20} />
              {!isSidebarMinimized && 'Manage Auctions'}
            </button>
          </li>
          <li>
            <button onClick={() => navigate('/bids')}>
              <FaGavel size={20} />
              {!isSidebarMinimized && 'Bids'}
            </button>
          </li>
        </ul>
      </div>

      <div className='content'>
        <div className='navbar'>
          <h1>A M</h1>
          <nav>
            <ul>
              <li className='profile'>
                <button className='profile-btn' onClick={toggleDropdown}>
                  <FaUserCircle size={30} />
                </button>
                {isDropdownOpen && (
                  <div className='dropdown'>
                    <ul>
                      <li><button onClick={handleProfile}>Profile</button></li>
                      <li><button onClick={handleSettings}>Settings</button></li>
                      <li><button onClick={handleLogout}>Log Out</button></li>
                    </ul>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>

        <div className='main-content'>
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