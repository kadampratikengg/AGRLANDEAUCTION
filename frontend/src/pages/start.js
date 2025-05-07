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
  const [showVotePopup, setShowVotePopup] = useState(false);

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

  const handleVerifyId = async () => {
    setError('');
    setVerificationResult(null);
    setVoteSubmitted(false);
    setSelectedCandidate('');
    setHighlightedCandidate(null);
    setIsSubmitting(false);
    setShowVoterDetails(true);
    setShowVotePopup(false);

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
          setError('You have already voted for this event.');
          setTimeout(() => {
            setError('');
            setIdInput('');
            setVerificationResult(null);
          }, 3000);
        } else {
          await fetchEventData();
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCandidateSelect = async (candidateName, index) => {
    if (isSubmitting || voteSubmitted) return;

    setIsSubmitting(true);
    setSelectedCandidate(candidateName);
    setHighlightedCandidate(index);

    const beep = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');

    const handleVoteSubmission = async () => {
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

        // Reset back to ID verification view
        setTimeout(() => {
          setIdInput('');
          setVerificationResult(null);
          setVoteSubmitted(false);
          setSelectedCandidate('');
          setHighlightedCandidate(null);
          setShowVoterDetails(true);
          setShowVotePopup(false);
          setIsSubmitting(false);
        }, 1000);
      } catch (err) {
        setError(err.message);
        setIsSubmitting(false);
        setHighlightedCandidate(null);
      }
    };

    try {
      beep.play();
      beep.onended = handleVoteSubmission;
    } catch (err) {
      console.error('Error playing beep:', err);
      await handleVoteSubmission();
    }
  };

  const handleGoForVote = () => {
    setShowVoterDetails(false);
    setShowVotePopup(true);
  };

  return (
    <div className="voting-start-container">
      {showVoterDetails && (
        <>
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
                  {verificationResult.verified && !verificationResult.hasVoted && (
                    <button onClick={handleGoForVote} className="go-vote-button">
                      Go for Vote
                    </button>
                  )}
                </div>
              ) : (
                <p>No matching ID found in the Excel data.</p>
              )}
            </div>
          )}
        </>
      )}

      {showVotePopup && verificationResult?.verified && eventData?.selectedData && (
        <div className="vote-popup">
          <div className="vote-popup-content">
            <h3>Select a Candidate to Vote</h3>
            <div className="candidates-list-horizontal">
              {eventData.selectedData.slice(0, 5).map((candidate, index) => (
                <div
                  key={index}
                  className={`candidate-card-horizontal ${
                    selectedCandidate === (candidate.Name || `Candidate ${index + 1}`) ? 'selected' : ''
                  } ${highlightedCandidate === index ? 'highlighted' : ''}`}
                  onClick={() =>
                    handleCandidateSelect(candidate.Name || `Candidate ${index + 1}`, index)
                  }
                >
                  <div className="candidate-details">
                    {eventData.candidateImages && eventData.candidateImages[index] ? (
                      <img
                        src={`/uploads/${eventData.candidateImages[index].imagePath.split('/').pop()}`}
                        alt={`Candidate ${index + 1}`}
                        className="candidate-image-large"
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
        </div>
      )}

      {voteSubmitted && (
        <p className="success-message">Your vote has been successfully submitted!</p>
      )}
    </div>
  );
};

export default Start;
