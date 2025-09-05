import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { initiatePayment } from './razorpay';
import './PlansPage.css';

const PlansPage = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { state } = useLocation();

  const email = state?.email || '';
  const userId = state?.userId || '';
  const password = state?.password || '';
  const confirmPassword = state?.confirmPassword || '';

  const plans = [
    { duration: '1 Month', amount: 1000, validityDays: 30, description: 'Basic plan for short-term usage.' },
    { duration: '3 Month', amount: 3000, validityDays: 90, description: 'Standard plan with better savings.' },
    { duration: '6 Month', amount: 6000, validityDays: 180, description: 'Best value for long-term users.' },
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
    const gst = plan.amount * 0.18;
    const txCharge = plan.amount * 0.02;
    const total = plan.amount + gst + txCharge;

    const updatedPlan = {
      ...plan,
      gst,
      txCharge,
      total,
    };

    initiatePayment(
      updatedPlan,
      email,
      userId,
      setErrorMessage,
      setLoading,
      navigate,
      () => navigate('/'),
      { password, confirmPassword }
    );
  };

  return (
    <div className="plans-page">
      <h2 className="plans-title">Choose Your Subscription Plan</h2>
      <div className="plans-container">
        {plans.map((plan) => {
          const gst = plan.amount * 0.18;
          const txCharge = plan.amount * 0.02;
          const total = plan.amount + gst + txCharge;

          return (
            <div key={plan.duration} className="plan-card">
              <h3>{plan.duration.charAt(0).toUpperCase() + plan.duration.slice(1)}</h3>
              <p className="plan-price">₹{total.toFixed(2)}</p>
              <p className="plan-subtext">Base Price: ₹{plan.amount}</p>
              <p className="plan-subtext">+ 18% GST: ₹{gst.toFixed(2)}</p>
              <p className="plan-subtext">+ 2% Transaction Charge: ₹{txCharge.toFixed(2)}</p>
              <p className="plan-validity">Validity: {plan.validityDays} days</p>
              <p className="plan-description">{plan.description}</p>
              <button 
                onClick={() => handlePlanSelect(plan)} 
                disabled={loading}
              >
                {loading ? "Processing..." : "Choose Plan"}
              </button>
            </div>
          );
        })}
      </div>
      {errorMessage && <p className="error">{errorMessage}</p>}
    </div>
  );
};

export default PlansPage;