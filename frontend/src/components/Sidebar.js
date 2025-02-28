import React from 'react';
import './Sidebar.css';
import { FaChevronLeft, FaChevronRight, FaHome } from 'react-icons/fa'; // Adding FaHome as a default logo/icon

const Sidebar = ({ isMinimized, toggleMinimize }) => {
  return (
    <div className={`sidebar ${isMinimized ? 'minimized' : ''}`}>
      <button className="minimize-btn" onClick={toggleMinimize}>
        {isMinimized ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      {/* Display logo when minimized */}
      {isMinimized ? (
        <div className="sidebar-logo">
          <FaHome size={30} color="white" />
        </div>
      ) : (
        <ul>
          <li>
            <button className="sidebar-link">Dashboard</button>
          </li>
          <li>
            <button className="sidebar-link">Manage Auctions</button>
          </li>
          <li>
            <button className="sidebar-link">Bids</button>
          </li>
          
        </ul>
      )}
    </div>
  );
};

export default Sidebar;
