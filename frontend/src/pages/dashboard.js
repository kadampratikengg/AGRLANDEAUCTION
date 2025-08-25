import React, { useState, useEffect } from 'react';
import './App.css';
// import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ setIsAuthenticated, name }) => {
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Log environment variable for debugging
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

  // Fetch active events from backend
  useEffect(() => {
    const fetchActiveEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/events`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const events = await response.json();
        setActiveEvents(events);
      } catch (err) {
        setError('Failed to load events. Please try again later.');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveEvents();
    const interval = setInterval(fetchActiveEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleViewResults = (eventId) => {
    navigate(`/results/${eventId}`);
  };

  const handleDeleteEvent = async (id) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      setActiveEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error.message || 'There was an error deleting the event. Please try again.');
    }
  };

  // Reusable function to render events
  const renderEvents = (events, sectionTitle) => {
    if (loading) {
      return <p>Loading events...</p>;
    }
    if (error) {
      return <p>{error}</p>;
    }
    if (events.length === 0) {
      return <p>No {sectionTitle.toLowerCase()} available.</p>;
    }
    return events.map((event) => (
      <div key={event.id} className="current-event">
        <h4>{event.name}</h4>
        <p>{event.description}</p>
        <p>Date: {event.date}</p>
        <p>Start: {event.startTime} - Stop: {event.stopTime}</p>
        <a href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</a>
        <div className="event-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            className="delete-btn"
            onClick={() => handleDeleteEvent(event.id)}
            title="Delete Event"
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
          <button
            onClick={() => handleViewResults(event.id)}
            style={{
              background: '#2196F3',
              color: 'white',
              padding: '5px 10px',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            Results
          </button>
        </div>
      </div>
    ));
  };

  // Filter today's events
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = activeEvents.filter((event) => event.date === today);

  return (
    <div className="app-container">
      {/* <Navbar setIsAuthenticated={setIsAuthenticated} /> */}
      <div className="main-content">
        <Sidebar />
        <div className="content">
          <h2>Welcome to the Dashboard</h2>
          <div className="sections-container">
            <div className="current-section">
              <h3>Today Events</h3>
              {renderEvents(todayEvents, 'events today')}
            </div>
            <div className="current-section">
              <h3>All Events</h3>
              {renderEvents(activeEvents, 'events')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;