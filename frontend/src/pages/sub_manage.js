import React, { useState, useEffect } from 'react';
import './dashboard.css';
import {
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
  FaTachometerAlt,
  FaCogs,
  FaGavel,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const Manage = ({ setIsAuthenticated }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('main');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [stopTime, setStopTime] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [fileData, setFileData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [candidateImages, setCandidateImages] = useState([]);
  const [checkedRows, setCheckedRows] = useState([]);
  const [eventCreated, setEventCreated] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setRole(decoded.role);
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchActiveEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/events`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const events = await response.json();
        setActiveEvents(events);
      } catch (err) {
        setError('Failed to load events. Please try again later.');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveEvents();
    const interval = setInterval(fetchActiveEvents, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateEvent = () => {
    setShowEventForm(true);
    setEditingEventId(null);
    setEventDate('');
    setStartTime('');
    setStopTime('');
    setEventName('');
    setEventDescription('');
    setFileData([]);
    setFileName('');
    setCandidateImages([]);
    setCheckedRows([]);
    setEventCreated(false);
    setGeneratedLink('');
  };

  const handleEditEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const event = await response.json();
      if (!response.ok) {
        throw new Error(event.message || 'Failed to fetch event');
      }
      setEditingEventId(eventId);
      setEventDate(event.date);
      setStartTime(event.startTime);
      setStopTime(event.stopTime);
      setEventName(event.name);
      setEventDescription(event.description);
      setFileData(event.fileData || []);
      setFileName('Uploaded File');
      setCandidateImages(
        event.candidateImages?.map((img) => ({
          candidateIndex: img.candidateIndex,
          dataUrl: `${process.env.REACT_APP_API_URL}${img.imagePath}`,
        })) || []
      );
      setCheckedRows(
        event.selectedData?.map((_, index) => index) || []
      );
      setShowEventForm(true);
      setEventCreated(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete event');
      }
      setActiveEvents(activeEvents.filter((event) => event.id !== eventId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setFileData(data);
        setCheckedRows([]);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCandidateImages((prev) => {
          const newImages = [...prev];
          newImages[index] = {
            candidateIndex: index,
            file,
            dataUrl: evt.target.result,
          };
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = (index) => {
    setCandidateImages((prev) => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });
  };

  const handleCheckboxChange = (index) => {
    setCheckedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleEventFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('date', eventDate);
      formData.append('startTime', startTime);
      formData.append('stopTime', stopTime);
      formData.append('name', eventName);
      formData.append('description', eventDescription);
      formData.append('selectedData', JSON.stringify(fileData.filter((_, i) => checkedRows.includes(i))));
      formData.append('fileData', JSON.stringify(fileData));
      formData.append('expiry', 60 * 60 * 24); // 24 hours
      const eventId = editingEventId || Date.now().toString();
      formData.append('id', eventId);
      formData.append('link', `${window.location.origin}/voting/${eventId}`);
      formData.append(
        'candidateImages',
        JSON.stringify(
          candidateImages
            .filter((img) => img)
            .map((img, i) => ({ candidateIndex: i }))
        )
      );
      candidateImages
        .filter((img) => img && img.file)
        .forEach((img) => {
          formData.append('images', img.file);
        });

      const url = editingEventId
        ? `${process.env.REACT_APP_API_URL}/api/events/${editingEventId}`
        : `${process.env.REACT_APP_API_URL}/api/events`;
      const method = editingEventId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save event');
      }

      setEventCreated(true);
      setGeneratedLink(data.link);
      setShowEventForm(false);
      setActiveEvents((prev) =>
        editingEventId
          ? prev.map((event) =>
              event.id === editingEventId ? { ...event, ...data } : event
            )
          : [...prev, data]
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewResults = (eventId) => {
    navigate(`/results/${eventId}`);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const toggleSidebar = () => {
    setIsSidebarMinimized((prevState) => !prevState);
  };

  return (
    <div className='dashboard'>
      <div className={`sidebar ${isSidebarMinimized ? 'minimized' : ''}`}>
        <button className='minimize-btn' onClick={toggleSidebar}>
          {isSidebarMinimized ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        <ul>
          {role === 'main' && (
            <>
              <li>
                <button onClick={() => navigate('/dashboard')}>
                  <FaTachometerAlt size={20} />
                  {!isSidebarMinimized && 'Dashboard'}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/manage')}>
                  <FaCogs size={20} />
                  {!isSidebarMinimized && 'Manage Auctions'}
                </button>
              </li>
            </>
          )}
          <li>
            <button onClick={() => navigate('/bids')}>
              <FaGavel size={20} />
              {!isSidebarMinimized && 'Bids'}
            </button>
          </li>
        </ul>
      </div>

      <div className='content'>
        <div className='navbar'>
          <h1>A M</h1>
          <nav>
            <ul>
              <li className='profile'>
                <button className='profile-btn' onClick={toggleDropdown}>
                  <FaUserCircle size={30} />
                </button>
                {isDropdownOpen && (
                  <div className='dropdown'>
                    <ul>
                      <li><button onClick={handleProfile}>Profile</button></li>
                      <li><button onClick={handleSettings}>Settings</button></li>
                      <li><button onClick={handleLogout}>Log Out</button></li>
                    </ul>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>

        <div className='main-content'>
          <h2>Manage</h2>
          {error && <p className='error-message'>{error}</p>}
          <div className="sections-container">
            <div className="current-section">
              <h3>All Events</h3>
              {loading ? (
                <p>Loading events...</p>
              ) : error ? (
                <p>{error}</p>
              ) : activeEvents.length === 0 ? (
                <p>No current events, auctions, or items.</p>
              ) : (
                activeEvents.map((event) => (
                  <div key={event.id} className="current-event">
                    <h4>{event.name}</h4>
                    <p>{event.description}</p>
                    <p>Date: {event.date}</p>
                    <p>Start: {event.startTime} - Stop: {event.stopTime}</p>
                    <a href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</a>
                    <div className="event-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      {role === 'main' && (
                        <>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteEvent(event.id)}
                            title="Delete Event"
                            style={{
                              background: '#ff4d4d',
                              color: 'white',
                              padding: '5px 10px',
                              border: 'none',
                              borderRadius: '5px',
                            }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleEditEvent(event.id)}
                            style={{
                              background: '#4CAF50',
                              color: 'white',
                              padding: '5px 10px',
                              border: 'none',
                              borderRadius: '5px',
                            }}
                          >
                            Edit
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewResults(event.id)}
                        style={{
                          background: '#2196F3',
                          color: 'white',
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '5px',
                        }}
                      >
                        Results
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {role === 'main' && (
              <div className="create-section">
                <h3>Create</h3>
                <button onClick={handleCreateEvent}>Create Event</button>

                {showEventForm && (
                  <div className="event-form-container">
                    <h3>{editingEventId ? 'Edit Event' : 'Create Event'}</h3>
                    <form onSubmit={handleEventFormSubmit}>
                      <label htmlFor="eventDate">Event Date:</label>
                      <input
                        type="date"
                        id="eventDate"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                      />

                      <label htmlFor="startTime">Start Time:</label>
                      <input
                        type="time"
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />

                      <label htmlFor="stopTime">Stop Time:</label>
                      <input
                        type="time"
                        id="stopTime"
                        value={stopTime}
                        onChange={(e) => setStopTime(e.target.value)}
                        required
                      />

                      <label htmlFor="eventName">Event Name:</label>
                      <input
                        type="text"
                        id="eventName"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                      />

                      <label htmlFor="eventDescription">Description:</label>
                      <textarea
                        id="eventDescription"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        required
                      />

                      <label htmlFor="fileUpload">Upload Excel File:</label>
                      <input
                        type="file"
                        id="fileUpload"
                        accept=".xlsx"
                        onChange={handleFileUpload}
                        style={{ marginTop: '10px' }}
                      />
                      <p>File Uploaded: {fileName || 'AllDetailsFile.xlsx'}</p>
                      <a href="../file/AllDetailsFile.xlsx" target="_blank" rel="noopener noreferrer">
                        Download Sample File
                      </a>

                      {fileData.length > 0 && (
                        <div>
                          <h4>Selected Candidates:</h4>
                          <table>
                            <thead>
                              <tr>
                                {Object.keys(fileData[0]).map((key) => (
                                  <th key={key}>{key}</th>
                                ))}
                                <th>Image</th>
                                <th>Check</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fileData.map((data, index) => (
                                <tr key={index}>
                                  {Object.values(data).map((value, i) => (
                                    <td key={i}>{value}</td>
                                  ))}
                                  <td>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(index, e)}
                                      style={{ margin: '5px 0' }}
                                    />
                                    {candidateImages[index] && (
                                      <div>
                                        <img
                                          src={candidateImages[index].dataUrl}
                                          alt={`Candidate ${index}`}
                                          style={{ maxWidth: '100px', margin: '5px 0' }}
                                        />
                                        <button
                                          onClick={() => handleClearImage(index)}
                                          style={{
                                            background: '#ff4d4d',
                                            color: 'white',
                                            padding: '5px 10px',
                                            border: 'none',
                                            borderRadius: '5px',
                                          }}
                                        >
                                          Clear Image
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={checkedRows.includes(index)}
                                      onChange={() => handleCheckboxChange(index)}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <button type="submit">{editingEventId ? 'Update Event' : 'Create Event'}</button>
                    </form>

                    {eventCreated && (
                      <div className="event-success">
                        <h4>Event {editingEventId ? 'Updated' : 'Created'} Successfully</h4>
                        <p>
                          Your event link:{' '}
                          <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                            {generatedLink}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manage;