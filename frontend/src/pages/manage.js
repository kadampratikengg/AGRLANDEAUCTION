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

const Dashboard = ({ setIsAuthenticated, name }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [fileData, setFileData] = useState([]);
  const [checkedRows, setCheckedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isCreateEventClicked, setIsCreateEventClicked] = useState(false);
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
  const navigate = useNavigate();

  // Reset form after successful event creation or update
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
    setIsCreateEventClicked(false);
    setGeneratedLink('');
    setEventCreated(false);
    setEditingEventId(null);
    setCandidateImages({});
    setEventId(null);
  };

  // Resize image to approximately 5KB
  const resizeImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        let quality = 0.7;
        const targetSize = 5 * 1024;

        const ctx = canvas.getContext('2d');

        const tryResize = () => {
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob.size > targetSize && quality > 0.1) {
                quality -= 0.1;
                tryResize();
              } else if (blob.size > targetSize && width > 100) {
                width *= 0.9;
                height *= 0.9;
                tryResize();
              } else {
                const resizedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                const urlReader = new FileReader();
                urlReader.onload = () => {
                  callback(urlReader.result, resizedFile);
                };
                urlReader.readAsDataURL(resizedFile);
              }
            },
            'image/jpeg',
            quality
          );
        };

        tryResize();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload for a specific candidate
  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      resizeImage(file, (dataUrl, resizedFile) => {
        setCandidateImages((prev) => ({
          ...prev,
          [index]: { dataUrl, file: resizedFile },
        }));
      });
    } else {
      alert('Please upload a valid image file.');
    }
  };

  // Clear image for a specific candidate
  const handleClearImage = (index) => {
    setCandidateImages((prev) => {
      const newImages = { ...prev };
      delete newImages[index];
      return newImages;
    });
  };

  // Periodically clean up expired events and update active events
  useEffect(() => {
    const interval = setInterval(() => {
      const events = [];
      const currentTime = new Date().getTime();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('event-')) {
          const event = JSON.parse(localStorage.getItem(key));
          if (event.expiry > currentTime) {
            events.push(event);
          } else {
            localStorage.removeItem(key);
          }
        }
      }

      setActiveEvents(events);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleEditEvent = (eventId) => {
    const eventToEdit = activeEvents.find((e) => e.id === eventId);
    setEventDate(eventToEdit.date);
    setStartTime(eventToEdit.startTime);
    setStopTime(eventToEdit.stopTime);
    setEventName(eventToEdit.name);
    setEventDescription(eventToEdit.description);
    setSelectedData(eventToEdit.selectedData);
    setShowEventForm(true);
    setIsCreateEventClicked(true);
    setEditingEventId(eventId);
    setEventId(eventId);
    setCandidateImages(eventToEdit.candidateImages || {});
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
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

  const handleFileUpload = (e) => {
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
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Please upload a valid Excel (.xlsx) file.');
    }
  };

  const handleCheckboxChange = (index) => {
    setCheckedRows((prevCheckedRows) => {
      if (prevCheckedRows.includes(index)) {
        return prevCheckedRows.filter((rowIndex) => rowIndex !== index);
      } else {
        return [...prevCheckedRows, index];
      }
    });
  };

  const handleCreateEvent = () => {
    setIsCreateEventClicked(true);
    setEventId(uuidv4());
  };

  const handleNext = async () => {
    const selectedRows = checkedRows.map((index) => fileData[index]);
    setSelectedData(selectedRows);

    if (!editingEventId && !eventId) {
      alert('Event ID is missing. Please try again.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/excel-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: editingEventId || eventId,
          fileData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to store Excel data');
      }

      console.log('Excel data stored successfully');
      setShowEventForm(true);
    } catch (error) {
      console.error('Error storing Excel data:', error);
      alert('Failed to store Excel data: ' + error.message);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      localStorage.removeItem(`event-${id}`);
      setActiveEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error.message || 'There was an error deleting the event. Please try again.');
    }
  };

  const handleEventFormSubmit = async (e) => {
    e.preventDefault();

    if (!editingEventId && !eventId) {
      alert('Event ID is missing. Please try again.');
      return;
    }

    const expiryTime = new Date().getTime() + 60 * 60 * 1000;
    const currentEventId = editingEventId || eventId;

    const serializedCandidateImages = Object.keys(candidateImages).reduce((acc, index) => {
      acc[index] = { dataUrl: candidateImages[index].dataUrl };
      return acc;
    }, {});

    const eventDetails = {
      id: currentEventId,
      date: eventDate,
      startTime,
      stopTime,
      name: eventName,
      description: eventDescription,
      selectedData,
      expiry: expiryTime,
      link: `${window.location.origin}/voting/${currentEventId}`,
      candidateImages: serializedCandidateImages,
    };

    const formData = new FormData();
    formData.append('id', currentEventId);
    formData.append('date', eventDate);
    formData.append('startTime', startTime);
    formData.append('stopTime', stopTime);
    formData.append('name', eventName);
    formData.append('description', eventDescription);
    formData.append('selectedData', JSON.stringify(selectedData));
    formData.append('expiry', expiryTime);
    formData.append('link', `${window.location.origin}/voting/${currentEventId}`);
    formData.append('candidateImages', JSON.stringify(serializedCandidateImages));

    Object.values(candidateImages).forEach((image, index) => {
      if (image.file) {
        formData.append('images', image.file);
      }
    });

    try {
      const isEditing = !!editingEventId;
      const url = isEditing
        ? `http://localhost:5000/api/events/${editingEventId}`
        : 'http://localhost:5000/api/events';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} event: ${errorText}`);
      }

      const result = await response.json();

      localStorage.setItem(`event-${currentEventId}`, JSON.stringify(eventDetails));
      if (isEditing) {
        setActiveEvents((prev) =>
          prev.map((event) => (event.id === currentEventId ? eventDetails : event))
        );
      } else {
        setActiveEvents((prev) => [...prev, eventDetails]);
      }
      setGeneratedLink(result.link || eventDetails.link);
      setEventCreated(true);
      resetForm();
    } catch (error) {
      console.error(`Error ${editingEventId ? 'updating' : 'creating'} event:`, error);
      alert(error.message || `There was an error ${editingEventId ? 'updating' : 'creating'} the event. Please try again.`);
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
              {!isSidebarMinimized && 'Dashboard'}
            </button>
          </li>
          <li>
            <button onClick={() => navigate('/manage')}>
              <FaCogs size={20} />
              {!isSidebarMinimized && 'Manage Auctions'}
            </button>
          </li>
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
          <h2>Welcome to the Manage</h2>
          <div className="sections-container">
            <div className="current-section">
              <h3>Upcoming Event</h3>
              {activeEvents.length === 0 ? (
                <p>No current events, auctions, or items.</p>
              ) : (
                activeEvents.map((event) => (
                  <div key={event.id} className="current-event">
                    <span
                      className="delete-icon"
                      onClick={() => handleDeleteEvent(event.id)}
                      title="Delete Event"
                    >
                      🗑️
                    </span>
                    <h4>{event.name}</h4>
                    <p>{event.description}</p>
                    <p>Date: {event.date}</p>
                    <p>Start: {event.startTime} - Stop: {event.stopTime}</p>
                    <a href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</a>
                    <button onClick={() => handleEditEvent(event.id)}>Edit Event</button>
                  </div>
                ))
              )}
            </div>

            <div className="create-section">
              <h3>Create</h3>
              <button onClick={handleCreateEvent}>Create Event</button>
              <p>File Uploaded: {fileName}</p>
              <a href="../file/AllDetailsFile.xlsx" target="_blank" rel="noopener noreferrer">Download Sample File</a>

              {isCreateEventClicked && (
                <div className="upload-section">
                  <input type="file" accept=".xlsx" onChange={handleFileUpload} style={{ marginTop: '10px' }} />
                  {fileData.length > 0 && (
                    <div>
                      <h4>Uploaded Excel Data</h4>
                      <table>
                        <thead>
                          <tr>
                            {Object.keys(fileData[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                            <th>Check</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fileData.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value, i) => (
                                <td key={i}>{value}</td>
                              ))}
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
                      <button onClick={handleNext}>Next</button>
                    </div>
                  )}
                </div>
              )}

              {showEventForm && (
                <div className="event-form-container">
                  <h3>{editingEventId ? 'Edit Event' : 'Create Event'}</h3>
                  <h4>Selected Candidate:</h4>
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(selectedData[0] || {}).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                        <th>Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedData.map((data, index) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <form onSubmit={handleEventFormSubmit}>
                    <label htmlFor="eventDate">Event Date:</label>
                    <input
                      type="date"
                      id="eventDate"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />

                    <label htmlFor="startTime">Start Time:</label>
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />

                    <label htmlFor="stopTime">Stop Time:</label>
                    <input
                      type="time"
                      id="stopTime"
                      value={stopTime}
                      onChange={(e) => setStopTime(e.target.value)}
                    />

                    <label htmlFor="eventName">Event Name:</label>
                    <input
                      type="text"
                      id="eventName"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                    />

                    <label htmlFor="eventDescription">Description:</label>
                    <textarea
                      id="eventDescription"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                    />

                    <button type="submit">{editingEventId ? 'Update Event' : 'Create Event'}</button>
                  </form>

                  {eventCreated && (
                    <div className="event-success">
                      <h4>Event {editingEventId ? 'Updated' : 'Created'} Successfully</h4>
                      <p>Your event link: <a href={generatedLink} target="_blank" rel="noopener noreferrer">{generatedLink}</a></p>
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