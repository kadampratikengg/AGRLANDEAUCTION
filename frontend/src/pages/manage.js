import React, { useState } from 'react';
import './dashboard.css'; // This will include the merged CSS for both Navbar and Sidebar
import {
  FaUserCircle,
  FaChevronLeft,
  FaChevronRight,
  FaTachometerAlt,
  FaCogs,
  FaGavel,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Importing XLSX library to handle excel file parsing

const Dashboard = ({ setIsAuthenticated, name }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true); // Default state is minimized
  const [fileData, setFileData] = useState([]);
  const [checkedRows, setCheckedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isCreateEventClicked, setIsCreateEventClicked] = useState(false); // Track Create Event button click
  const [showEventForm, setShowEventForm] = useState(false); // Track when to show event form
  const [selectedData, setSelectedData] = useState([]); // Store selected rows for event creation
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [stopTime, setStopTime] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const navigate = useNavigate();

  // Toggle the dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  // Handle Logout
  const handleLogout = () => {
    // Remove authentication state from localStorage
    localStorage.removeItem('isAuthenticated');

    // Update the authentication state in App.js
    setIsAuthenticated(false);

    // Redirect to the Login page
    navigate('/');
  };

  // Navigate to Profile page
  const handleProfile = () => {
    navigate('/profile');
  };

  // Navigate to Settings page
  const handleSettings = () => {
    navigate('/settings');
  };

  // Toggle sidebar minimize state
  const toggleSidebar = () => {
    setIsSidebarMinimized((prevState) => !prevState);
  };

  // Handle file upload and parse the Excel file
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

  // Handle checkbox change (select/deselect row)
  const handleCheckboxChange = (index) => {
    setCheckedRows((prevCheckedRows) => {
      if (prevCheckedRows.includes(index)) {
        return prevCheckedRows.filter((rowIndex) => rowIndex !== index);
      } else {
        return [...prevCheckedRows, index];
      }
    });
  };

  // Function to handle event creation (display upload option)
  const handleCreateEvent = () => {
    setIsCreateEventClicked(true); // Show upload section when "Create Event" is clicked
  };

  // Handle "Next" button click to show selected rows
  const handleNext = () => {
    const selectedRows = checkedRows.map((index) => fileData[index]);
    setSelectedData(selectedRows);
    setShowEventForm(true); // Show the event form after "Next"
  };

  // Handle form submit for event creation
  const handleEventFormSubmit = (e) => {
    e.preventDefault();
    const eventDetails = {
      date: eventDate,
      startTime: startTime,
      stopTime: stopTime,
      name: eventName,
      description: eventDescription,
      selectedData,
    };

    // You can now store eventDetails or use it for further processing
    console.log(eventDetails);
  };

  return (
    <div className='dashboard'>
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarMinimized ? 'minimized' : ''}`}>
        <button className='minimize-btn' onClick={toggleSidebar}>
          {isSidebarMinimized ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        {isSidebarMinimized ? (
          <div className='sidebar-logo'>
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
        ) : (
          <ul>
            <li>
              <button onClick={() => navigate('/dashboard')}>
                {!isSidebarMinimized && 'Dashboard'}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/manage')}>
                {!isSidebarMinimized && 'Manage Auctions'}
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/bids')}>
                {!isSidebarMinimized && 'Bids'}
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Main Content Area */}
      <div className='content'>
        {/* Navbar */}
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
                      <li>
                        <button className='dropdown-item' onClick={handleProfile}>
                          Profile
                        </button>
                      </li>
                      <li>
                        <button className='dropdown-item' onClick={handleSettings}>
                          Settings
                        </button>
                      </li>
                      <li>
                        <button className='dropdown-item' onClick={handleLogout}>
                          Log Out
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>

        {/* Content Section */}
        <div className='main-content'>
          <h2>Welcome to the Manage</h2>

          {/* Add two sections "Current" and "Create" */}
          <div className="sections-container">
            <div className="current-section">
              <h3>Current</h3>
              <p>No current events, auctions, or items.</p>
            </div>
            <div className="create-section">
              <h3>Create</h3>
              <button className="create-event-btn" onClick={handleCreateEvent}>
                Create Event
              </button>
              <p>File Uploaded: {fileName}</p>
              <a
                href="../file/AllDetailsFile.xlsx"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Sample File
              </a>
              {/* Show file upload option after clicking "Create Event" */}
              {isCreateEventClicked && (
                <div className="upload-section">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileUpload}
                    style={{ marginTop: '10px' }}
                  />
                  {fileName && (
                    <div>
                      <p>File Uploaded: {fileName}</p>
                    </div>
                  )}

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
            </div>
          </div>

          {/* Show the event creation form if "Next" is clicked */}
          {showEventForm && (
            <div className="event-form-container">
              <h3>Create Event</h3>

              {/* Display selected rows in a table */}
              <h4>Selected Candidate:</h4>
              <table>
                <thead>
                  <tr>
                    {Object.keys(selectedData[0] || {}).map((key) => (
                      <th key={key}>{key}</th> // Display the headers of selected rows
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedData.map((data, index) => (
                    <tr key={index}>
                      {Object.values(data).map((value, i) => (
                        <td key={i}>{value}</td> // Render the values of the selected row
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <form onSubmit={handleEventFormSubmit}>
                <div>
                  <label>Date:</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div>
                  <label>Start Time:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label>Stop Time:</label>
                  <input
                    type="time"
                    value={stopTime}
                    onChange={(e) => setStopTime(e.target.value)}
                  />
                </div>
                <div>
                  <label>Event Name:</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>
                <div>
                  <label>Description:</label>
                  <textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                  />
                </div>
                <button type="submit">Create Event</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
