import axios from 'axios';

export const initiatePayment = async (
  plan,
  email,
  userId,
  setErrorMessage,
  setLoading,
  navigate,
  callback,
  additionalData = {}
) => {
  if (!process.env.REACT_APP_RAZORPAY_KEY) {
    console.error('Razorpay key missing:', process.env.REACT_APP_RAZORPAY_KEY);
    setErrorMessage('Payment configuration error: Razorpay key is not set');
    setLoading(false);
    return;
  }

  if (!plan.total || !plan.duration || !plan.validityDays) {
    console.error('Invalid plan details:', plan);
    setErrorMessage('Invalid plan details');
    setLoading(false);
    return;
  }

  if (!email || (!userId && !additionalData.password)) {
    console.error('Missing user information:', { email, userId, additionalData });
    setErrorMessage('User information missing. Please log in or provide required details.');
    setLoading(false);
    navigate('/login');
    return;
  }

  setLoading(true);
  try {
    const orderPayload = {
      amount: plan.total * 100, // Convert to paise
      currency: 'INR',
    };
    console.log('Creating order with payload:', orderPayload);
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/create-order`,
      orderPayload,
      { withCredentials: true }
    );

    const { order_id, amount, currency } = response.data;
    console.log('Order response:', response.data);

    if (!order_id || !amount || !currency) {
      throw new Error('Invalid order response from server');
    }

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      amount,
      currency,
      name: 'A M',
      description: `Subscription for ${plan.duration}`,
      order_id,
      handler: async (response) => {
        try {
          const verifyPayload = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            email,
            userId,
            planDuration: plan.duration,
            amount: plan.total * 100, // Send amount in paise
            validityDays: plan.validityDays,
            ...additionalData,
          };
          console.log('Verifying payment with payload:', verifyPayload);
          const verifyResponse = await axios.post(
            `${process.env.REACT_APP_API_URL}/verify-payment`,
            verifyPayload,
            { withCredentials: true }
          );
          console.log('Verify payment response:', verifyResponse.data);

          if (verifyResponse.data.message === 'Payment verified and subscription updated') {
            localStorage.setItem('token', verifyResponse.data.token);
            localStorage.setItem('userId', verifyResponse.data.userId);
            localStorage.setItem('isAuthenticated', 'true');
            alert('Subscription successful! Payment receipt sent to your email.');
            callback();
          }
        } catch (error) {
          console.error('Payment verification error:', error.response?.data || error.message);
          setErrorMessage(error.response?.data?.message || `Payment verification failed: ${error.message}`);
          setLoading(false);
        }
      },
      prefill: { email },
      theme: { color: '#3399cc' },
    };

    console.log('Razorpay options:', options);
    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', (response) => {
      console.error('Payment failed:', response.error);
      setErrorMessage(`Payment failed: ${response.error.description || 'Unknown error'}`);
      setLoading(false);
    });
    razorpay.open();
  } catch (error) {
    console.error('Order creation error:', error.response?.data || error.message);
    setErrorMessage(error.response?.data?.message || `Failed to initiate payment: ${error.message}`);
    setLoading(false);
  }
};