import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Voting.css';
const Voting = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [images, setImages] = useState({});
  const [isStartTimeReached, setIsStartTimeReached] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(`event-${eventId}`));
    if (data) {
      setEventData(data);
      const now = new Date().getTime();
      const eventStart = new Date(`${data.date} ${data.startTime}`).getTime();
      if (now >= eventStart) {
        setIsStartTimeReached(true);
      }
    }
  }, [eventId]);

  if (!eventData) return <div>❌ Invalid event link.</div>;

  const now = new Date().getTime();
  if (now > eventData.expiry) return <div>⏰ This link has expired.</div>;

  const handleImageChange = (index, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImages(prev => ({ ...prev, [index]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleStart = () => {
    navigate(`/voting/${eventId}/start`);
  };

  return (
    <div className="voting-container">
      <h2>{eventData.name}</h2>
      <p>{eventData.description}</p>
      <p>Date: {eventData.date}</p>
      <p>Time: {eventData.startTime} - {eventData.stopTime}</p>

      <h4>Participants:</h4>
      <ul className="participant-list">
        {eventData.selectedData.map((entry, index) => (
          <li key={index}>
            {Object.values(entry).join(' - ')}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(index, e.target.files[0])}
              />
            </div>
            {images[index] && (
              <img
                src={images[index]}
                alt={`Participant ${index}`}
                style={{ width: '100px', marginTop: '0.5rem' }}
              />
            )}
          </li>
        ))}
      </ul>

      {isStartTimeReached && (
        <button className="start-now-btn" onClick={handleStart}>🚀 Start Now</button>
      )}
    </div>
  );
};

export default Voting;
