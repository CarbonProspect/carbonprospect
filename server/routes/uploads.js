// routes/uploads.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const authenticateToken = require('../middleware/auth');

// Configure storage for images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/images');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for documents
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create upload middleware
const uploadImage = multer({ 
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  }
}).single('image');

const uploadDocument = multer({ 
  storage: documentStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
}).single('document');

// Image upload route
router.post('/images', authenticateToken, (req, res) => {
  uploadImage(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    // File uploaded successfully
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = `/uploads/images/${req.file.filename}`;
    const imageUrl = baseUrl + relativePath;
    
    return res.json({ 
      success: true, 
      imageUrl: imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  });
});

// Document upload route
router.post('/documents', authenticateToken, (req, res) => {
  uploadDocument(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    // File uploaded successfully
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = `/uploads/documents/${req.file.filename}`;
    const documentUrl = baseUrl + relativePath;
    
    try {
      // Insert document info into database
      const result = await pool.query(
        'INSERT INTO documents (project_id, name, url, type, size, upload_date) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
        [req.body.project_id || null, req.file.originalname, documentUrl, req.file.mimetype, req.file.size]
      );
      
      return res.json({
        success: true,
        id: result.rows[0].id,
        documentUrl: documentUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });
    } catch (error) {
      console.error('Error inserting document into database:', error);
      return res.status(500).json({ error: 'Failed to save document information' });
    }
  });
});

module.exports = router;