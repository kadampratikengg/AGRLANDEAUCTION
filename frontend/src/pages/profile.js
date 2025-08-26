import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import './App.css';

const Profile = ({ setIsAuthenticated }) => {
  const [userData, setUserData] = useState({
    username: '',
    name: '',
    organization: '',
    logo: '',
    contact: '',
    email: '',
    phone: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUserData(response.data);
        setMessage('');
      } catch (error) {
        setMessage(error.response?.status === 404 
          ? 'Profile endpoint not found. Please check the backend server.'
          : 'Error fetching user data');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleLogoChange = (e) => {
    setLogoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in userData) {
      if (key !== 'username') {
        formData.append(key, userData[key]);
      }
    }
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/user/profile`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUserData(response.data);
      setMessage('Profile updated successfully');
    } catch (error) {
      setMessage('Error updating profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/user/password`, 
        { password: newPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage('Error updating password');
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <Sidebar setIsAuthenticated={setIsAuthenticated} />
        <div className="profile-container">
          <h2>User Profile</h2>
          {loading && <p>Loading...</p>}
          {message && <p className="message">{message}</p>}
          
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Username (cannot be changed):</label>
              <input
                type="text"
                value={userData.username}
                disabled
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Full Name:</label>
              <input
                type="text"
                name="name"
                value={userData.name}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label>Organization Name:</label>
              <input
                type="text"
                name="organization"
                value={userData.organization}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Organization Logo:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="form-control"
              />
              {userData.logo && (
                <img src={userData.logo} alt="Organization Logo" className="org-logo" />
              )}
            </div>

            <div className="form-group">
              <label>Contact Email:</label>
              <input
                type="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="tel"
                name="phone"
                value={userData.phone}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>

            <button type="submit" className="btn btn-primary">Update Profile</button>
          </form>

          <form onSubmit={handlePasswordChange} className="password-form">
            <h3>Change Password</h3>
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;