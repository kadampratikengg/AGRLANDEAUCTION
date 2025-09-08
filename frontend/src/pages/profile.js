import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Widget } from '@uploadcare/react-widget';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

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
    gstNumber: '',
    subscription: {},
    subscriptionHistory: []
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const uploadcarePublicKey = process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY;
  const navigate = useNavigate();

  // Helper function to format date to dd-mm-yyyy
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper function to determine subscription status
  const getSubscriptionStatus = (sub, isCurrentSubscription = false) => {
    const today = new Date();
    const endDate = new Date(sub.endDate);
    if (isCurrentSubscription && endDate >= today) {
      return 'Active Until ';
    }
    return endDate >= today ? 'Active' : 'Expired';
  };

  // Helper function to handle invoice download
  const handleDownloadInvoice = (sub) => {
    const invoiceContent = `
      Invoice for Subscription
      Plan: ${sub.planDuration}
      Start Date: ${formatDate(sub.startDate)}
      End Date: ${formatDate(sub.endDate)}
      Amount: ₹${sub.amount / 100}
      Payment ID: ${sub.paymentId}
      Order ID: ${sub.orderId}
      Status: ${getSubscriptionStatus(sub, sub === userData.subscription)}
      Generated on: ${formatDate(new Date())}
    `;
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${sub.paymentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Invoice downloaded successfully');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage('No authentication token found. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
        setMessage('');
      } catch (error) {
        setMessage(error.response?.status === 401
          ? 'Unauthorized access. Redirecting to login...'
          : error.response?.status === 404
          ? 'Profile endpoint not found. Please check the backend server.'
          : 'Error fetching user data');
        if (error.response?.status === 401) {
          setTimeout(() => navigate('/login'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

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
    if (fileInfo && fileInfo.uuid) {
      setUserData((prev) => ({ ...prev, logo: fileInfo.uuid }));
      toast.success('Logo uploaded successfully');
    } else {
      setMessage('Error uploading logo');
      toast.error('Error uploading logo');
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

      if (response.status !== 200) {
        throw new Error(response.data.message || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Error changing password');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/users`, userData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setUserData(response.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    }
  };

  const handleSubscriptionUpdate = () => {
    navigate('/planspage', { state: { email: userData.email, userId: localStorage.getItem('userId') } });
  };

  // Combine current subscription and history
  const allSubscriptions = [
    ...(userData.subscription && userData.subscription.isValid ? [userData.subscription] : []),
    ...(userData.subscriptionHistory || [])
  ];

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick draggable pauseOnHover />
      <div className="main-content">
        <Sidebar setIsAuthenticated={setIsAuthenticated} />
        <div className="content">
          <h2>User Profile</h2>
          {loading && <p>Loading...</p>}
          {message && <p className="error">{message}</p>}
          
          <form onSubmit={handlePasswordChange} className="password-form">
            <div className="form-container">
              <div className="form-column">
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
              </div>
              <div className="form-column">
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
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Change Password</button>
            </div>
          </form>
          
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-container">
              <div className="form-column">
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
              </div>
              <div className="form-column">
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
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Update Profile</button>
            </div>
          </form>

          <div className="subscription-history">
            <div className="history-header">
              <h3>Subscription History</h3>
              <button onClick={handleSubscriptionUpdate} className="btn btn-secondary">Update Subscription</button>
            </div>
            <div className="history-container">
              {allSubscriptions.length > 0 ? (
                allSubscriptions.map((sub, index) => (
                  <div key={index} className="subscription-card">
                    <p><strong>Plan:</strong> {sub.planDuration}</p>
                    <p><strong>Start Date:</strong> {formatDate(sub.startDate)}</p>
                    <p><strong>End Date:</strong> {formatDate(sub.endDate)}</p>
                    <p><strong>Amount:</strong> ₹{sub.amount / 100}</p>
                    <p><strong>Payment ID:</strong> {sub.paymentId}</p>
                    <p><strong>Order ID:</strong> {sub.orderId}</p>
                    <p><strong>Status:</strong> {getSubscriptionStatus(sub, sub === userData.subscription)}</p>
                    <button
                      onClick={() => handleDownloadInvoice(sub)}
                      className="btn btn-invoice"
                    >
                      Download Invoice
                    </button>
                  </div>
                ))
              ) : (
                <p>No subscription history available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;