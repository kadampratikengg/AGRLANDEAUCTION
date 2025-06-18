const express = require('express');
const path = require('path');
const fs = require('fs');
const Event = require('../models/Event');
const Vote = require('../models/Vote');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/multer');
const router = express.Router();

// Fetch all events for authenticated user
router.get('/events', authenticateToken, async (req, res) => {
  console.log('📥 Fetching all events for user:', req.user.userId);
  try {
    const events = await Event.find({ userId: req.user.userId });
    res.status(200).json(events);
  } catch (error) {
    console.error('❌ Error fetching all events:', error);
    res.status(500).json({ message: 'Failed to fetch all events', error: error.message });
  }
});

// Fetch votes for an event
router.get('/votes/:eventId', authenticateToken, async (req, res) => {
  console.log('📥 Fetching votes for event:', req.params.eventId, 'by user:', req.user.userId);
  try {
    const event = await Event.findOne({ id: req.params.eventId, userId: req.user.userId });
    if (!event) {
      return res.status(403).json({ message: 'Unauthorized or event not found' });
    }
    const votes = await Vote.find({ eventId: req.params.eventId });
    res.status(200).json(votes);
  } catch (error) {
    console.error('❌ Error fetching votes:', error);
    res.status(500).json({ message: 'Failed to fetch votes', error: error.message });
  }
});

