import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import './App.css';

const Navbar = ({ setIsAuthenticated }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated && setIsAuthenticated(false);
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">A M</div>
      <div className="profile">
        <button className="profile-btn" onClick={toggleDropdown}>
          <FaUserCircle size={30} />
        </button>
        {isDropdownOpen && (
          <div className="dropdown">
            <ul>
              <li><button onClick={handleProfile}>Profile</button></li>
              <li><button onClick={handleSettings}>Settings</button></li>
              <li><button onClick={handleLogout}>Log Out</button></li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;