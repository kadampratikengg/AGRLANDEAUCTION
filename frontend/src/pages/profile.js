import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Widget } from '@uploadcare/react-widget';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiDownload,
  FiHash,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiShield,
  FiUploadCloud,
  FiUser,
} from 'react-icons/fi';
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
    subscriptionHistory: [],
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const uploadcarePublicKey = process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY;
  const navigate = useNavigate();

  const formatDate = (date) => {
    if (!date) return 'Not set';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getSubscriptionStatus = (sub, isCurrentSubscription = false) => {
    const today = new Date();
    const endDate = new Date(sub.endDate);
    if (isCurrentSubscription && endDate >= today) {
      return 'Active until';
    }
    return endDate >= today ? 'Active' : 'Expired';
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return 'INR 0';
    return `INR ${Number(amount / 100).toLocaleString('en-IN')}`;
  };

  const handleDownloadInvoice = (sub) => {
    const invoiceContent = `
Invoice for Subscription
Plan: ${sub.planDuration || 'Not set'}
Start Date: ${formatDate(sub.startDate)}
End Date: ${formatDate(sub.endDate)}
Amount: ${formatAmount(sub.amount)}
Payment ID: ${sub.paymentId || 'Not set'}
Order ID: ${sub.orderId || 'Not set'}
Status: ${getSubscriptionStatus(sub, sub === userData.subscription)}
Generated on: ${formatDate(new Date())}
`;
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${sub.paymentId || Date.now()}.txt`;
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
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUserData(response.data);
        setMessage('');
      } catch (error) {
        setMessage(
          error.response?.status === 401
            ? 'Unauthorized access. Redirecting to login...'
            : error.response?.status === 404
              ? 'Profile endpoint not found. Please check the backend server.'
              : 'Error fetching user data',
        );
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
    const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
    setUserData({ ...userData, pincode });
    if (pincode.length === 6) {
      try {
        const response = await axios.get(
          `https://api.postalpincode.in/pincode/${pincode}`,
        );
        const data = response.data[0];
        if (data.Status === 'Success') {
          const { District, State } = data.PostOffice[0];
          setUserData((prev) => ({
            ...prev,
            district: District,
            state: State,
          }));
          setMessage('');
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
      setSavingPassword(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/change-password`,
        {
          newPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data.message || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Error changing password',
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        },
      );
      setUserData(response.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubscriptionUpdate = () => {
    navigate('/planspage', {
      state: { email: userData.email, userId: localStorage.getItem('userId') },
    });
  };

  const currentSubscription = userData.subscription || {};
  const availableCredits = currentSubscription.votingCredits ?? 0;
  const pendingActivationMessage =
    !currentSubscription.isValid && currentSubscription.activationDate
      ? `Free credits will activate on ${formatDate(currentSubscription.activationDate)}`
      : '';
  const allSubscriptions = [
    ...(userData.subscription && userData.subscription.isValid
      ? [userData.subscription]
      : []),
    ...(userData.subscriptionHistory || []),
  ];

  return (
    <div className='work-shell profile-shell'>
      <ToastContainer
        position='top-right'
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        draggable
        pauseOnHover
      />
      <Sidebar setIsAuthenticated={setIsAuthenticated} />

      <main className='work-page profile-page'>
        <section className='profile-hero'>
          <div className='profile-hero__content'>
            <span className='profile-eyebrow'>
              <FiShield /> Account Control Center
            </span>
            <h1>Profile</h1>
            <p>
              Manage your account identity, organization details, security, and
              subscription records.
            </p>
          </div>
          <div className='profile-hero__card'>
            <div className='profile-avatar'>
              {userData.logo ? (
                <img
                  src={`https://ucarecdn.com/${userData.logo}/-/preview/-/scale_crop/200x200/center/`}
                  alt='Organization Logo'
                />
              ) : (
                <FiBriefcase />
              )}
            </div>
            <div>
              <strong>{userData.organization || 'Organization not set'}</strong>
              <span>{userData.name || userData.email || 'Profile owner'}</span>
            </div>
          </div>
        </section>

        {loading && (
          <div className='profile-alert profile-alert--info'>
            Loading profile...
          </div>
        )}
        {message && (
          <div className='profile-alert profile-alert--error'>{message}</div>
        )}
        {pendingActivationMessage && (
          <div className='profile-alert profile-alert--info'>
            {pendingActivationMessage}
          </div>
        )}

        <section className='profile-stats-grid'>
          <div className='profile-stat-card'>
            <FiUser />
            <span>Username</span>
            <strong>{userData.username || 'Not set'}</strong>
          </div>
          <div className='profile-stat-card'>
            <FiCreditCard />
            <span>Available Credits</span>
            <strong>{availableCredits}</strong>
          </div>
          <div className='profile-stat-card'>
            <FiCalendar />
            <span>Valid Till</span>
            <strong>{formatDate(currentSubscription.endDate)}</strong>
          </div>
        </section>

        <section className='profile-layout'>
          <form
            onSubmit={handleSubmit}
            className='profile-card profile-card--wide'
          >
            <div className='profile-card__header'>
              <div>
                <span className='profile-section-kicker'>Identity</span>
                <h2>Business Profile</h2>
              </div>
              <button
                type='submit'
                className='profile-icon-button profile-icon-button--primary'
                disabled={savingProfile || loading}
              >
                <FiSave />
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <div className='profile-form-grid'>
              <label className='profile-field'>
                <span>
                  <FiUser /> Username
                </span>
                <input type='text' value={userData.username} disabled />
              </label>
              <label className='profile-field'>
                <span>
                  <FiUser /> Full Name
                </span>
                <input
                  type='text'
                  name='name'
                  value={userData.name}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label className='profile-field'>
                <span>
                  <FiBriefcase /> Organization
                </span>
                <input
                  type='text'
                  name='organization'
                  value={userData.organization}
                  onChange={handleInputChange}
                />
              </label>
              <label className='profile-field'>
                <span>
                  <FiMail /> Contact Email
                </span>
                <input
                  type='email'
                  name='email'
                  value={userData.email}
                  onChange={handleInputChange}
                />
              </label>
              <label className='profile-field'>
                <span>
                  <FiPhone /> Phone Number
                </span>
                <input
                  type='tel'
                  name='phone'
                  value={userData.phone}
                  onChange={handleInputChange}
                />
              </label>
              <label className='profile-field'>
                <span>
                  <FiMapPin /> Address
                </span>
                <input
                  type='text'
                  name='address'
                  value={userData.address}
                  onChange={handleInputChange}
                />
              </label>
              <label className='profile-field'>
                <span>
                  <FiHash /> Pincode
                </span>
                <input
                  type='text'
                  name='pincode'
                  value={userData.pincode}
                  onChange={handlePincodeChange}
                  maxLength='6'
                  inputMode='numeric'
                />
              </label>
              <label className='profile-field'>
                <span>
                  <FiMapPin /> District
                </span>
                <input
                  type='text'
                  name='district'
                  value={userData.district}
                  onChange={handleInputChange}
                  disabled
                />
              </label>
              <label className='profile-field'>
                <span>
                  <FiMapPin /> State
                </span>
                <input
                  type='text'
                  name='state'
                  value={userData.state}
                  onChange={handleInputChange}
                  disabled
                />
              </label>
              <label className='profile-field'>
                <span>
                  <FiCreditCard /> GST Number
                </span>
                <input
                  type='text'
                  name='gstNumber'
                  value={userData.gstNumber}
                  onChange={handleInputChange}
                />
              </label>
            </div>

            <div className='profile-upload-panel'>
              <div>
                <span className='profile-section-kicker'>Brand Asset</span>
                <h3>Organization Logo</h3>
                <p>Upload a square logo for better display in account areas.</p>
              </div>
              <div className='profile-upload-action'>
                <FiUploadCloud />
                {uploadcarePublicKey ? (
                  <Widget
                    publicKey={uploadcarePublicKey}
                    onChange={handleLogoUpload}
                    clearable
                    imagesOnly
                    crop='1:1'
                    maxFileSize={2000000}
                  />
                ) : (
                  <span className='profile-upload-warning'>
                    Uploadcare public key missing.
                  </span>
                )}
              </div>
            </div>
          </form>

          <aside className='profile-side-stack'>
            <form onSubmit={handlePasswordChange} className='profile-card'>
              <div className='profile-card__header profile-card__header--stacked'>
                <span className='profile-section-kicker'>Security</span>
                <h2>Change Password</h2>
                <p>Use a strong password with at least 8 characters.</p>
              </div>
              <label className='profile-field'>
                <span>
                  <FiLock /> New Password
                </span>
                <input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength='8'
                />
              </label>
              <label className='profile-field'>
                <span>
                  <FiLock /> Confirm Password
                </span>
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength='8'
                />
              </label>
              <button
                type='submit'
                className='profile-icon-button profile-icon-button--dark'
                disabled={savingPassword}
              >
                <FiLock />
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <div className='profile-card profile-subscription-card'>
              <div className='profile-card__header profile-card__header--stacked'>
                <span className='profile-section-kicker'>Plan</span>
                <h2>Subscription</h2>
                <p>
                  {currentSubscription.planDuration ||
                    'No active subscription plan found.'}
                </p>
                <p>
                  Available credits: <strong>{availableCredits}</strong>
                </p>
              </div>
              <button
                onClick={handleSubscriptionUpdate}
                className='profile-icon-button profile-icon-button--accent'
              >
                <FiCreditCard /> Update Subscription
              </button>
            </div>
          </aside>
        </section>

        <section className='profile-card profile-history-card'>
          <div className='profile-card__header'>
            <div>
              <span className='profile-section-kicker'>Billing</span>
              <h2>Subscription History</h2>
            </div>
          </div>
          <div className='profile-history-grid'>
            {allSubscriptions.length > 0 ? (
              allSubscriptions.map((sub, index) => (
                <article
                  key={`${sub.paymentId || 'subscription'}-${index}`}
                  className='profile-subscription-item'
                >
                  <div className='profile-subscription-item__top'>
                    <span>{sub.planDuration || 'Subscription'}</span>
                    <strong
                      className={
                        new Date(sub.endDate) >= new Date()
                          ? 'is-active'
                          : 'is-expired'
                      }
                    >
                      {getSubscriptionStatus(
                        sub,
                        sub === userData.subscription,
                      )}
                    </strong>
                  </div>
                  <dl>
                    <div>
                      <dt>Start</dt>
                      <dd>{formatDate(sub.startDate)}</dd>
                    </div>
                    <div>
                      <dt>End</dt>
                      <dd>{formatDate(sub.endDate)}</dd>
                    </div>
                    <div>
                      <dt>Amount</dt>
                      <dd>{formatAmount(sub.amount)}</dd>
                    </div>
                    <div>
                      <dt>Credits</dt>
                      <dd>{sub.votingCredits || 0}</dd>
                    </div>
                    <div>
                      <dt>Used</dt>
                      <dd>{sub.usedVotingCredits || 0}</dd>
                    </div>
                    <div>
                      <dt>Payment ID</dt>
                      <dd>{sub.paymentId || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt>Order ID</dt>
                      <dd>{sub.orderId || 'Not set'}</dd>
                    </div>
                  </dl>
                  <button
                    onClick={() => handleDownloadInvoice(sub)}
                    className='profile-icon-button profile-icon-button--ghost'
                  >
                    <FiDownload /> Download Invoice
                  </button>
                </article>
              ))
            ) : (
              <div className='profile-empty-state'>
                No subscription history available.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;
