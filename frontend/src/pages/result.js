import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './result.css';

const Result = ({ setIsAuthenticated }) => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [voteResults, setVoteResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      console.log(`Fetching data for eventId: ${eventId}`);

      try {
        // Fetch event data
        const eventResponse = await fetch(`http://localhost:5000/api/events/${eventId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        if (!eventResponse.ok) {
          const contentType = eventResponse.headers.get('Content-Type');
          const errorText = await eventResponse.text();
          console.error('Event API error response:', errorText);
          let errorMessage = `Failed to fetch event data (Status: ${eventResponse.status})`;
          if (contentType && contentType.includes('application/json')) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } else {
            errorMessage = `Unexpected response format: ${errorText.slice(0, 50)}...`;
          }
          throw new Error(errorMessage);
        }
        const eventData = await eventResponse.json();
        console.log('Event data:', eventData);
        setEvent(eventData);

        // Fetch votes
        const votesResponse = await fetch(`http://localhost:5000/api/votes/${eventId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        if (!votesResponse.ok) {
          const contentType = votesResponse.headers.get('Content-Type');
          const errorText = await votesResponse.text();
          console.error('Votes API error response:', errorText);
          let errorMessage = `Failed to fetch votes (Status: ${votesResponse.status})`;
          if (contentType && contentType.includes('application/json')) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } else {
            errorMessage = `Unexpected response format: ${errorText.slice(0, 50)}...`;
          }
          throw new Error(errorMessage);
        }
        const votesData = await votesResponse.json();
        console.log('Votes data:', votesData);

        // Aggregate votes by candidate
        const voteCounts = {};
        votesData.forEach((vote) => {
          const candidate = vote.candidate;
          voteCounts[candidate] = (voteCounts[candidate] || 0) + 1;
        });

        // Map vote counts to include candidate details from event.selectedData
        const results = Object.keys(voteCounts).map((candidate) => {
          const candidateData = eventData.selectedData.find(
            (data) => data.Name === candidate || `Candidate ${data.index + 1}` === candidate
          );
          return {
            candidate: candidateData ? candidateData.Name || candidate : candidate,
            votes: voteCounts[candidate],
            details: candidateData || {},
          };
        });

        console.log('Vote results:', results);
        setVoteResults(results);
      } catch (err) {
        console.error('Error fetching data:', err.message);
        setError(err.message || 'An unexpected error occurred while fetching results');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  return (
    <div className="result-container">
      <h2>Voting Results</h2>
      {loading && <p className="loading-message">Loading results...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && event ? (
        <div className="event-details">
          <h3>{event.name || 'Unnamed Event'}</h3>
          <p>{event.description || 'No description available'}</p>
        </div>
      ) : (
        !loading && !error && <p className="no-event-message">Event not found.</p>
      )}
      {!loading && !error && voteResults.length > 0 ? (
        <div className="results-table">
          <h3>Vote Counts</h3>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Votes</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {voteResults.map((result, index) => (
                <tr key={index}>
                  <td>{result.candidate}</td>
                  <td>{result.votes}</td>
                  <td>
                    {Object.entries(result.details).map(([key, value]) => (
                      <p key={key}>
                        {key}: {value}
                      </p>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && !error && <p className="no-results-message">No votes recorded for this event.</p>
      )}
    </div>
  );
};

export default Result;