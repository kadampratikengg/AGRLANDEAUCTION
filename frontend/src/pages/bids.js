import React, { useState } from 'react';
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

const Dashboard = ({ setIsAuthenticated }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTaluka, setSelectedTaluka] = useState('');
  const [addressline1, setAddressLine1] = useState('');
  const [pincode, setPincode] = useState('');

  const [itemName, setItemName] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderItems, setOrderItems] = useState([]);

  const navigate = useNavigate();

  const locationData = {
    Maharashtra: {
      Pune: {
        Hinjewadi: '411057',
        Wakad: '411057',
      },
      Mumbai: {
        Andheri: '400053',
        Borivali: '400066',
      },
      Satara: {
        Satara: '415001',
        Sadarbazar: '415002',
      },
    },
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedDistrict('');
    setSelectedTaluka('');
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setSelectedTaluka('');
  };

  const handleTalukaChange = (e) => {
    const taluka = e.target.value;
    setSelectedTaluka(taluka);
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleSidebar = () => setIsSidebarMinimized(!isSidebarMinimized);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleProfile = () => navigate('/profile');
  const handleSettings = () => navigate('/settings');

  const handleContactFormSubmit = (e) => {
    e.preventDefault();
    const fullAddress = `${selectedTaluka}, ${selectedDistrict}, ${selectedState}, India - ${pincode}`;
    console.log('Contact Form:', {
      businessName,
      ownerName,
      contactNumber,
      email,
      businessCategory,
      address: fullAddress,
    });
    alert('Contact form submitted!');
    setShowContactForm(false);
    resetContactForm();
  };

  const handleOrderFormSubmit = (e) => {
    e.preventDefault();
    const fullAddress = `${selectedTaluka}, ${selectedDistrict}, ${selectedState}, India - ${pincode}`;
    console.log('Order Form:', {
      businessName,
      ownerName,
      contactNumber,
      email,
      deliveryAddress: fullAddress,
      items: orderItems,
    });
    alert('Order form submitted!');
    setShowOrderForm(false);
    resetOrderForm();
  };

  const resetContactForm = () => {
    setBusinessName('');
    setOwnerName('');
    setContactNumber('');
    setEmail('');
    setBusinessCategory('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedTaluka('');
    setPincode('');
    setAddressLine1('');
  };

  const resetOrderForm = () => {
    setItemName('');
    setWeight('');
    setQuantity('');
    setDeliveryAddress('');
    setOrderItems([]);
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedTaluka('');
    setPincode('');
    setAddressLine1('');
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
              {!isSidebarMinimized && ' Dashboard'}
            </button>
          </li>
          <li>
            <button onClick={() => navigate('/manage')}>
              <FaCogs size={20} />
              {!isSidebarMinimized && ' Manage Auctions'}
            </button>
          </li>
          <li>
            <button onClick={() => navigate('/bids')}>
              <FaGavel size={20} />
              {!isSidebarMinimized && ' Bids'}
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
          <h2>Welcome to the Bids</h2>
          <div className='sections-container'>
            {/* Contact Form */}
            <div className='current-section'>
              <h3>Contact Section</h3>
              <button className='create-event-btn' onClick={() => {
                setShowContactForm(true);
                setShowOrderForm(false);
              }}>
                Open Contact Form
              </button>

              {showContactForm && (
                <div className='event-form-wrapper'>
                  <div className='event-form-container'>
                    <h3>Contact Form</h3>
                    <form onSubmit={handleContactFormSubmit}>
                      <label>Business Name</label>
                      <input type='text' value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                      <label>Owner's Name</label>
                      <input type='text' value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                      <label>Business Category</label>
                      <select value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} required>
                        <option value="">Select Category</option>
                        <option value="Kirana Store">Kirana Store</option>
                        <option value="Restaurant / Eatery">Restaurant / Eatery</option>
                        <option value="Hotel / Lodge">Hotel / Lodge</option>
                        <option value="Fast Food Center">Fast Food Center</option>
                        <option value="Bakery/Sweet Shop">Bakery/Sweet Shop</option>
                        <option value="Fruits & Vegetables Vendor">Fruits & Vegetables Vendor</option>
                        <option value="Tea Stall / Thela">Tea Stall / Thela</option>
                        <option value="Milk Dairy">Milk Dairy</option>
                        <option value="Pan Patti">Pan Patti</option>
                      </select>
                      <label>Contact Number</label>
                      <input type='tel' value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
                      <label>Email ID</label>
                      <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                      <label>Address</label>
                      <input type='text' value={addressline1} onChange={(e) => setAddressLine1(e.target.value)} required />
                      <label>State</label>
                      <select value={selectedState} onChange={handleStateChange} required>
                        <option value=''>Select State</option>
                        {Object.keys(locationData).map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <label>District</label>
                      <select value={selectedDistrict} onChange={handleDistrictChange} disabled={!selectedState} required>
                        <option value=''>Select District</option>
                        {selectedState && Object.keys(locationData[selectedState]).map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      <label>Taluka</label>
                      <select value={selectedTaluka} onChange={handleTalukaChange} disabled={!selectedDistrict} required>
                        <option value=''>Select Taluka</option>
                        {selectedDistrict && Object.keys(locationData[selectedState][selectedDistrict]).map((taluka) => (
                          <option key={taluka} value={taluka}>{taluka}</option>
                        ))}
                      </select>
                      <label>Pincode</label>
                      <input type='text' value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                      <button type="submit">Submit</button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Order Form */}
            <div className='create-section'>
              <h3>Order Section</h3>
              <button className='create-event-btn' onClick={() => {
                setShowOrderForm(true);
                setShowContactForm(false);
              }}>
                Open Order Form
              </button>

              {showOrderForm && (
                <div className='event-form-wrapper'>
                  <div className='event-form-container'>
                    <h3>Order Form</h3>
                    <form onSubmit={handleOrderFormSubmit}>
                      <label>Business Name</label>
                      <input type='text' value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                      <label>Owner's Name</label>
                      <input type='text' value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                      <label>Contact Number</label>
                      <input type='tel' value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
                      <label>Email ID</label>
                      <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                      
                      <label>Quantity</label>
                      <table>
  <thead>
    <tr>
      <th>Weight</th>
      <th>Quantity</th>
    </tr>
  </thead>
  <tbody>
    {[
      "100g",
      "200g",
      "250g",
      "500g",
      "1kg",
      "5kg",
      "10kg"
    ].map((weightOption) => (
      <tr key={weightOption}>
        <td>{weightOption}</td>
        <td>
          <input
            type="number"
            min="0"
            value={orderItems.find(item => item.weight === weightOption)?.quantity || 0}
            onChange={(e) => {
              const quantity = parseInt(e.target.value, 10);
              if (!isNaN(quantity)) {
                const updatedItems = [...orderItems];
                const existingItemIndex = updatedItems.findIndex(item => item.weight === weightOption);
                if (existingItemIndex >= 0) {
                  if (quantity === 0) {
                    updatedItems.splice(existingItemIndex, 1); // Remove if quantity is 0
                  } else {
                    updatedItems[existingItemIndex].quantity = quantity;
                  }
                } else if (quantity > 0) {
                  updatedItems.push({ weight: weightOption, quantity });
                }
                setOrderItems(updatedItems);
              }
            }}
          />
        </td>
      </tr>
    ))}
  </tbody>
</table>

{orderItems.length > 0 && (
  <div className="order-summary" style={{ marginTop: '20px' }}>
    <h4>Selected Items</h4>
    <ul>
      {orderItems.map((item, index) => (
        <li key={index}>
          {item.quantity} × {item.weight}
        </li>
      ))}
    </ul>
  </div>
)}





                      <label>Address</label>
                      <input type='text' value={addressline1} onChange={(e) => setAddressLine1(e.target.value)} required />
                      <label>State</label>
                      <select value={selectedState} onChange={handleStateChange} required>
                        <option value=''>Select State</option>
                        {Object.keys(locationData).map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <label>District</label>
                      <select value={selectedDistrict} onChange={handleDistrictChange} disabled={!selectedState} required>
                        <option value=''>Select District</option>
                        {selectedState && Object.keys(locationData[selectedState]).map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      <label>Taluka</label>
                      <select value={selectedTaluka} onChange={handleTalukaChange} disabled={!selectedDistrict} required>
                        <option value=''>Select Taluka</option>
                        {selectedDistrict && Object.keys(locationData[selectedState][selectedDistrict]).map((taluka) => (
                          <option key={taluka} value={taluka}>{taluka}</option>
                        ))}
                      </select>
                      <label>Pincode</label>
                      <input type='text' value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                      <button type='submit'>Submit</button>
                    </form>
                  </div>
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
