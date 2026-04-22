import React, { useState, useEffect } from 'react';
import './Workspace.css';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiExternalLink, FiList, FiRefreshCw, FiTrash2, FiTrendingUp } from 'react-icons/fi';

const Dashboard = ({ setIsAuthenticated }) => {
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
        setError('Failed to load voting events. Please try again later.');
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
        throw new Error(errorData.message || 'Failed to delete voting event');
      }

      setActiveEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error.message || 'There was an error deleting the voting event. Please try again.');
    }
  };

  const renderEvents = (events, sectionTitle) => {
    if (loading) {
      return <div className="work-empty"><FiRefreshCw /> Loading voting events...</div>;
    }
    if (error) {
      return <div className="work-empty work-empty--error">{error}</div>;
    }
    if (events.length === 0) {
      return <div className="work-empty">No {sectionTitle.toLowerCase()} available.</div>;
    }
    return events.map((event) => (
      <article key={event.id} className="work-event-card">
        <div className="work-event-card__top">
          <div>
            <span className="work-pill"><FiCalendar /> {event.date}</span>
            <h3>{event.name}</h3>
          </div>
        </div>
        <p>{event.description}</p>
        <div className="work-event-meta">
          <span>Start {event.startTime}</span>
          <span>Stop {event.stopTime}</span>
        </div>
        <a className="work-link" href={event.link} target="_blank" rel="noopener noreferrer">
          <FiExternalLink /> Open voting link
        </a>
        <div className="work-actions">
          <button className="work-button work-button--danger" onClick={() => handleDeleteEvent(event.id)}>
            <FiTrash2 /> Delete
          </button>
          <button className="work-button work-button--primary" onClick={() => handleViewResults(event.id)}>
            <FiTrendingUp /> Results
          </button>
        </div>
      </article>
    ));
  };

  const today = new Date().toISOString().split('T')[0];
  const todayEvents = activeEvents.filter((event) => event.date === today);

  return (
    <div className="work-shell">
      <Sidebar setIsAuthenticated={setIsAuthenticated} />
      <main className="work-page">
        <section className="work-hero">
          <div>
            <span className="work-kicker"><FiList /> Voting Dashboard</span>
            <h1>Monitor voting activity in one place.</h1>
            <p>Track today&apos;s voting events, review all configured voting sessions, and open result views quickly.</p>
          </div>
          <div className="work-hero-stat">
            <strong>{activeEvents.length}</strong>
            <span>Total voting events</span>
          </div>
        </section>

        <section className="work-stats-grid">
          <div className="work-stat-card"><FiCalendar /><span>Today</span><strong>{todayEvents.length}</strong></div>
          <div className="work-stat-card"><FiList /><span>All Voting</span><strong>{activeEvents.length}</strong></div>
          <div className="work-stat-card"><FiTrendingUp /><span>Status</span><strong>{loading ? 'Syncing' : 'Ready'}</strong></div>
        </section>

        <section className="work-two-column">
          <div className="work-panel">
            <div className="work-panel__header">
              <span className="work-kicker">Today</span>
              <h2>Today&apos;s Voting</h2>
            </div>
            <div className="work-card-list">{renderEvents(todayEvents, 'voting today')}</div>
          </div>

          <div className="work-panel">
            <div className="work-panel__header">
              <span className="work-kicker">All Events</span>
              <h2>All Voting</h2>
            </div>
            <div className="work-card-list">{renderEvents(activeEvents, 'voting events')}</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
