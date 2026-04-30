import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiLock, FiShield, FiUser } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Admin.css';

const AdminLogin = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('companyAdminToken')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Admin login failed');
      }

      localStorage.setItem('companyAdminToken', data.token);
      toast.success('Admin login successful');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="company-admin-login">
      <section className="company-admin-login__panel">
        <span className="company-admin-kicker">
          <FiShield /> Company backend
        </span>
        <h1>Admin Control</h1>
        <p>Manage customer accounts, reset passwords, and assign company free voting credits.</p>

        <form className="company-admin-form" onSubmit={handleSubmit}>
          <label>
            <span><FiUser /> Admin ID</span>
            <input
              value={adminId}
              onChange={(event) => setAdminId(event.target.value)}
              placeholder="Enter admin ID"
              autoComplete="username"
              required
            />
          </label>

          <label>
            <span><FiLock /> Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Checking...' : 'Open Dashboard'} <FiArrowRight />
          </button>
        </form>
      </section>
      <ToastContainer position="top-right" autoClose={3000} />
    </main>
  );
};

export default AdminLogin;
