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
  const navigate = useNavigate();

  // Automatically remove expired events every 60 seconds
  useEffect(() => {
    const events = [];
    const currentTime = new Date().getTime();
  
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('event-')) {
        const event = JSON.parse(localStorage.getItem(key));
        if (event.expiry > currentTime) {
          events.push(event);
        } else {
          localStorage.removeItem(key); // Clean up expired
        }
      }
    }
  
    setActiveEvents(events);
  }, []);
  

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
  };

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
    setActiveEvents((events) => events.filter((e) => e.id !== eventId));
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
  };

  const handleNext = () => {
    const selectedRows = checkedRows.map((index) => fileData[index]);
    setSelectedData(selectedRows);
    setShowEventForm(true);
  };

  const handleDeleteEvent = (id) => {
    // Logic to remove the event from state or trigger backend deletion
    setActiveEvents(prevEvents => prevEvents.filter(event => event.id !== id));
  };
  

  const handleEventFormSubmit = async (e) => {
    e.preventDefault();
  
    const expiryTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour from now
    const eventId = uuidv4();
  
    const eventDetails = {
      id: eventId,
      date: eventDate,
      startTime,
      stopTime,
      name: eventName,
      description: eventDescription,
      selectedData,
      expiry: expiryTime,
      link: `${window.location.origin}/voting/${eventId}`,
    };
  
    try {
      // Send event to backend (MongoDB)
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventDetails),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save event to database');
      }
  
      const result = await response.json();
  
      // Optional: Still store in localStorage if needed
      localStorage.setItem(`event-${eventId}`, JSON.stringify(eventDetails));
  
      // Update UI
      setGeneratedLink(result.link || eventDetails.link);
      setEventCreated(true);
      setActiveEvents((prev) => [...prev, eventDetails]);
    } catch (error) {
      console.error('Error submitting event:', error);
      alert('There was an error creating the event. Please try again.');
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
                  <h3>Create Event</h3>
                  <h4>Selected Candidate:</h4>
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(selectedData[0] || {}).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedData.map((data, index) => (
                        <tr key={index}>
                          {Object.values(data).map((value, i) => (
                            <td key={i}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <form onSubmit={handleEventFormSubmit}>
                    <label>Date: <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></label>
                    <label>Start Time: <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label>
                    <label>Stop Time: <input type="time" value={stopTime} onChange={(e) => setStopTime(e.target.value)} /></label>
                    <label>Event Name: <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} /></label>
                    <label>Description: <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} /></label>
                    <button type="submit">Create Event</button>
                  </form>

                  {eventCreated && (
                    <div className="event-success-message">
                      <h4>✅ Event created successfully!</h4>
                      <p>Share this temporary voting link:</p>
                      <div className="copy-link-container">
                        <input type="text" value={generatedLink} readOnly />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLink);
                            alert('Link copied to clipboard!');
                            resetForm();
                          }}
                        >
                          Copy Link
                        </button>
                      </div>
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
