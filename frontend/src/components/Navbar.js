import React, { useState } from 'react';
import './Navbar.css';
import { FaUserCircle } from 'react-icons/fa'; // Profile Icon
import { useNavigate } from 'react-router-dom'; // Use useNavigate for navigation in React Router v6

const Navbar = ({ toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate(); // Replace useHistory with useNavigate

  // Toggle the dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  // Handle Logout
  const handleLogout = () => {
    // Any necessary logout logic (e.g., clearing tokens, etc.)
    // Redirect to login page
    navigate('/login'); // Use navigate instead of history.push
  };

  return (
    <div className="navbar">
      <h1>Angular Minds</h1>
      <nav>
        <ul>
          <li className="profile">
            <button className="profile-btn" onClick={toggleDropdown}>
              <FaUserCircle size={30} />
            </button>
            {isDropdownOpen && (
              <div className="dropdown">
                <ul>
                  <li>
                    <button className="dropdown-item">Profile</button>
                  </li>
                  <li>
                    <button className="dropdown-item">Settings</button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
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
  );
};

export default Navbar;
