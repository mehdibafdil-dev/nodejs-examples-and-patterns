// Express.js Optimization Techniques
// Comprehensive Implementation of Advanced Patterns

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');

// 1. Advanced Middleware Composition
/**
 * Middleware for user validation
 * Ensures authenticated users can access protected routes
 */
const validateUser = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(403).json({ 
      error: 'Unauthorized Access',
      message: 'Authentication required for this route'
    });
  }
  next();
};

/**
 * Performance logging middleware
 * Tracks request processing time and logs performance metrics
 */
const performanceLogger = (req, res, next) => {
  const start = Date.now();

  // Log request duration when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[PERF] ${req.method} ${req.path} - ${duration}ms`);

    // Log slow requests
    if (duration > 100) {
      console.warn(`[SLOW_REQUEST] ${req.method} ${req.path} took ${duration}ms`);
    }
  });

  next();
};

/**
 * Request sanitization middleware
 * Cleans and validates incoming request data
 */
const sanitizeRequest = (req, res, next) => {
  // Deep sanitization of request body
  if (req.body) {
    req.body = Object.keys(req.body).reduce((acc, key) => {
      // Trim string values, leave other types unchanged
      acc[key] = typeof req.body[key] === 'string' 
        ? req.body[key].trim()
        : req.body[key];
      return acc;
    }, {});
  }
  next();
};

// 2. Dynamic Router Generation
/**
 * Creates a dynamic CRUD router for any Mongoose model
 * @param {mongoose.Model} model - Mongoose model for routing
 * @returns {express.Router} Configured router with CRUD operations
 */
const createDynamicRouter = (model) => {
  const router = express.Router();

  // GET: Retrieve all documents
  router.get('/', async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = 'createdAt', 
        order = 'desc' 
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sort]: order === 'desc' ? -1 : 1 }
      };

      const results = await model.paginate({}, options);

      res.json({
        data: results.docs,
        pagination: {
          total: results.total,
          page: results.page,
          pages: results.pages
        }
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error.message 
      });
    }
  });

  // POST: Create new document
  router.post('/', async (req, res) => {
    try {
      const newItem = new model(req.body);
      await newItem.save();
      
      res.status(201).json({
        message: 'Document created successfully',
        data: newItem
      });
    } catch (error) {
      res.status(400).json({ 
        error: 'Validation Failed', 
        details: error.errors 
      });
    }
  });

  return router;
};

// 3. Centralized Error Handling
/**
 * Global error handler middleware
 * Provides consistent error responses across the application
 */
const globalErrorHandler = (err, req, res, next) => {
  // Log the error for internal tracking
  console.error('[ERROR]', err);

  // Determine error type and respond accordingly
  const errorResponse = {
    timestamp: new Date().toISOString(),
    path: req.path
  };

  switch (true) {
    case err.name === 'ValidationError':
      res.status(400).json({
        ...errorResponse,
        type: 'Validation Error',
        message: err.message,
        details: err.errors
      });
      break;

    case err.name === 'UnauthorizedError':
      res.status(401).json({
        ...errorResponse,
        type: 'Authentication Error',
        message: 'Invalid or expired token'
      });
      break;

    default:
      res.status(500).json({
        ...errorResponse,
        type: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : err.message
      });
  }
};

// 4. Application Configuration
const createExpressApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());
  
  // Parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom middlewares
  app.use(performanceLogger);
  app.use(sanitizeRequest);

  // Database connection
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Example route registrations
  const User = mongoose.model('User');
  const Product = mongoose.model('Product');

  app.use('/users', createDynamicRouter(User));
  app.use('/products', createDynamicRouter(Product));

  // Global error handler (must be last middleware)
  app.use(globalErrorHandler);

  return app;
};

// 5. Advanced Rate Limiting and Security
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Apply rate limiting to all requests
app.use(apiLimiter);

// Export the configured application
module.exports = {
  createExpressApp,
  validateUser,
  performanceLogger,
  sanitizeRequest,
  createDynamicRouter,
  globalErrorHandler
};

// Optional: Server startup
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const app = createExpressApp();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
