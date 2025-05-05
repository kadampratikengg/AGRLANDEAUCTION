import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './start.css';

const Start = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [idInput, setIdInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [eventData, setEventData] = useState(null);

  // Fetch event data to get selected candidates
  const fetchEventData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event data');
      }
      const data = await response.json();
      setEventData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle ID verification
  const handleVerifyId = async () => {
    setError('');
    setVerificationResult(null);
    setVoteSubmitted(false);

    try {
      const response = await fetch(`http://localhost:5000/api/verify-id/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: idInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      const result = await response.json();
      setVerificationResult(result);
      if (result.verified) {
        await fetchEventData(); // Fetch event data only if ID is verified
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle candidate selection for voting
  const handleVoteSubmit = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate to vote for.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/vote/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voterId: idInput,
          candidate: selectedCandidate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      setVoteSubmitted(true);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className="voting-start-container">
      <h1>Started!</h1>
      

      <div className="id-verification">
        <h3>Verify Your ID</h3>
        <input
          type="text"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          placeholder="Enter your ID"
          className="id-input"
        />
        
        <button onClick={handleVerifyId} className="verify-button">
          Verify ID
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {verificationResult && (
        <div className="verification-result">
          <h3>Verification Status: {verificationResult.verified ? 'Verified' : 'Not Verified'}</h3>
          {verificationResult.verified && verificationResult.rowData ? (
            <div className="row-details">
              <h4>Voter Details:</h4>
              <table>
                <thead>
                  <tr>
                    {Object.keys(verificationResult.rowData).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Object.values(verificationResult.rowData).map((value, index) => (
                      <td key={index}>{value}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p>No matching ID found in the Excel data.</p>
          )}
        </div>
      )}

      {verificationResult?.verified && eventData?.selectedData && (
        <div className="voting-section">
          <h3>Select a Candidate to Vote</h3>
          <div className="candidates-list">
            {eventData.selectedData.map((candidate, index) => (
              <div key={index} className="candidate-card">
                <input
                  type="radio"
                  name="candidate"
                  value={candidate.Name || `Candidate ${index + 1}`}
                  checked={selectedCandidate === (candidate.Name || `Candidate ${index + 1}`)}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                />
                <div className="candidate-details">
                  {eventData.candidateImages && eventData.candidateImages[index] ? (
                    <img
                      src={`/uploads/${eventData.candidateImages[index].imagePath.split('/').pop()}`}
                      alt={`Candidate ${index + 1}`}
                      className="candidate-image"
                    />
                  ) : (
                    <p>No image</p>
                  )}
                  {Object.entries(candidate).map(([key, value]) => (
                    <p key={key}>
                      <strong>{key}:</strong> {value}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleVoteSubmit}
            className="submit-vote-button"
            disabled={voteSubmitted}
          >
            {voteSubmitted ? 'Vote Submitted' : 'Submit Vote'}
          </button>
        </div>
      )}

      {voteSubmitted && (
        <p className="success-message">Your vote has been successfully submitted!</p>
      )}

 
    </div>
  );
};

export default Start;