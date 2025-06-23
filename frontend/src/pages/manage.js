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
import { v4 as uuidv4 } from 'uuid';
import { Widget } from '@uploadcare/react-widget';

const Dashboard = ({ setIsAuthenticated, name }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [fileData, setFileData] = useState([]);
  const [checkedRows, setCheckedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedData, setSelectedData] = useState([]);
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [stopTime, setStopTime] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [eventCreated, setEventCreated] = useState(false);
  const [activeEvents, setActiveEvents] = useState([]);
  const [editingEventId, setEditingEventId] = useState(null);
  const [candidateImages, setCandidateImages] = useState({});
  const [eventId, setEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const uploadcarePublicKey = process.env.REACT_APP_UPLOADCARE_PUBLIC_KEY;

  const resetForm = () => {
    setFileName('');
    setFileData([]);
    setCheckedRows([]);
    setSelectedData([]);
    setShowEventForm(false);
    setEventDate('');
    setStartTime('');
    setStopTime('');
    setEventName('');
    setEventDescription('');
    setGeneratedLink('');
    setEventCreated(false);
    setEditingEventId(null);
    setCandidateImages({});
    setEventId(null);
  };

  const handleImageUpload = (index, fileInfo) => {
    if (fileInfo && fileInfo.uuid && fileInfo.cdnUrl) {
      setCandidateImages((prevImages) => ({
        ...prevImages,
        [index]: { uuid: fileInfo.uuid, cdnUrl: fileInfo.cdnUrl },
      }));
    } else {
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleClearImage = (index) => {
    setCandidateImages((prevImages) => {
      const newImages = { ...prevImages };
      delete newImages[index];
      return newImages;
    });
  };

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

  const handleEditEvent = async (eventId, event) => {
    const eventStartTime = new Date(`${event.date}T${event.startTime}`);
    const currentTime = new Date();
    
    if (eventStartTime <= currentTime) {
      alert('Event has already started and cannot be edited.');
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/events/${eventId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch event');
      const eventToEdit = await response.json();
      
      setEventDate(eventToEdit.date);
      setStartTime(eventToEdit.startTime);
      setStopTime(eventToEdit.stopTime);
      setEventName(eventToEdit.name);
      setEventDescription(eventToEdit.description);
      setSelectedData(eventToEdit.selectedData);
      setFileData(eventToEdit.fileData || []);
      setCheckedRows(
        eventToEdit.fileData
          ? eventToEdit.fileData
              .map((data, index) =>
                eventToEdit.selectedData.some((selected) =>
                  Object.keys(data).every((key) => selected[key] === data[key])
                )
                  ? index
                  : null
              )
              .filter((index) => index !== null)
          : []
      );
      setShowEventForm(true);
      setEditingEventId(eventId);
      setEventId(eventId);
      
      const images = {};
      eventToEdit.candidateImages.forEach((img) => {
        images[img.candidateIndex] = { uuid: img.uuid, cdnUrl: img.cdnUrl };
      });
      setCandidateImages(images);
    } catch (error) {
      console.error('Error fetching event for edit:', error);
      alert('Failed to load event for editing');
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setFileData(jsonData);
        setCheckedRows([]);
        setSelectedData([]);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Please upload a valid Excel (.xlsx) file.');
    }
  };

  const handleCheckboxChange = (index) => {
    setCheckedRows((prevCheckedRows) => {
      let updatedCheckedRows;
      if (prevCheckedRows.includes(index)) {
        updatedCheckedRows = prevCheckedRows.filter((rowIndex) => rowIndex !== index);
      } else {
        updatedCheckedRows = [...prevCheckedRows, index];
      }
      setSelectedData(updatedCheckedRows.map((rowIndex) => fileData[rowIndex]));
      return updatedCheckedRows;
    });
  };

  const handleCreateEvent = () => {
    const newEventId = uuidv4();
    setShowEventForm(true);
    setEventId(newEventId);
  };

  const handleDeleteEvent = async (id) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      setActiveEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error.message || 'There was an error deleting the event. Please try again.');
    }
  };

  const handleEventFormSubmit = async (e) => {
    e.preventDefault();

    const missingFields = [];
    if (!eventId && !editingEventId) missingFields.push('eventId');
    if (!eventDate) missingFields.push('date');
    if (!startTime) missingFields.push('startTime');
    if (!stopTime) missingFields.push('stopTime');
    if (!eventName) missingFields.push('name');
    if (!eventDescription) missingFields.push('description');
    if (!selectedData || !Array.isArray(selectedData) || selectedData.length === 0) missingFields.push('selectedData');
    if (!eventDate || !stopTime || !new Date(`${eventDate}T${stopTime}`).getTime()) missingFields.push('expiry');
    if (!window.location.origin) missingFields.push('link');

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    const expiryTime = new Date(`${eventDate}T${stopTime}`).getTime();
    const currentEventId = editingEventId || eventId;

    // Map candidateImages to match selectedData indices
    const serializedCandidateImages = checkedRows.map((rowIndex) => {
      const image = candidateImages[rowIndex];
      return {
        candidateIndex: checkedRows.indexOf(rowIndex), // Align with selectedData index
        uuid: image ? image.uuid : null,
        cdnUrl: image ? image.cdnUrl : null,
      };
    }).filter(img => img.uuid && img.cdnUrl); // Filter out null images

    console.log('Serialized Candidate Images:', serializedCandidateImages);

    const formData = new FormData();
    formData.append('id', currentEventId);
    formData.append('date', eventDate);
    formData.append('startTime', startTime);
    formData.append('stopTime', stopTime);
    formData.append('name', eventName);
    formData.append('description', eventDescription);
    formData.append('selectedData', JSON.stringify(selectedData));
    formData.append('fileData', JSON.stringify(fileData));
    formData.append('expiry', expiryTime.toString());
    formData.append('link', `${window.location.origin}/voting/${currentEventId}`);
    formData.append('candidateImages', JSON.stringify(serializedCandidateImages));

    try {
      const isEditing = !!editingEventId;
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `${apiUrl}/api/events/${editingEventId}`
        : `${apiUrl}/api/events`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} event: ${errorText}`);
      }

      const result = await response.json();

      const eventDetails = {
        id: currentEventId,
        date: eventDate,
        startTime,
        stopTime,
        name: eventName,
        description: eventDescription,
        selectedData,
        fileData,
        expiry: expiryTime,
        link: result.link || `${window.location.origin}/voting/${currentEventId}`,
        candidateImages: serializedCandidateImages,
      };

      setActiveEvents((prev) => {
        if (isEditing) {
          return prev.map((event) => (event.id === currentEventId ? eventDetails : event));
        }
        return [...prev, eventDetails];
      });
      
      setGeneratedLink(result.link || eventDetails.link);
      setEventCreated(true);
      resetForm();
    } catch (error) {
      console.error(`Error ${editingEventId ? 'updating' : 'creating'} event:`, error);
      alert(error.message || `Error ${editingEventId ? 'updating' : 'creating'} the event. Please try again.`);
    }
  };

  return (
    <div className='dashboard'>
      <div className={`sidebar ${isSidebarMinimized ? 'minimized' : ''}`}>
        <button className='minimize-btn' onClick={toggleSidebar}>
          {isSidebarMinimized ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        <ul>
          <li>
            <button onClick={() => navigate('/dashboard')}>
              <FaTachometerAlt size={20} />
              {!isSidebarMinimized && 'View'}
            </button>
          </li>
          <li>
            <button onClick={() => navigate('/manage')}>
              <FaCogs size={20} />
              {!isSidebarMinimized && 'Manage Events'}
            </button>
          </li>
          <li>
            <button onClick={() => navigate('/bids')}>
              <FaGavel />
              {!isSidebarMinimized && 'Home'}
            </button>
          </li>
        </ul>
      </div>

      <div className='content'>
        <div className='navbar'>
          <h1>Events</h1>
          <nav>
            <ul>
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
            </ul>
          </nav>
        </div>

        <div className='main-content'>
          <h2>Welcome</h2>
          <div className="sections-container">
            <div className="current-section">
              <div className='event-alignment'>
                <h3>Events</h3>
                {loading ? (
                  <p>Loading...</p>
                ) : error ? (
                    <p>{error}</p>
                  ) : activeEvents.length === 0 ? (
                    <p>No events.</p>
                  ) : (
                    activeEvents.map((event) => (
                      <div key={event.id} className='event'>
                        <h4>{event.name}</h4>
                        <p>{event.description}</p>
                        <p>Date: {event.date}</p>
                        <p>Start: {event.startTime} - Stop: {event.stopTime}</p>
                        <a href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</a>
                        <div className="event-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
                            onClick={() => handleEditEvent(event.id, event)}
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
            </div>

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
                      onChange={(e) => setStartTime(e.target.value)} // Fixed: Correctly update startTime
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
                                  {uploadcarePublicKey ? (
                                    <Widget
                                      publicKey={uploadcarePublicKey}
                                      onChange={(fileInfo) => handleImageUpload(index, fileInfo)}
                                      clearable
                                      imagesOnly
                                      crop="1:1"
                                      maxFileSize={2000000}
                                    />
                                  ) : (
                                    <p style={{ color: 'red' }}>
                                      Image upload disabled: Uploadcare public key missing. Check .env configuration.
                                    </p>
                                  )}
                                  {candidateImages[index] && (
                                    <div>
                                      <img
                                        src={candidateImages[index].cdnUrl}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;