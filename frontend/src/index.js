import React from 'react';
import ReactDOM from 'react-dom/client'; // Import createRoot from react-dom/client
import './index.css';
import App from './App';

// Get the root element
const rootElement = document.getElementById('root');

<script src="https://checkout.razorpay.com/v1/checkout.js"></script>


// Use createRoot to render the app
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
