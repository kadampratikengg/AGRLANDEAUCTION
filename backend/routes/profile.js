const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Profile = require('../models/Profile');
const User = require('../models/User');
const router = express.Router();

// Get user profile
router.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
    }

    const userId = req.user.userId;
    if (!userId) {
      console.error('❌ User ID not found in token');
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    // Fetch user and populate profile
    const user = await User.findById(userId).populate('profile').lean();
    if (!user) {
      console.error('❌ User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = user.profile;
    if (!profile) {
      console.log('ℹ️ No profile found for user, creating default profile:', userId);
      // Create a default profile if none exists
      profile = new Profile({
        user: userId,
        username: user.email?.split('@')[0] || `user_${userId}`, // Fallback username
        name: '',
        organization: '',
        logo: '',
        contact: '',
        email: user.email || '',
        phone: '',
        address: '',
        state: '',
        district: '',
        pincode: '',
        gstNumber: '',
      });
      await profile.save();
      // Update user with profile reference
      await User.findByIdAndUpdate(userId, { profile: profile._id }, { new: true });
      console.log('✅ Default profile created for user:', userId);
    }

    res.status(200).json({
      username: profile.username,
      name: profile.name,
      organization: profile.organization,
      logo: profile.logo,
      contact: profile.contact,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      state: profile.state,
      district: profile.district,
      pincode: profile.pincode,
      gstNumber: profile.gstNumber,
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message, error.stack);
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

// Update user profile
router.put('/api/users', authenticateToken, async (req, res) => {
  try {
    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
    }

    const userId = req.user.userId;
    if (!userId) {
      console.error('❌ User ID not found in token');
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    // Fetch user and populate profile
    const user = await User.findById(userId).populate('profile');
    if (!user) {
      console.error('❌ User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = user.profile;
    if (!profile) {
      console.log('ℹ️ No profile found for user, creating new profile:', userId);
      profile = new Profile({ user: userId, username: user.email?.split('@')[0] || `user_${userId}` });
    }

    const {
      name,
      organization,
      logo,
      contact,
      email,
      phone,
      address,
      state,
      district,
      pincode,
      gstNumber,
    } = req.body;

    // Update profile fields only if provided
    profile.name = name !== undefined ? name : profile.name;
    profile.organization = organization !== undefined ? organization : profile.organization;
    profile.logo = logo !== undefined ? logo : profile.logo;
    profile.contact = contact !== undefined ? contact : profile.contact;
    profile.email = email !== undefined ? email : profile.email;
    profile.phone = phone !== undefined ? phone : profile.phone;
    profile.address = address !== undefined ? address : profile.address;
    profile.state = state !== undefined ? state : profile.state;
    profile.district = district !== undefined ? district : profile.district;
    profile.pincode = pincode !== undefined ? pincode : profile.pincode;
    profile.gstNumber = gstNumber !== undefined ? gstNumber : profile.gstNumber;

    await profile.save();

    if (!user.profile) {
      user.profile = profile._id;
      await user.save();
      console.log('✅ Profile linked to user:', userId);
    }

    res.status(200).json({
      username: profile.username,
      name: profile.name,
      organization: profile.organization,
      logo: profile.logo,
      contact: profile.contact,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      state: profile.state,
      district: profile.district,
      pincode: profile.pincode,
      gstNumber: profile.gstNumber,
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error.message, error.stack);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;