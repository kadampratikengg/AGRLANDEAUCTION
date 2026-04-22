import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Widget } from '@uploadcare/react-widget';
import { toast, ToastContainer } from 'react-toastify';
import { FiArrowRight, FiBriefcase, FiHash, FiLock, FiMail, FiMapPin, FiPhone, FiUploadCloud, FiUser } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';
import './LoginPage.css';

const CreateAccountPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    organization: '',
    logo: '',
    contact: '',
    phone: '',
    address: '',
    state: '',
    district: '',
    pincode: '',
    gstNumber: ''
  });
  const uploadcarePublicKey = process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handlePincodeChange = async (e) => {
    const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
    setUserData({ ...userData, pincode });
    if (pincode.length === 6) {
      try {
        const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = response.data[0];
        if (data.Status === 'Success') {
          const { District, State } = data.PostOffice[0];
          setUserData((prev) => ({ ...prev, district: District, state: State }));
        } else {
          toast.error('Invalid pincode');
        }
      } catch (error) {
        toast.error('Error fetching pincode data');
      }
    }
  };

  const handleLogoUpload = (fileInfo) => {
    if (fileInfo && fileInfo.uuid && fileInfo.cdnUrl) {
      setUserData((prev) => ({ ...prev, logo: fileInfo.uuid }));
      toast.success('Logo uploaded successfully');
    } else {
      toast.error('Error uploading logo');
    }
  };

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
    setLoading(true);

    try {
      const checkResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/check-email`,
        { email },
        { withCredentials: true }
      );

      if (checkResponse.data.exists) {
        setEmailError('Email already registered.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      for (const key in userData) {
        formData.append(key, userData[key]);
      }
      formData.append('email', email);
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);

      const createResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/create-account`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      localStorage.setItem('token', createResponse.data.token);
      localStorage.setItem('userId', createResponse.data.userId);
      localStorage.setItem('isAuthenticated', 'true');

      window.location.href = '/dashboard';
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create account';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell auth-shell--wide">
      <ToastContainer position="top-right" autoClose={3000} />

      <section className="auth-art-panel auth-art-panel--signup">
        <span className="auth-badge"><FiBriefcase /> Voting admin setup</span>
        <h1>Create your voting management account.</h1>
        <p>Add administrator, organization, location, and billing-ready details before choosing a voting plan.</p>
        <div className="auth-art-card">
          <strong>Election-ready onboarding</strong>
          <span>Your profile supports voting event setup, voter verification, and result management.</span>
        </div>
      </section>

      <section className="auth-card auth-card--large" aria-label="Create account form">
        <div className="auth-card__header">
          <span className="auth-kicker">Get started</span>
          <h2>Register for Voting</h2>
          <p>Enter voting administrator credentials and organization profile information.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-section">
            <h3>Voting Account Access</h3>
            <div className="auth-form-grid">
              <label className="auth-field">
                <span><FiMail /> Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
              </label>
              <label className="auth-field">
                <span><FiLock /> Password</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" required />
              </label>
              <label className="auth-field">
                <span><FiLock /> Confirm Password</span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
              </label>
            </div>
            {emailError && <p className="auth-error">{emailError}</p>}
            {passwordError && <p className="auth-error">{passwordError}</p>}
          </div>

          <div className="auth-form-section">
            <h3>Voting Organization Details</h3>
            <div className="auth-form-grid">
              <label className="auth-field">
                <span><FiUser /> Full Name</span>
                <input type="text" name="name" value={userData.name} onChange={handleInputChange} required />
              </label>
              <label className="auth-field">
                <span><FiBriefcase /> Organization</span>
                <input type="text" name="organization" value={userData.organization} onChange={handleInputChange} />
              </label>
              <label className="auth-field">
                <span><FiMail /> Contact Email</span>
                <input type="email" name="contact" value={userData.contact} onChange={handleInputChange} />
              </label>
              <label className="auth-field">
                <span><FiPhone /> Phone Number</span>
                <input type="tel" name="phone" value={userData.phone} onChange={handleInputChange} />
              </label>
              <label className="auth-field auth-field--full">
                <span><FiMapPin /> Address</span>
                <input type="text" name="address" value={userData.address} onChange={handleInputChange} />
              </label>
              <label className="auth-field">
                <span><FiHash /> Pincode</span>
                <input type="text" name="pincode" value={userData.pincode} onChange={handlePincodeChange} maxLength="6" inputMode="numeric" />
              </label>
              <label className="auth-field">
                <span><FiMapPin /> District</span>
                <input type="text" name="district" value={userData.district} disabled />
              </label>
              <label className="auth-field">
                <span><FiMapPin /> State</span>
                <input type="text" name="state" value={userData.state} disabled />
              </label>
              <label className="auth-field">
                <span><FiHash /> GST Number</span>
                <input type="text" name="gstNumber" value={userData.gstNumber} onChange={handleInputChange} />
              </label>
            </div>
          </div>

          <div className="auth-upload-box">
            <div>
              <span><FiUploadCloud /> Organization Logo</span>
              <p>Optional square logo. Max 2 MB.</p>
            </div>
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
              <p className="auth-error">Uploadcare public key missing. Check .env configuration.</p>
            )}
            {userData.logo && (
              <img
                src={`https://ucarecdn.com/${userData.logo}/-/preview/-/scale_crop/200x200/center/`}
                alt="Organization Logo"
                className="auth-logo-preview"
              />
            )}
          </div>

          <button type="submit" className="auth-primary-button" disabled={loading}>
            {loading ? 'Processing...' : 'Register Voting Account'} <FiArrowRight />
          </button>
          {errorMessage && <p className="auth-error auth-error--block">{errorMessage}</p>}
        </form>

        <div className="auth-links">
          <Link to="/">Already registered? Login to voting</Link>
        </div>
      </section>
    </main>
  );
};

export default CreateAccountPage;
