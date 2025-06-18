import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Voting.css';

const Voting = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canStartVoting, setCanStartVoting] = useState(false);

  // Check if voting is within the allowed time window
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

  // Fetch event data from backend or cache
  const fetchEvent = useCallback(async (bypassCache = false) => {
    try {
      if (!bypassCache) {
        const localEvent = JSON.parse(localStorage.getItem(`event-${eventId}`));
        const now = new Date().getTime();
        if (localEvent && localEvent.expiry > now) {
          console.log('Using cached event data');
          setEvent(localEvent);
          checkVotingTime(localEvent);
          return;
        }
      }

      console.log('Fetching event from backend:', eventId);
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
      console.log('Received event data:', eventData);
      
      eventData.expiry = new Date().getTime() + 60 * 1000;
      setEvent(eventData);
      localStorage.setItem(`event-${eventId}`, JSON.stringify(eventData));
      setLoading(false);
      checkVotingTime(eventData);
    } catch (err) {
      console.error('Fetch error:', err.message);
      setError(err.message);
      setLoading(false);
    }
  }, [eventId, checkVotingTime]);

  useEffect(() => {
    fetchEvent(true);
    const interval = setInterval(() => fetchEvent(true), 60000); // Refresh every minute
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [fetchEvent]);

  // Render loading, error, or no event states
  if (loading) return <div className="voting-container">Loading...</div>;
  if (error) return <div className="voting-container">Error: {error}</div>;
  if (!event) return <div className="voting-container">Event not found</div>;

  // Get unique keys for table headers from selectedData
  const headers = event.selectedData && event.selectedData.length > 0
    ? Object.keys(event.selectedData[0])
    : [];

  return (
    <div className="voting-container">
      <h1>{event.name}</h1>
      <p><strong>Description:</strong> {event.description}</p>
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Time:</strong> {event.startTime} - {event.stopTime}</p>

      {/* Candidate Data Table */}
      <div className="candidate-table-container">
        <h2>Candidates</h2>
        {event.selectedData && event.selectedData.length > 0 ? (
          <table className="candidate-table">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {event.selectedData.map((candidate, index) => {
                const image = event.candidateImages?.find(
                  (img) => img.candidateIndex === index
                );
                return (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td key={header}>{candidate[header]}</td>
                    ))}
                    <td>
                      {image ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL}${image.imagePath}`}
                          alt={`Candidate ${index + 1}`}
                          className="candidate-image"
                        />
                      ) : (
                        <span className="no-image">No image</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No candidates available for this event.</p>
        )}
      </div>

      {/* Voting Action */}
      {canStartVoting ? (
        <button onClick={() => navigate(`/voting/${eventId}/start`)}>Start Voting</button>
      ) : (
        <p>Voting is not available at this time.</p>
      )}
    </div>
  );
};

export default Voting;