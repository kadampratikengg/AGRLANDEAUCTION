import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import './App.css';
import { Widget } from '@uploadcare/react-widget';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const Profile = ({ setIsAuthenticated }) => {
  const [userData, setUserData] = useState({
    username: '',
    name: '',
    organization: '',
    logo: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    state: '',
    district: '',
    pincode: '',
    gstNumber: ''
  });
  const [subscriptionData, setSubscriptionData] = useState({
    planDuration: '',
    startDate: '',
    endDate: '',
    isValid: false
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const uploadcarePublicKey = process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setUserData(response.data);
        setSubscriptionData({
          planDuration: response.data.subscription?.duration || 'No active subscription',
          startDate: response.data.subscription?.startDate || '',
          endDate: response.data.subscription?.endDate || '',
          isValid: response.data.isValidSubscription || false
        });
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

  const handlePincodeChange = async (e) => {
    const pincode = e.target.value;
    setUserData({ ...userData, pincode });
    if (pincode.length === 6) {
      try {
        const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = response.data[0];
        if (data.Status === 'Success') {
          const { District, State } = data.PostOffice[0];
          setUserData((prev) => ({ ...prev, district: District, state: State }));
        } else {
          setMessage('Invalid pincode');
        }
      } catch (error) {
        setMessage('Error fetching pincode data');
      }
    }
  };

  const handleLogoUpload = (fileInfo) => {
    if (fileInfo && fileInfo.uuid && fileInfo.cdnUrl) {
      setUserData((prev) => ({ ...prev, logo: fileInfo.uuid }));
    } else {
      setMessage('Error uploading logo');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/change-password`, {
        newPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.data;
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in userData) {
      if (key !== 'username') {
        formData.append(key, userData[key]);
      }
    }

    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/users`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUserData(response.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Error updating profile');
    }
  };

  const handleSubscriptionUpdate = () => {
    navigate('../components/PlansPage', { state: { email: userData.email, userId: localStorage.getItem('userId') } });
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick draggable pauseOnHover />
      <div className="main-content">
        <Sidebar setIsAuthenticated={setIsAuthenticated} />
        <div className="content">
          <h2>User Profile</h2>
          {loading && <p>Loading...</p>}
          {message && <p className="message">{message}</p>}
          <div className="subscription-details">
            <h3>Subscription Details</h3>
            <p>Plan: {subscriptionData.planDuration}</p>
            {subscriptionData.startDate && (
              <p>Start Date: {new Date(subscriptionData.startDate).toLocaleDateString()}</p>
            )}
            {subscriptionData.endDate && (
              <p>End Date: {new Date(subscriptionData.endDate).toLocaleDateString()}</p>
            )}
            <p>Status: {subscriptionData.isValid ? 'Active' : 'Inactive'}</p>
            <button onClick={handleSubscriptionUpdate} className="btn btn-primary">
              {subscriptionData.isValid ? 'Update Subscription' : 'Purchase Subscription'}
            </button>
          </div>
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
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Change Password</button>
            </div>
          </form>
          
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-container">
              <div className="form-left">
                <div className="form-group">
                  <label>Username:</label>
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

                <div className="form-group">
                  <label>Address:</label>
                  <input
                    type="text"
                    name="address"
                    value={userData.address}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Pincode:</label>
                  <input
                    type="text"
                    name="pincode"
                    value={userData.pincode}
                    onChange={handlePincodeChange}
                    className="form-control"
                    maxLength="6"
                  />
                </div>

                <div className="form-group">
                  <label>District:</label>
                  <input
                    type="text"
                    name="district"
                    value={userData.district}
                    onChange={handleInputChange}
                    className="form-control"
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>State:</label>
                  <input
                    type="text"
                    name="state"
                    value={userData.state}
                    onChange={handleInputChange}
                    className="form-control"
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>GST Number:</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={userData.gstNumber}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-right">
                <div className="form-group">
                  <label>Organization Logo:</label>
                  {uploadcarePublicKey ? (
                    <Widget
                      publicKey={uploadcarePublicKey}
                      onChange={handleLogoUpload}
                      clearable
                      imagesOnly
                      crop="1:1"
                      maxFileSize={2000000}
                    />
                  ) : (
                    <p style={{ color: 'red' }}>
                      Image upload disabled: Uploadcare public key missing. Check .env configuration.
                    </p>
                  )}
                  {userData.logo && (
                    <img
                      src={`https://ucarecdn.com/${userData.logo}/-/preview/-/scale_crop/200x200/center/`}
                      alt="Organization Logo"
                      className="org-logo circle"
                    />
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">Update Profile</button>
          </form>
        </div>
      </div>
      <style>
        {`
          .subscription-details {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #f9f9f9;
          }
          .subscription-details h3 {
            margin-top: 0;
            margin-bottom: 10px;
          }
          .subscription-details p {
            margin: 5px 0;
          }
          .subscription-details button {
            margin-top: 10px;
          }
        `}
      </style>
    </div>
  );
};

export default Profile;