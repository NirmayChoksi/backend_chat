const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const http = require('http');
const { initializeSocketIo } = require('./shared/chat'); // Import the socket handler
const { Group } = require('./models/group.model');
const { Chat } = require('./models/chat.model');

// Initialize the app
const app = express();
const server = http.createServer(app); // Create HTTP server to use with Socket.io

// Enable CORS
app.use(cors());

// Body-parser middleware to handle JSON bodies
app.use(bodyParser.json());

// Set up multer to store uploaded files in the "uploads" folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads'; // Specify the upload directory
    // Check if the 'uploads' directory exists, if not, create it
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir); // Save the file to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    console.log('file.originalname:', file.originalname);
    cb(
      null,
      `${new Date().toISOString().replace(/:/g, '-')} - ${file.originalname}`
    ); // Use timestamp to avoid filename collisions
  },
});

// Only accept jpeg images
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG images are allowed!'), false);
  }
};

// Multer setup
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max file size 5MB
  fileFilter: fileFilter,
});

// Serve static files from the "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route to upload images
app.post('/upload', upload.array('images', 5), (req, res) => {
  if (!req.files) {
    return res.status(400).send('No files uploaded');
  }

  // Send a success response with the uploaded file information
  res.json({
    message: 'Files uploaded successfully',
    files: req.files.map(
      (file) => `https://backend-chat-6wdi.onrender.com/${file.path}`
    ), // Only send the filepath
  });
});

app.delete('/delete-file', async (req, res) => {
  const { imagePath } = req.query;

  if (!imagePath) {
    return res.status(400).json({ error: 'Image path is required' });
  }

  const fullPath = path.resolve(
    imagePath.replace('https://backend-chat-6wdi.onrender.com:3000/', '')
  );

  try {
    // Check if file exists before attempting to delete
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return res.status(200).json({ message: 'File deleted successfully' });
    } else {
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while deleting the file' });
  }
});

app.post('/create-group', async (req, res) => {
  try {
    const { users, name } = req.body;
    const newGroup = new Group({ users, name });

    await newGroup.save();

    return res
      .status(200)
      .json({ message: 'Group successfully created.', id: newGroup.id });
  } catch (error) {
    return res.status(500).json({ error: 'Error creating group' });
  }
});

app.get('/user-chats/:user', async (req, res) => {
  try {
    const { user } = req.params;

    // Fetch group IDs where the user is a member
    const userGroups = await Group.find({ users: user }, '_id');
    const groupIds = userGroups.map((group) => group._id.toString()); // Ensure group IDs are in string format

    // Fetch active chats involving the user (both individual and group chats)
    const chats = await Chat.find({
      $or: [
        { to: user }, // Messages received by the user
        { from: user }, // Messages sent by the user
        { to: { $in: groupIds } }, // Group messages where the user is a member
      ],
      status: 'ACTIVE', // Only active messages
    })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    // Helper function to generate a unique identifier for a chat
    const getChatIdentifier = (message) => {
      if (message.isGroup) {
        return message.to.toString(); // For group messages, use the group ID
      } else {
        // For individual messages, combine `from` and `to` to form a unique identifier
        return [message.from, message.to].sort().join('-');
      }
    };

    // Deduplicate chats to get the latest message for each conversation (either individual or group)
    const latestChats = [];
    const seenChats = new Set();

    chats.forEach((message) => {
      const chatIdentifier = getChatIdentifier(message);

      if (!seenChats.has(chatIdentifier)) {
        seenChats.add(chatIdentifier);
        latestChats.push(message);
      }
    });

    return res.json({ chats: latestChats });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return res.status(500).json({ error: 'Error fetching chats' });
  }
});

// Connect to MongoDB
const MONGO_URI =
  'mongodb+srv://Nirmaychoksi:NirmayChoksi2002@cluster0.sq3jqlb.mongodb.net/VW_Database';

mongoose.connect(MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
});

// Initialize Socket.io with the server
initializeSocketIo(server);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
