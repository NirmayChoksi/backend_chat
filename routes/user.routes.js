const express = require('express');
const { getUsers, getUser } = require('../controllers/user.controller'); // Adjust the path to your controller file

const router = express.Router();

// Route to get all users (excluding specific users)
router.get('/', getUsers);

// Route to get a specific user by ID
router.get('/:userId', getUser);

module.exports = router;
