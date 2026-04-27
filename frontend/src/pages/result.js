import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiAward, FiCalendar, FiClock, FiImage, FiTrendingUp, FiUsers } from 'react-icons/fi';
import './result.css';
import { resolveStoredImageUrl } from '../utils/imageUrl';

const getCandidateImage = (images, index) =>
  images?.find(
    (img) =>
      Number(img.selectedIndex) === index || Number(img.candidateIndex) === index,
  );

const Result = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVotingComplete, setIsVotingComplete] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const s3BucketUrl = process.env.REACT_APP_S3_BUCKET_URL;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');

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

      const stopDateTime = new Date(`${eventData.date}T${eventData.stopTime}`);
      const currentDateTime = new Date();
      setIsVotingComplete(currentDateTime >= stopDateTime);

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const voteCounts = votes.reduce((acc, vote) => {
    acc[vote.candidate] = (acc[vote.candidate] || 0) + 1;
    return acc;
  }, {});

  const candidateResults = event?.selectedData?.map((candidate, index) => ({
    name: candidate.Name || `Candidate ${index + 1}`,
    votes: voteCounts[candidate.Name || `Candidate ${index + 1}`] || 0,
    image: resolveStoredImageUrl(
      getCandidateImage(event?.candidateImages, index),
      s3BucketUrl,
      apiUrl,
    ),
  })) || [];

  const totalVotes = votes.length;
  const winner = candidateResults.length > 0
    ? candidateResults.reduce((top, candidate) => candidate.votes > top.votes ? candidate : top, candidateResults[0])
    : null;

  if (loading) return <div className="result-shell"><div className="result-state-card">Loading voting results...</div></div>;
  if (error) return <div className="result-shell"><div className="result-state-card result-state-card--error">Error: {error}</div></div>;
  if (!event) return <div className="result-shell"><div className="result-state-card">Voting event not found.</div></div>;
  if (!isVotingComplete) {
    return (
      <main className="result-shell">
        <section className="result-hero">
          <span className="result-kicker"><FiClock /> Results Pending</span>
          <h1>{event.name}</h1>
          <p>Voting is still running. Results will be available after {event.stopTime} on {event.date}.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="result-shell">
      <section className="result-hero">
        <div>
          <span className="result-kicker"><FiTrendingUp /> Voting Results</span>
          <h1>{event.name}</h1>
          <p>{event.description}</p>
        </div>
        <div className="result-hero-card">
          <span><FiCalendar /> {event.date}</span>
          <strong><FiClock /> {event.startTime} - {event.stopTime}</strong>
        </div>
      </section>

      <section className="result-summary-grid">
        <div className="result-summary-card"><FiUsers /><span>Total Votes</span><strong>{totalVotes}</strong></div>
        <div className="result-summary-card"><FiAward /><span>Leading Candidate</span><strong>{winner?.name || 'No votes'}</strong></div>
        <div className="result-summary-card"><FiTrendingUp /><span>Candidates</span><strong>{candidateResults.length}</strong></div>
      </section>

      <section className="result-card">
        <div className="result-card-header">
          <span className="result-kicker">Final Count</span>
          <h2>Candidate Results</h2>
        </div>

        {candidateResults.length > 0 ? (
          <div className="result-table-wrap">
            <table className="result-table">
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
                    <td><strong>{candidate.votes}</strong></td>
                    <td>
                      {candidate.image ? (
                        <img
                          src={candidate.image}
                          alt={`Candidate ${candidate.name}`}
                          className="result-candidate-image"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="result-no-image"><FiImage /> No image</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="result-state-card">No candidates found for this voting event.</div>
        )}
      </section>
    </main>
  );
};

export default Result;
