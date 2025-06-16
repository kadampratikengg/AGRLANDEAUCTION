import React, { useState, useEffect } from 'react';
import './dashboard.css';
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
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [events, setEvents] = useState([]); // State to store events
  const [error, setError] = useState(null); // State for error handling
  const navigate = useNavigate();

  // Fetch all active events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`, // Include JWT token
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchEvents();
  }, []);

  // Toggle the dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token'); // Remove token on logout
    setIsAuthenticated(false);
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

  // Handle Delete Event
  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to delete event');
        }
        // Remove the deleted event from the state
        setEvents(events.filter((event) => event.id !== eventId));
        alert('Event deleted successfully');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Navigate to Results page
  const handleResult = (eventId) => {
    navigate(`/results/${eventId}`);
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
                        <button className='dropdown-item' onClick={handleProfile}>
                          Profile
                        </button>
                      </li>
                      <li>
                        <button className='dropdown-item' onClick={handleSettings}>
                          Settings
                        </button>
                      </li>
                      <li>
                        <button className='dropdown-item' onClick={handleLogout}>
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
          <h1>Dashboard</h1>

          {/* New 2 columns layout */}
          <div className="grid-container">
            <div className="grid-item">
              <h2>Events</h2>
              {error && <p className="error">{error}</p>}
              {events.length === 0 && !error ? (
                <p>No active events found.</p>
              ) : (
                <ul className="event-list">
                  {events.map((event) => (
                    <li key={event.id} className="event-item">
                      <div className="event-details">
                        <h3>{event.name}</h3>
                        <p><strong>Date:</strong> {event.date}</p>
                        <p><strong>Description:</strong> {event.description}</p>
                      </div>
                      <div className="event-actions">
                        <button
                          className="result-btn"
                          onClick={() => handleResult(event.id)}
                          style={{
                            background: '#2196F3',
                            color: 'white',
                            padding: '5px 10px',
                            border: 'none',
                            borderRadius: '5px',
                          }}
                        >
                          Result
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(event.id)}
                          style={{
                            background: '#ff4d4d',
                            color: 'white',
                            padding: '5px 10px',
                            border: 'none',
                            borderRadius: '5px',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="grid-item">
              <h2>Column 2</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;