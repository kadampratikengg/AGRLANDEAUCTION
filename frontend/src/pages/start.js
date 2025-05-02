// src/components/VotingStartPage.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VotingStartPage.css'; // Optional: Create a CSS file for styling

const VotingStartPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const handleBackToEvent = () => {
    navigate(`/voting/${eventId}`);
  };

  return (
    <div className="voting-start-container">
      <h1>Voting Started!</h1>
      <p>Voting for the event has officially begun.</p>
      <p>Event ID: {eventId}</p>
      <button onClick={handleBackToEvent} className="back-button">
        Back to Event
      </button>
    </div>
  );
};

export default VotingStartPage;