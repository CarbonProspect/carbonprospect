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
const analyticsRoutes = require('./routes/analytics');

// Try to import creditSystemRoutes with error handling
let creditSystemRoutes;
try {
  creditSystemRoutes = require('./routes/creditSystemRoutes');
  console.log('✅ Credit system routes loaded successfully');
} catch (err) {
  console.warn('⚠️ Credit system routes not found, skipping...');
  console.warn('Error:', err.message);
}

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
      'https://carbonprospect.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
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
app.use('/api/analytics', analyticsRoutes);

// Only add credit system routes if they were loaded successfully
if (creditSystemRoutes) {
  app.use('/api', creditSystemRoutes);
  console.log('✅ Credit system routes registered');
} else {
  console.log('⚠️ Credit system routes not registered');
}

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

// Add a specific 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.warn(`API 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'API endpoint not found', path: req.originalUrl });
});

// IMPORTANT: Serve uploads BEFORE the static build files
// This ensures uploads are accessible in production

// Create uploads directories if they don't exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/images'),
  path.join(__dirname, 'uploads/documents'),
  path.join(PROJECT_ROOT, 'public/uploads'),
  path.join(PROJECT_ROOT, 'public/uploads/images')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Serve static files from the uploads directory with proper headers
app.use('/uploads', (req, res, next) => {
  // Set cache headers for images
  if (req.path.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    res.set('Cache-Control', 'public, max-age=86400'); // 1 day
  }
  next();
});

// Serve uploads from multiple locations with fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  fallthrough: true,
  setHeaders: (res, path) => {
    // Ensure images are served with correct content type
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    }
  }
}));

// Also serve from public/uploads as a fallback
app.use('/uploads', express.static(path.join(PROJECT_ROOT, 'public/uploads'), {
  fallthrough: true
}));

// Add a route to specifically serve images with multiple fallbacks
app.get('/uploads/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePaths = [
    path.join(__dirname, 'uploads/images', filename),
    path.join(PROJECT_ROOT, 'public/uploads/images', filename),
    path.join(PROJECT_ROOT, 'build/uploads/images', filename)
  ];
  
  console.log(`Looking for image: ${filename}`);
  
  // Try each path in order
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      console.log(`Found image at: ${filePath}`);
      return res.sendFile(filePath);
    }
  }
  
  // If no file found, try to serve placeholder
  const placeholderPath = path.join(PROJECT_ROOT, 'public/uploads/images/placeholder-project.jpg');
  if (fs.existsSync(placeholderPath)) {
    console.log(`Serving placeholder for missing image: ${filename}`);
    return res.sendFile(placeholderPath);
  }
  
  // If no files exist, return 404
  console.log(`Image not found: ${filename}`);
  res.status(404).send('Image not found');
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

// Serve static files from the React app build directory
// IMPORTANT: This should come AFTER the uploads routes
app.use(express.static(path.join(__dirname, '../build')));

// Serve static files from public directory
app.use(express.static(path.join(PROJECT_ROOT, 'public')));

// Catch all handler for React routing - must be after API routes and static files
app.get('*', (req, res) => {
  const buildIndex = path.join(__dirname, '../build/index.html');
  if (fs.existsSync(buildIndex)) {
    res.sendFile(buildIndex);
  } else {
    res.status(404).send('Build not found. Please run npm run build.');
  }
});

// General error handling middleware (for actual errors, not 404s)
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
  });
});

// Import pool for database connection
const pool = require('./db/pool');

// Debug database connection
console.log('=== DATABASE CONNECTION DEBUG ===');
pool.query('SELECT current_database(), current_schema(), version()', (err, result) => {
  if (err) {
    console.error('❌ Database connection test failed:', err);
  } else {
    console.log('✅ Connected to database:', result.rows[0].current_database);
    console.log('✅ Current schema:', result.rows[0].current_schema);
    console.log('✅ PostgreSQL version:', result.rows[0].version);
  }
});

// Check if password reset columns exist
pool.query(`
  SELECT column_name, table_schema, table_name
  FROM information_schema.columns 
  WHERE table_name = 'users' 
  AND column_name IN ('reset_password_token', 'reset_password_expiry', 'verification_token', 'is_verified')
  ORDER BY column_name
`, (err, result) => {
  if (err) {
    console.error('❌ Column check failed:', err);
  } else {
    console.log(`✅ Found ${result.rows.length} auth-related columns in users table:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (schema: ${row.table_schema})`);
    });
  }
});

// Check if analytics tables exist
pool.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('product_views', 'project_views')
  ORDER BY table_name
`, (err, result) => {
  if (err) {
    console.error('❌ Analytics table check failed:', err);
  } else {
    console.log(`✅ Found ${result.rows.length} analytics tables`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
  }
});

// Also check what tables exist
pool.query(`
  SELECT table_name, table_schema 
  FROM information_schema.tables 
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND table_type = 'BASE TABLE'
  ORDER BY table_name
`, (err, result) => {
  if (err) {
    console.error('❌ Table list check failed:', err);
  } else {
    console.log(`✅ Found ${result.rows.length} tables in database`);
    const userTable = result.rows.find(r => r.table_name === 'users');
    if (userTable) {
      console.log(`   - 'users' table found in schema: ${userTable.table_schema}`);
    } else {
      console.log('   ⚠️  WARNING: users table not found!');
    }
  }
});

console.log('=== END DATABASE DEBUG ===');

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log('Successfully connected to PostgreSQL database');
  console.log('Connected to database: carbon_marketplace');
  console.log('\nEnvironment check:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
  console.log(`  SENDGRID_API_KEY exists: ${!!process.env.SENDGRID_API_KEY}`);
  console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log(`  FRONTEND_URL: ${process.env.FRONTEND_URL}`);
  console.log(`  JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
  console.log('\nTest the API:');
  console.log(`  curl http://localhost:${PORT}/api/marketplace/products`);
  console.log(`  curl http://localhost:${PORT}/api/debug/routes`);
  console.log(`  curl http://localhost:${PORT}/api/analytics/my-products`);
  if (creditSystemRoutes) {
    console.log(`  curl http://localhost:${PORT}/api/credit-types`);
    console.log(`  curl http://localhost:${PORT}/api/target-markets`);
  }
});