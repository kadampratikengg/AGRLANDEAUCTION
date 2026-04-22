import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiImage, FiPlay, FiUsers } from 'react-icons/fi';
import './Voting.css';

const Voting = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canStartVoting, setCanStartVoting] = useState(false);

  const checkVotingTime = useCallback((eventData) => {
    if (eventData.date && eventData.startTime && eventData.stopTime) {
      const [startHours, startMinutes] = eventData.startTime.split(':');
      const [stopHours, stopMinutes] = eventData.stopTime.split(':');
      const startDateTime = new Date(`${eventData.date}T${startHours}:${startMinutes}:00`).getTime();
      const stopDateTime = new Date(`${eventData.date}T${stopHours}:${stopMinutes}:00`).getTime();
      const now = new Date().getTime();
      setCanStartVoting(now >= startDateTime && now <= stopDateTime);
    }
  }, []);

  const fetchEvent = useCallback(async (bypassCache = false) => {
    try {
      if (!bypassCache) {
        const localEvent = JSON.parse(localStorage.getItem(`event-${eventId}`));
        const now = new Date().getTime();
        if (localEvent && localEvent.expiry > now) {
          setEvent(localEvent);
          checkVotingTime(localEvent);
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch event');
      }

      const eventData = await response.json();
      eventData.expiry = new Date().getTime() + 60 * 1000;
      setEvent(eventData);
      localStorage.setItem(`event-${eventId}`, JSON.stringify(eventData));
      checkVotingTime(eventData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, checkVotingTime]);

  useEffect(() => {
    fetchEvent(true);
    const interval = setInterval(() => fetchEvent(true), 60000);
    return () => clearInterval(interval);
  }, [fetchEvent]);

  if (loading) return <div className="vote-public-shell"><div className="vote-state-card">Loading voting event...</div></div>;
  if (error) return <div className="vote-public-shell"><div className="vote-state-card vote-state-card--error">Error: {error}</div></div>;
  if (!event) return <div className="vote-public-shell"><div className="vote-state-card">Voting event not found.</div></div>;

  const headers = event.selectedData && event.selectedData.length > 0
    ? Object.keys(event.selectedData[0])
    : [];

  return (
    <main className="vote-public-shell">
      <section className="vote-hero">
        <div>
          <span className="vote-kicker"><FiUsers /> Voting Event</span>
          <h1>{event.name}</h1>
          <p>{event.description}</p>
        </div>
        <div className="vote-hero-card">
          <span><FiCalendar /> {event.date}</span>
          <strong><FiClock /> {event.startTime} - {event.stopTime}</strong>
        </div>
      </section>

      <section className="vote-summary-grid">
        <div className="vote-summary-card"><FiUsers /><span>Candidates</span><strong>{event.selectedData?.length || 0}</strong></div>
        <div className="vote-summary-card"><FiCalendar /><span>Date</span><strong>{event.date}</strong></div>
        <div className="vote-summary-card"><FiClock /><span>Status</span><strong>{canStartVoting ? 'Open' : 'Closed'}</strong></div>
      </section>

      <section className="vote-card">
        <div className="vote-card-header">
          <div>
            <span className="vote-kicker">Ballot Preview</span>
            <h2>Candidates</h2>
          </div>
          {canStartVoting && (
            <button className="vote-primary-button" onClick={() => navigate(`/voting/${eventId}/start`)}>
              <FiPlay /> Start Voting
            </button>
          )}
        </div>

        {event.selectedData && event.selectedData.length > 0 ? (
          <div className="vote-table-wrap">
            <table className="vote-table">
              <thead>
                <tr>
                  {headers.map((header) => <th key={header}>{header}</th>)}
                  <th>Image</th>
                </tr>
              </thead>
              <tbody>
                {event.selectedData.map((candidate, index) => {
                  const image = event.candidateImages?.find((img) => Number(img.candidateIndex) === index);
                  return (
                    <tr key={index}>
                      {headers.map((header) => <td key={header}>{candidate[header]}</td>)}
                      <td>
                        {image && image.cdnUrl ? (
                          <img
                            src={image.cdnUrl}
                            alt={`Candidate ${index + 1}`}
                            className="vote-candidate-image"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="vote-no-image"><FiImage /> No image</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="vote-state-card">No candidates available for this voting event.</div>
        )}

        {!canStartVoting && (
          <div className="vote-closed-note">Voting is not available at this time.</div>
        )}
      </section>
    </main>
  );
};

export default Voting;
