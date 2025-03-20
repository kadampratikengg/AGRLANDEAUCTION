import React, { useState } from 'react';
import './dashboard.css'; // This will include the merged CSS for both Navbar and Sidebar
import {
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
  FaTachometerAlt,
  FaCogs,
  FaGavel,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ setIsAuthenticated, name }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true); // Default state is minimized
  const navigate = useNavigate();

  // Toggle the dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  // Handle Logout
  const handleLogout = () => {
    // Remove authentication state from localStorage
    localStorage.removeItem('isAuthenticated');

    // Update the authentication state in App.js
    setIsAuthenticated(false);

    // Redirect to the Login page
    navigate('/');
  };


  

  // Navigate to Profile page
  const handleProfile = () => {
    navigate('/profile');
  };

  // Navigate to Settings page
  const handleSettings = () => {
    navigate('/settings');
  };

  // Toggle sidebar minimize state
  const toggleSidebar = () => {
    setIsSidebarMinimized((prevState) => !prevState);
  };

  return (
    <div className='dashboard'>
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarMinimized ? 'minimized' : ''}`}>
        <button className='minimize-btn' onClick={toggleSidebar}>
          {isSidebarMinimized ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        {isSidebarMinimized ? (
          <div className='sidebar-logo'>
            <ul>
              <li>
                <button onClick={() => navigate('/dashboard')}>
                  <FaTachometerAlt size={20} />
                  {!isSidebarMinimized && 'Dashboard'}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/manage')}>
                  <FaCogs size={20} />
                  {!isSidebarMinimized && 'Manage Auctions'}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/bids')}>
                  <FaGavel size={20} />
                  {!isSidebarMinimized && 'Bids'}
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <ul>
            <li>
              <button onClick={() => navigate('/dashboard')}>
                {!isSidebarMinimized && 'Dashboard'}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/manage')}>
                {!isSidebarMinimized && 'Manage Auctions'}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/bids')}>
                {!isSidebarMinimized && 'Bids'}
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Main Content Area */}
      <div className='content'>
        {/* Navbar */}
        <div className='navbar'>
          <h1>A M</h1>
          <nav>
            <ul>
              <li className='profile'>
                <button className='profile-btn' onClick={toggleDropdown}>
                  <FaUserCircle size={30} />
                </button>
                {isDropdownOpen && (
                  <div className='dropdown'>
                    <ul>
                      <li>
                        <button
                          className='dropdown-item'
                          onClick={handleProfile}
                        >
                          Profile
                        </button>
                      </li>
                      <li>
                        <button
                          className='dropdown-item'
                          onClick={handleSettings}
                        >
                          Settings
                        </button>
                      </li>
                      <li>
                        <button
                          className='dropdown-item'
                          onClick={handleLogout}
                        >
                          Log Out
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>

        {/* Content Section */}
        <div className='main-content'>
          <h2>Welcome to the Settings</h2>
          {/* Add additional dashboard content here */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
