import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const localEvent = JSON.parse(localStorage.getItem(`event-${eventId}`));
        if (localEvent && localEvent.expiry > new Date().getTime()) {
          setEvent(localEvent);
          setLoading(false);
          checkVotingTime(localEvent);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch event');
        }

        const eventData = await response.json();
        setEvent(eventData);
        localStorage.setItem(`event-${eventId}`, JSON.stringify(eventData));
        setLoading(false);
        checkVotingTime(eventData);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const checkVotingTime = (eventData) => {
      if (eventData.date && eventData.startTime && eventData.stopTime) {
        // Combine date with startTime and stopTime into full datetime strings
        const [startHours, startMinutes] = eventData.startTime.split(':');
        const [stopHours, stopMinutes] = eventData.stopTime.split(':');
        const startDateTime = new Date(`${eventData.date}T${startHours}:${startMinutes}:00`).getTime();
        const stopDateTime = new Date(`${eventData.date}T${stopHours}:${stopMinutes}:00`).getTime();
        const now = new Date().getTime();
        setCanStartVoting(now >= startDateTime && now <= stopDateTime);
      }
    };

    fetchEvent();
  }, [eventId]);

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