// Store Excel Data in Event
router.post('/excel-data', authenticateToken, async (req, res) => {
  console.log('📥 Excel data submission received:', req.body);

  const { eventId, fileData, timestamp } = req.body;

  if (!eventId || !fileData || !timestamp) {
    return res.status(400).json({ message: 'Missing required fields: eventId, fileData, timestamp' });
  }

  try {
    const event = await Event.findOneAndUpdate(
      { id: eventId, userId: req.user.userId },
      { $set: { fileData, timestamp } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }

    console.log('✅ Excel data updated for event:', event);
    res.status(201).json({ message: 'Excel data updated successfully' });
  } catch (error) {
    console.error('❌ Error updating Excel data:', error);
    res.status(500).json({ message: 'Failed to update Excel data', error: error.message });
  }
});

// Verify ID
router.post('/verify-id/:eventId', async (req, res) => {
  console.log('📥 ID verification request for event:', req.params.eventId, 'ID:', req.body.id);

  const { id } = req.body;
  const eventId = req.params.eventId;

  if (!id) {
    return res.status(400).json({ message: 'ID is required' });
  }

  try {
    const event = await Event.findOne({ id: eventId });
    console.log('🔍 Event found:', event);
    if (!event || !event.fileData) {
      return res.status(404).json({ message: 'No Excel data found for this event' });
    }

    const rowData = event.fileData.find((row) => {
      const values = Object.values(row);
      return values.length >= 2 && (values[1] === id || String(values[1]) === String(id));
    });

    console.log('🔍 RowData found:', rowData);
    if (!rowData) {
      return res.status(200).json({ message: 'ID not found in second column of Excel data', verified: false });
    }

    // Check if voter has already voted
    const existingVote = await Vote.findOne({ eventId, voterId: id });
    const hasVoted = !!existingVote;

    res.status(200).json({ verified: true, rowData, hasVoted });
  } catch (error) {
    console.error('❌ Error verifying ID:', error);
    res.status(500).json({ message: 'Failed to verify ID', error: error.message });
  }
});

// Submit Vote
router.post('/vote/:eventId', async (req, res) => {
  console.log('📥 Vote submission for event:', req.params.eventId, 'Data:', req.body);
  const { voterId, candidate } = req.body;
  const eventId = req.params.eventId;

  if (!voterId || !candidate) {
    return res.status(400).json({ message: 'Voter ID and candidate are required' });
  }

  try {
    const existingVote = await Vote.findOne({ eventId, voterId });
    if (existingVote) {
      return res.status(400).json({ message: 'This ID has already voted' });
    }

    const vote = new Vote({
      eventId,
      voterId,
      candidate,
      timestamp: new Date().toISOString(),
    });

    await vote.save();
    console.log('✅ Vote saved successfully:', vote);
    res.status(201).json({ message: 'Vote submitted successfully' });
  } catch (error) {
    console.error('❌ Error saving vote:', error);
    res.status(500).json({ message: 'Failed to submit vote', error: error.message });
  }
});

// Get Event
router.get('/events/:id', authenticateToken, async (req, res) => {
  console.log('📥 Event fetch request for ID:', req.params.id, 'by user:', req.user.userId);

  try {
    const event = await Event.findOne({ id: req.params.id, userId: req.user.userId });
    if (!event) {
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
});

// Create Event
router.post('/events', authenticateToken, upload.array('images', 10), async (req, res) => {
  console.log('📥 Event submission received:', {
    body: req.body,
    files: req.files ? req.files.map(file => ({ originalname: file.originalname, path: file.path })) : [],
  });

  const {
    id,
    date,
    startTime,
    stopTime,
    name,
    description,
    selectedData,
    candidateImages,
    expiry,
    link,
    fileData,
  } = req.body;

  const missingFields = [];
  if (!id) missingFields.push('id');
  if (!date) missingFields.push('date');
  if (!startTime) missingFields.push('startTime');
  if (!stopTime) missingFields.push('stopTime');
  if (!name) missingFields.push('name');
  if (!description) missingFields.push('description');
  if (!selectedData) missingFields.push('selectedData');
  if (!expiry) missingFields.push('expiry');
  if (!link) missingFields.push('link');

  if (missingFields.length > 0) {
    console.error('❌ Missing fields:', missingFields);
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    let parsedSelectedData, parsedCandidateImages, parsedFileData;
    try {
      parsedSelectedData = JSON.parse(selectedData);
      parsedCandidateImages = candidateImages ? JSON.parse(candidateImages) : [];
      parsedFileData = fileData ? JSON.parse(fileData) : [];
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      return res.status(400).json({ message: 'Invalid JSON format in selectedData, candidateImages, or fileData' });
    }

    if (!Array.isArray(parsedSelectedData) || parsedSelectedData.length === 0) {
      console.error('❌ Invalid selectedData:', parsedSelectedData);
      return res.status(400).json({ message: 'selectedData must be a non-empty array' });
    }

    console.log('🔍 Parsed candidateImages:', parsedCandidateImages);
    console.log('🔍 Uploaded files:', req.files ? req.files.map(f => f.path) : []);

    if (parsedCandidateImages.length > 0 && (!req.files || req.files.length !== parsedCandidateImages.length)) {
      console.error('❌ Mismatch between candidateImages and uploaded files');
      return res.status(400).json({
        message: `Expected ${parsedCandidateImages.length} image files, but received ${req.files ? req.files.length : 0}`,
      });
    }

    const imagePaths = parsedCandidateImages.map((img, index) => ({
      candidateIndex: img.candidateIndex,
      imagePath: req.files && req.files[index]
        ? path.join('Uploads', path.basename(req.files[index].path)).replace(/\\/g, '/')
        : img.imagePath || '',
    }));

    console.log('🔍 Final imagePaths to save:', imagePaths);

    const event = new Event({
      id,
      userId: req.user.userId,
      date,
      startTime,
      stopTime,
      name,
      description,
      selectedData: parsedSelectedData,
      fileData: parsedFileData,
      candidateImages: imagePaths,
      expiry: Number(expiry),
      link,
    });

    console.log('🧪 Validating event:', event);
    await event.validate();

    console.log('💾 Saving event to DB...');
    await event.save();

    console.log('✅ Event saved successfully:', event);
    res.status(201).json({ message: 'Event created successfully', link: event.link });
  } catch (error) {
    console.error('❌ Error saving event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// Update Event
router.put('/events/:id', authenticateToken, upload.array('images', 10), async (req, res) => {
  console.log('📥 Event update request for ID:', req.params.id, 'Data:', {
    body: req.body,
    files: req.files ? req.files.map(file => ({ originalname: file.originalname, path: file.path })) : [],
  });

  const {
    date,
    startTime,
    stopTime,
    name,
    description,
    selectedData,
    candidateImages,
    expiry,
    link,
    fileData,
  } = req.body;

  const missingFields = [];
  if (!date) missingFields.push('date');
  if (!startTime) missingFields.push('startTime');
  if (!stopTime) missingFields.push('stopTime');
  if (!name) missingFields.push('name');
  if (!description) missingFields.push('description');
  if (!selectedData) missingFields.push('selectedData');
  if (!expiry) missingFields.push('expiry');
  if (!link) missingFields.push('link');

  if (missingFields.length > 0) {
    console.error('❌ Missing fields:', missingFields);
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    let parsedSelectedData, parsedCandidateImages, parsedFileData;
    try {
      parsedSelectedData = JSON.parse(selectedData);
      parsedCandidateImages = candidateImages ? JSON.parse(candidateImages) : [];
      parsedFileData = fileData ? JSON.parse(fileData) : [];
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      return res.status(400).json({ message: 'Invalid JSON format in selectedData, candidateImages, or fileData' });
    }

    if (!Array.isArray(parsedSelectedData) || parsedSelectedData.length === 0) {
      console.error('❌ Invalid selectedData:', parsedSelectedData);
      return res.status(400).json({ message: 'selectedData must be a non-empty array' });
    }

    console.log('🔍 Parsed candidateImages:', parsedCandidateImages);
    console.log('🔍 Uploaded files:', req.files ? req.files.map(f => f.path) : []);

    if (parsedCandidateImages.length > 0 && (!req.files || req.files.length !== parsedCandidateImages.length)) {
      console.error('❌ Mismatch between candidateImages and uploaded files');
      return res.status(400).json({
        message: `Expected ${parsedCandidateImages.length} image files, but received ${req.files ? req.files.length : 0}`,
      });
    }

    const imagePaths = parsedCandidateImages.map((img, index) => ({
      candidateIndex: img.candidateIndex,
      imagePath: req.files && req.files[index]
        ? path.join('Uploads', path.basename(req.files[index].path)).replace(/\\/g, '/')
        : img.imagePath || '',
    }));

    console.log('🔍 Final imagePaths to save:', imagePaths);

    const existingEvent = await Event.findOne({ id: req.params.id, userId: req.user.userId });
    if (!existingEvent) {
      console.error('❌ Event not found or unauthorized for ID:', req.params.id);
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }
    if (existingEvent.candidateImages) {
      for (const image of existingEvent.candidateImages) {
        if (image.imagePath && fs.existsSync(image.imagePath)) {
          try {
            fs.unlinkSync(image.imagePath);
            console.log(`🗑️ Deleted old image: ${image.imagePath}`);
          } catch (err) {
            console.error(`❌ Error deleting old image ${image.imagePath}:`, err);
          }
        }
      }
    }

    const event = await Event.findOneAndUpdate(
      { id: req.params.id, userId: req.user.userId },
      {
        date,
        startTime,
        stopTime,
        name,
        description,
        selectedData: parsedSelectedData,
        fileData: parsedFileData,
        candidateImages: imagePaths,
        expiry: Number(expiry),
        link,
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      console.error('❌ Event not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('✅ Event updated successfully:', event);
    res.status(200).json({ message: 'Event updated successfully', link: event.link });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
});

// Delete Event
router.delete('/events/:id', authenticateToken, async (req, res) => {
  console.log('📥 Event deletion request for ID:', req.params.id, 'by user:', req.user.userId);

  try {
    const event = await Event.findOneAndDelete({ id: req.params.id, userId: req.user.userId });

    if (!event) {
      console.error('❌ Event not found or unauthorized for ID:', req.params.id);
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }

    if (event.candidateImages) {
      for (const image of event.candidateImages) {
        if (image.imagePath && fs.existsSync(image.imagePath)) {
          try {
            fs.unlinkSync(image.imagePath);
            console.log(`🗑️ Deleted image: ${image.imagePath}`);
          } catch (err) {
            console.error(`❌ Error deleting image ${image.imagePath}:`, err);
          }
        }
      }
    }

    await Vote.deleteMany({ eventId: req.params.id });
    console.log(`🗑️ Deleted votes for event: ${req.params.id}`);

    console.log('✅ Event and associated fileData deleted successfully:', event);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
});

module.exports = router;