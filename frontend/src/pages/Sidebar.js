import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaTachometerAlt, FaCogs, FaGavel, FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './App.css';

const Sidebar = ({ setIsAuthenticated }) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsMinimized(!isMinimized);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated && setIsAuthenticated(false);
    navigate('/', { replace: true });
  };


  
  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className={`sidebar ${isMinimized ? 'minimized' : ''}`}>
      <button className="minimize-btn" onClick={toggleSidebar}>
        {isMinimized ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
      <ul>
        <li>
          <button onClick={() => navigate('/dashboard')}>
            <FaTachometerAlt size={20} />
            {!isMinimized && 'Dashboard'}
          </button>
        </li>
        <li>
          <button onClick={() => navigate('/manage')}>
            <FaCogs size={20} />
            {!isMinimized && 'Manage'}
          </button>
        </li>
        <li>
          <button onClick={() => navigate('/bids')}>
            <FaGavel size={20} />
            {!isMinimized && 'Bids'}
          </button>
        </li>
        <li>
          <button onClick={handleProfile}>
            <FaUserCircle size={20} />
            {!isMinimized && 'Profile'}
          </button>
        </li>
        <li>
          <button onClick={handleSettings}>
            <FaCog size={20} />
            {!isMinimized && 'Settings'}
          </button>
        </li>
        <li>
          <button onClick={handleLogout}>
            <FaSignOutAlt size={20} />
            {!isMinimized && 'Log Out'}
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;