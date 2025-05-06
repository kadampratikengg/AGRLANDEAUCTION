import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import './start.css';

const Start = () => {
  const { eventId } = useParams();
  const [idInput, setIdInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [showVoterDetails, setShowVoterDetails] = useState(true);
  const [highlightedCandidate, setHighlightedCandidate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setSelectedCandidate('');
    setHighlightedCandidate(null);
    setIsSubmitting(false);
    setShowVoterDetails(true);

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
        if (result.hasVoted) {
          // Voter has already voted
          setError('You have already voted for this event.');
          setTimeout(() => {
            setError('');
            setIdInput('');
            setVerificationResult(null);
          }, 3000); // Reset after 3 seconds
        } else {
          // Voter hasn't voted, proceed to fetch event data and show candidates
          await fetchEventData();
          setTimeout(() => {
            setShowVoterDetails(false);
          }, 10000);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle candidate selection and vote submission
  const handleCandidateSelect = async (candidateName, index) => {
    if (isSubmitting || voteSubmitted) return;

    setIsSubmitting(true);
    setSelectedCandidate(candidateName);
    setHighlightedCandidate(index);

    // Play beep sound
    const beep = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
    try {
      await beep.play();
    } catch (err) {
      console.error('Error playing beep:', err);
    }

    // Submit vote
    try {
      const response = await fetch(`http://localhost:5000/api/vote/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voterId: idInput,
          candidate: candidateName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      setVoteSubmitted(true);
      setError('');

      // Show success message for 3 seconds, then reset to Verify ID
      setTimeout(() => {
        setIdInput('');
        setVerificationResult(null);
        setVoteSubmitted(false);
        setSelectedCandidate('');
        setHighlightedCandidate(null);
        setShowVoterDetails(true);
        setIsSubmitting(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
      setHighlightedCandidate(null);
    }
  };

  return (
    <div className="voting-start-container">
      {showVoterDetails && (
        <>
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

          {verificationResult && !error && (
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
        </>
      )}

      {verificationResult?.verified && eventData?.selectedData && !showVoterDetails && (
        <div className="voting-section">
          <h3>Select a Candidate to Vote</h3>
          <div className="candidates-list">
            {eventData.selectedData.map((candidate, index) => (
              <div
                key={index}
                className={`candidate-card ${
                  selectedCandidate === (candidate.Name || `Candidate ${index + 1}`)
                    ? 'selected'
                    : ''
                } ${highlightedCandidate === index ? 'highlighted' : ''}`}
                onClick={() => handleCandidateSelect(candidate.Name || `Candidate ${index + 1}`, index)}
              >
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
        </div>
      )}

      {voteSubmitted && (
        <p className="success-message">Your vote has been successfully submitted!</p>
      )}
    </div>
  );
};

export default Start;