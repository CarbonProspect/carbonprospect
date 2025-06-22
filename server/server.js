const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const marketplaceRoutes = require('./routes/marketplace');
const productRoutes = require('./routes/productRoutes');
const projectRoutes = require('./routes/projectRoutes');
const profileRoutes = require('./routes/profileRoutes');
const assessmentProjectRoutes = require('./routes/assessmentProjectRoutes');
const carbonFootprintRoutes = require('./routes/carbonFootprintRoutes');
const uploadsRouter = require('./routes/uploads');
const article6ProjectsRoutes = require('./routes/article6ProjectsRoutes');
const serviceProviderRoutes = require('./routes/serviceProviderRoutes');
const creditSystemRoutes = require('./routes/creditSystemRoutes');

// Initialize express app
const app = express();

// Get port from environment variables
const PORT = process.env.PORT || 3001;

// IMPORTANT: Since server.js is in the server/ subdirectory,
// we need to adjust paths to point one level up for the project root
const PROJECT_ROOT = path.join(__dirname, '..');

// Middleware
app.use(express.json());

// CORS configuration - production-ready
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (same-origin, mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // List of allowed origins
    const allowedOrigins = [
      'https://carbonprospect.onrender.com',
      'https://www.carbonprospect.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    // Allow any localhost port for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For production, you can enable strict checking:
    // callback(new Error('Not allowed by CORS'));
    
    // For now, allow all origins with a warning
    console.log(`CORS request from origin: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Also serve from public/uploads as a fallback
app.use('/uploads', express.static(path.join(PROJECT_ROOT, 'public/uploads')));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.originalUrl} from ${req.get('origin') || 'same-origin'}`);
  
  // Log request headers for authentication debugging
  if (req.headers.authorization) {
    console.log(`${timestamp} - Authorization header present`);
  }
  
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/assessment-projects', assessmentProjectRoutes);
app.use('/api/carbon-footprints', carbonFootprintRoutes);
app.use('/api/uploads', uploadsRouter);
app.use('/api/article6-projects', article6ProjectsRoutes);
app.use('/api/service-providers', serviceProviderRoutes);
app.use('/api', creditSystemRoutes);

// Debug route to check what routes are registered
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  // Get all routes from the app
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = middleware.regexp.source.match(/\^\\(.+?)\\/);
          const basePath = path ? path[1].replace(/\\/g, '') : '';
          routes.push({
            path: basePath + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    registeredRoutes: routes,
    apiBase: req.protocol + '://' + req.get('host') + '/api'
  });
});

// Add a route to specifically serve project images with fallback to placeholder
app.get('/uploads/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePaths = [
    path.join(PROJECT_ROOT, 'public/uploads/images', filename),
    path.join(__dirname, 'uploads/images', filename),
    path.join(PROJECT_ROOT, 'public/uploads/images/placeholder-project.jpg')
  ];
  
  // Try each path in order
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  
  // If no files exist, return 404
  res.status(404).send('Image not found');
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../build')));

// Serve static files from public directory
app.use(express.static(path.join(PROJECT_ROOT, 'public')));

// Catch all handler for React routing - must be after API routes
app.get('*', (req, res) => {
  const buildIndex = path.join(__dirname, '../build/index.html');
  res.sendFile(buildIndex);
});

// Error handling middleware
app.use((req, res, next) => {
  console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
  });
});

// Create uploads directories if they don't exist
const uploadDirs = ['uploads', 'uploads/images', 'uploads/documents'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

// Create public directory structure
const publicDirs = [
  path.join(PROJECT_ROOT, 'public'),
  path.join(PROJECT_ROOT, 'public/images'),
  path.join(PROJECT_ROOT, 'public/images/leaflet'),
  path.join(PROJECT_ROOT, 'public/uploads'),
  path.join(PROJECT_ROOT, 'public/uploads/images')
];

publicDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create a placeholder image if it doesn't exist
const placeholderPath = path.join(PROJECT_ROOT, 'public/uploads/images/placeholder-project.jpg');
if (!fs.existsSync(placeholderPath)) {
  console.log(`Creating placeholder image at: ${placeholderPath}`);
  try {
    const https = require('https');
    const file = fs.createWriteStream(placeholderPath);
    
    https.get('https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?w=800', (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Created placeholder image for projects');
        });
      } else {
        file.close();
        console.error(`Failed to download placeholder: HTTP ${response.statusCode}`);
      }
    }).on('error', (err) => {
      file.close();
      console.error(`Error downloading placeholder: ${err.message}`);
    });
  } catch (err) {
    console.error(`Failed to create placeholder: ${err.message}`);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log('Successfully connected to PostgreSQL database');
  console.log('Connected to database: carbon_marketplace');
  console.log('\nTest the API:');
  console.log(`  curl http://localhost:${PORT}/api/marketplace/products`);
  console.log(`  curl http://localhost:${PORT}/api/debug/routes`);
  console.log(`  curl http://localhost:${PORT}/api/credit-types`);
  console.log(`  curl http://localhost:${PORT}/api/target-markets`);
});

// Import pool for database connection
const pool = require('./db/pool');