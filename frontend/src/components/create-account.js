import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Widget } from '@uploadcare/react-widget';
import { toast, ToastContainer } from 'react-toastify';
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
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
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
    console.log('Form submitted, attempting to create account...');

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
      // check if email exists
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

      // prepare profile + account data
      const formData = new FormData();
      for (const key in userData) {
        formData.append(key, userData[key]);
      }
      formData.append('email', email);
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);

      // create account in backend
      const createResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/create-account`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      // save token
      localStorage.setItem('token', createResponse.data.token);

      // navigate to PlansPage with user details
      navigate('/planspage', {
        state: {
          email,
          password,
          confirmPassword,
          profileData: userData,
          userId: createResponse.data.userId,
          token: createResponse.data.token
        }
      });
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || 'Failed to create account';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="create-account-page" style={{ overflow: 'auto' }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <form onSubmit={handleSubmit} className="create-account-form">
        <h2>Create New Account</h2>
        <div className="input-field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {emailError && <p className="error">{emailError}</p>}
        </div>
        <div className="input-field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="input-field">
          <label>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          {passwordError && <p className="error">{passwordError}</p>}
        </div>

        <h3>Profile Details</h3>
        
          <div className="form-left">
            <div className="input-field">
              <label>Full Name:</label>
              <input type="text" name="name" value={userData.name} onChange={handleInputChange} required />
            </div>
            <div className="input-field">
              <label>Organization Name:</label>
              <input type="text" name="organization" value={userData.organization} onChange={handleInputChange} />
            </div>
            <div className="input-field">
              <label>Contact Email:</label>
              <input type="email" name="contact" value={userData.contact} onChange={handleInputChange} />
            </div>
            <div className="input-field">
              <label>Phone Number:</label>
              <input type="tel" name="phone" value={userData.phone} onChange={handleInputChange} />
            </div>
            <div className="input-field">
              <label>Address:</label>
              <input type="text" name="address" value={userData.address} onChange={handleInputChange} />
            </div>
            <div className="input-field">
              <label>Pincode:</label>
              <input type="text" name="pincode" value={userData.pincode} onChange={handlePincodeChange} maxLength="6" />
            </div>
            <div className="input-field">
              <label>District:</label>
              <input type="text" name="district" value={userData.district} disabled />
            </div>
            <div className="input-field">
              <label>State:</label>
              <input type="text" name="state" value={userData.state} disabled />
            </div>
            <div className="input-field">
              <label>GST Number:</label>
              <input type="text" name="gstNumber" value={userData.gstNumber} onChange={handleInputChange} />
            </div>
            <div className="input-field">
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
                />
              )}
            </div>
          </div>

        
     

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Create Account'}
        </button>
        {errorMessage && <p className="error">{errorMessage}</p>}
      </form>
    </div>
  );
};

export default CreateAccountPage;
