import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './result.css';

const Result = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch event and vote data from backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL;

      const eventResponse = await fetch(`${apiUrl}/api/events/${eventId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json();
        throw new Error(errorData.message || 'Failed to fetch event');
      }

      const eventData = await eventResponse.json();
      setEvent(eventData);

      const votesResponse = await fetch(`${apiUrl}/api/votes/${eventId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!votesResponse.ok) {
        const errorData = await votesResponse.json();
        throw new Error(errorData.message || 'Failed to fetch votes');
      }

      const votesData = await votesResponse.json();
      setVotes(votesData);
    } catch (err) {
      console.error('Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate vote counts
  const voteCounts = votes.reduce((acc, vote) => {
    acc[vote.candidate] = (acc[vote.candidate] || 0) + 1;
    return acc;
  }, {});

  const candidateResults = event?.selectedData?.map((candidate, index) => ({
    name: candidate.Name || `Candidate ${index + 1}`,
    votes: voteCounts[candidate.Name || `Candidate ${index + 1}`] || 0,
    image: event?.candidateImages?.find(img => img.candidateIndex === index)?.imagePath || null,
  })) || [];

  if (loading) return <div className="result-container">Loading...</div>;
  if (error) return <div className="result-container">Error: {error}</div>;
  if (!event) return <div className="result-container">Event not found</div>;

  return (
    <div className="result-container">
      <h1>{event.name} - Voting Results</h1>
      <p><strong>Description:</strong> {event.description}</p>
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Time:</strong> {event.startTime} - {event.stopTime}</p>

      <h2>Results</h2>
      {candidateResults.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Votes</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {candidateResults.map((candidate, index) => (
              <tr key={index}>
                <td>{candidate.name}</td>
                <td>{candidate.votes}</td>
                <td>
                  {candidate.image ? (
                    <img
                      src={`${process.env.REACT_APP_API_URL}/Uploads/${candidate.image.split('/').pop()}`}
                      alt={`Candidate ${candidate.name}`}
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
        <p>No candidates found for this event.</p>
      )}
    </div>
  );
};

export default Result;