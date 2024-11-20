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
const { User } = require('./models/user.model');

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

app.post('/login', async (req, res) => {
  try {
    const { userName } = req.body;

    // Define avatar options
    const avatars = [
      'https://cdn-icons-png.flaticon.com/512/6997/6997662.png',
      'https://cdn-icons-png.flaticon.com/128/1999/1999625.png',
      'https://cdn-icons-png.flaticon.com/128/2202/2202112.png',
      'https://cdn-icons-png.flaticon.com/128/4333/4333609.png',
      'https://cdn-icons-png.flaticon.com/128/4140/4140047.png',
      'https://cdn-icons-png.flaticon.com/128/706/706830.png',
      'https://cdn-icons-png.flaticon.com/128/706/706816.png',
      'https://cdn-icons-png.flaticon.com/128/219/219970.png',
      'https://cdn-icons-png.flaticon.com/128/706/706831.png',
      'https://cdn-icons-png.flaticon.com/128/4139/4139951.png',
      'https://cdn-icons-png.flaticon.com/128/4140/4140040.png',
      'https://cdn-icons-png.flaticon.com/128/2552/2552801.png',
      'https://cdn-icons-png.flaticon.com/128/4140/4140051.png',
      'https://cdn-icons-png.flaticon.com/128/1154/1154473.png',
      'https://cdn-icons-png.flaticon.com/128/4140/4140077.png',
    ];

    // Check if the user already exists, case-insensitive search
    let user = await User.findOne({
      userName: { $regex: new RegExp('^' + userName + '$', 'i') },
    }).lean();

    if (!user) {
      // If user doesn't exist, create a new user with a random avatar
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      user = new User({
        userName,
        avatar: randomAvatar,
      });

      await user.save(); // Save the new user
    }

    // Return the user ID and userName (along with avatar if needed)
    return res.json({
      user: { ...user, _id: user._id.toString() },
    });
  } catch (error) {
    console.error('Error in login API:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

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
    const { userIds, name } = req.body;

    const users = await User.find({ _id: { $in: userIds } }).lean();
    if (userIds.length !== users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const avatars = [
      'https://cdn-icons-png.flaticon.com/128/1474/1474494.png',
      'https://cdn-icons-png.flaticon.com/128/6556/6556024.png',
      'https://cdn-icons-png.flaticon.com/128/4596/4596136.png',
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newGroup = new Group({ users: userIds, name, avatar: randomAvatar });
    await newGroup.save();

    return res.status(200).json({
      message: 'Group successfully created.',
      id: newGroup._id.toString(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error creating group' });
  }
});

app.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await User.find({ _id: { $ne: userId } }).lean();

    return res.json({
      users: users.map((u) => {
        return { ...u, _id: u._id.toString() };
      }),
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return res.status(500).json({ error: 'Error fetching chats' });
  }
});

app.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: { ...user, _id: user._id.toString() },
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return res.status(500).json({ error: 'Error fetching chats' });
  }
});

app.get('/user-chats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userGroups = await Group.find({ users: userId }, '_id').lean();
    const groupIds = userGroups.map((group) => group._id.toString());

    const chats = await Chat.find({
      $or: [{ to: user }, { from: user }, { to: { $in: groupIds } }],
      status: 'ACTIVE',
    })
      .sort({ createdAt: -1 })
      .populate('to')
      .populate('from')
      .lean();

    const userChats = {};

    chats.forEach((message) => {
      let key;
      let chatId;
      let avatar;
      if (message.toRef === 'Group') {
        key = message.to.name;
        chatId = message.to._id;
        avatar = message.to.avatar;
      } else {
        key =
          message.to._id.toString() === userId
            ? message.from.userName
            : message.to.userName;
        chatId =
          message.to._id.toString() === userId
            ? message.from._id
            : message.to._id;
        avatar =
          message.to._id.toString() === userId
            ? message.from.avatar
            : message.to.avatar;
      }

      if (!userChats[key]) {
        userChats[key] = [];
      }

      userChats[key].push({
        from: message.from.userName,
        message: message.content,
        createdAt: message.createdAt,
        isGroup: message.isGroup,
        chatId: chatId,
        avatar,
      });
    });

    userGroups.forEach((group) => {
      if (!userChats[group.name]) {
        userChats[group.name] = [
          {
            from: null,
            message: null,
            createdAt: null,
            isGroup: true,
            chatId: group._id,
            avatar: group.avatar,
          },
        ];
      }
    });

    return res.json({ chats: userChats });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return res.status(500).json({ error: 'Error fetching chats' });
  }
});

const MONGO_URI =
  'mongodb+srv://Nirmaychoksi:NirmayChoksi2002@cluster0.sq3jqlb.mongodb.net/VW_Chat_Database';

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
