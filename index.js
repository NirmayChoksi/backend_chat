const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const { initializeSocketIo } = require('./shared/chat'); // Import the socket handler
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const fileRoutes = require('./routes/file.routes');
const groupRoutes = require('./routes/group.routes');
const userRoutes = require('./routes/user.routes');
require('dotenv').config();

// Initialize the app
const app = express();
const server = http.createServer(app); // Create HTTP server to use with Socket.io

// Enable CORS
app.use(cors());

// Body-parser middleware to handle JSON bodies
app.use(bodyParser.json());

// Initialize Socket.io with the server
initializeSocketIo(server);

// Serve static files from the "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/file', fileRoutes);
app.use('/group', groupRoutes);
app.use('/user', userRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
});
