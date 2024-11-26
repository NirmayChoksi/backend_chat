const express = require('express');
const {
  uploadFile,
  upload,
  deleteFile,
} = require('../controllers/file.controller');

const router = express.Router();

// Route to upload files
router.post('/upload', upload.array('images', 5), uploadFile);

// Route to delete a file
router.delete('/delete-file', deleteFile);

module.exports = router;
