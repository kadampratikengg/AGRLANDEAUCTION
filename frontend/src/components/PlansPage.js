import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { initiatePayment } from './razorpay';

const PlansPage = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPlanPopup, setShowPlanPopup] = useState(true);
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || '';
  const userId = state?.userId || '';

  const plans = [
    { duration: '1 Month', amount: 1000, gst: 0.2, total: 1200, validityDays: 30 },
    { duration: '3 Months', amount: 3000, gst: 0.2, total: 3600, validityDays: 90 },
    { duration: '6 Months', amount: 6000, gst: 0.2, total: 7200, validityDays: 180 },
  ];

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePlanSelect = (plan) => {
    initiatePayment(plan, email, userId, setErrorMessage, setLoading, navigate, () => navigate('/'));
    setShowPlanPopup(false);
  };

  return (
    <div className='plans-page'>
      <h2>Select a Subscription Plan</h2>
      {showPlanPopup && (
        <div className='plan-popup'>
          <div className='plan-popup-content'>
            <h3>Select a Subscription Plan</h3>
            {plans.map((plan) => (
              <div key={plan.duration} className='plan-option'>
                <button onClick={() => handlePlanSelect(plan)}>
                  {plan.duration} - ₹{plan.total} (₹{plan.amount} + 20% GST)
                </button>
              </div>
            ))}
            <button onClick={() => navigate('/login')}>Cancel</button>
          </div>
        </div>
      )}
      {errorMessage && <p className='error'>{errorMessage}</p>}
      <style>
        {`
          .plans-page {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
          }
          .plan-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }
          .plan-popup-content {
            background: white;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
          }
          .plan-option {
            margin: 10px 0;
          }
          .plan-option button {
            padding: 10px;
            width: 100%;
            background: #3399cc;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          .plan-option button:hover {
            background: #287aa9;
          }
          .plan-popup-content button:last-child {
            margin-top: 20px;
            background: #ccc;
            color: black;
          }
          .error {
            color: red;
            margin-top: 20px;
          }
        `}
      </style>
    </div>
  );
};

export default PlansPage;