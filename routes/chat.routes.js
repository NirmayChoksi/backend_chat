const express = require('express');
const { getUserChats } = require('../controllers/chat.controller');

const router = express.Router();

router.get('/user', getUserChats);

module.exports = router;
