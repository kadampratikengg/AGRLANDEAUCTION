import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Voting.css';

const Voting = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votingStarted, setVotingStarted] = useState(false);
  const [canStartVoting, setCanStartVoting] = useState(false);

  // Define checkVotingTime first
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

  // Then define fetchEvent
  const fetchEvent = useCallback(async (bypassCache = false) => {
    try {
      if (!bypassCache) {
        const localEvent = JSON.parse(localStorage.getItem(`event-${eventId}`));
        const now = new Date().getTime();
        if (localEvent && localEvent.expiry > now) {
          console.log('Using cached event data');
          setEvent(localEvent);
          checkVotingTime(localEvent); // No warning now
          return;
        }
      }

      console.log('Fetching event from backend:', eventId);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`, {
        headers: {
          'Content-Type': 'application/json',
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
    const intervalId = setInterval(() => fetchEvent(true), 5 * 1000);
    return () => clearInterval(intervalId);
  }, [eventId, fetchEvent]);

  const handleStartVoting = () => {
    console.log('Voting started at:', new Date().toLocaleTimeString());
    setVotingStarted(true);
    navigate(`/voting/${eventId}/start`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="voting-container">
      <h1>{event.name}</h1>
      <p><strong>Description:</strong> {event.description}</p>
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Time:</strong> {event.startTime} - {event.stopTime}</p>

      <h2>Uploaded File Data</h2>
      <p>
        Note: Full file data is not available unless stored by the backend. Displaying selected candidate data below.
      </p>

      <h2>Selected Candidates</h2>
      {event.selectedData && event.selectedData.length > 0 ? (
        <table>
          <thead>
            <tr>
              {Object.keys(event.selectedData[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {event.selectedData.map((data, index) => (
              <tr key={index}>
                {Object.values(data).map((value, i) => (
                  <td key={i}>{value}</td>
                ))}
                <td>
                  {event.candidateImages && event.candidateImages[index] ? (
                    <img
                      src={event.candidateImages[index].dataUrl}
                      alt={`Candidate ${index + 1}`}
                      style={{ maxWidth: '100px', height: 'auto' }}
                    />
                  ) : (
                    'No image'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No Candidates Selected.</p>
      )}

      {!votingStarted && canStartVoting ? (
        <button onClick={handleStartVoting} className="start-button">
          Start Voting
        </button>
      ) : votingStarted ? (
        <p className="started-text">Voting Has Started!</p>
      ) : (
        <p className="not-started-text">Voting Not Yet Available</p>
      )}
    </div>
  );
};

export default Voting;