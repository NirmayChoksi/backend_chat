const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${new Date().toISOString().replace(/:/g, '-')} - ${file.originalname}`
    );
  },
});

// Filter for only JPEG images
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG images are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max file size 5MB
  fileFilter: fileFilter,
});

const uploadFile = async (req, res) => {
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
};

const deleteFile = async (req, res) => {
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
};

module.exports = { upload, uploadFile, deleteFile };
