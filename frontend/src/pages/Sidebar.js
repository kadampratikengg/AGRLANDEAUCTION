import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChevronLeft,
  FaChevronRight,
  FaTachometerAlt,
  FaCogs,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import './App.css';

const Sidebar = ({ setIsAuthenticated }) => {
  // `isMinimized` controls both desktop and mobile states.
  // true = collapsed (icons only), false = expanded (icons + labels)
  const [isMinimized, setIsMinimized] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsMinimized((prev) => !prev);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated && setIsAuthenticated(false);
    navigate('/', { replace: true });
  };

  const sidebarClasses = ['sidebar', isMinimized ? 'minimized' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={sidebarClasses}>
      <button
        className='minimize-btn'
        onClick={toggleSidebar}
        aria-label={isMinimized ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isMinimized ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
      <ul>
        <li>
          <button onClick={() => handleNavigation('/dashboard')}>
            <FaTachometerAlt size={20} />
            {!isMinimized && 'Dashboard'}
          </button>
        </li>
        <li>
          <button onClick={() => handleNavigation('/manage')}>
            <FaCogs size={20} />
            {!isMinimized && 'Manage'}
          </button>
        </li>
        <li>
          <button onClick={() => handleNavigation('/profile')}>
            <FaUserCircle size={20} />
            {!isMinimized && 'Profile'}
          </button>
        </li>
        <li>
          <button onClick={() => handleNavigation('/settings')}>
            <FaCog size={20} />
            {!isMinimized && 'Settings'}
          </button>
        </li>
        {/* Uncomment to enable Bids menu
        <li>
          <button onClick={() => handleNavigation('/bids')}>
            <FaGavel size={20} />
            {!isMinimized && 'Bids'}
          </button>
        </li>
        */}
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
