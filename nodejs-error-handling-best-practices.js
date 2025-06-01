/**
 * Node.js Error Handling Best Practices
 * From: "Stop Writing Try/Catch Like This in Node.js"
 * 
 * This file contains all the code examples and patterns from the Medium story
 * demonstrating proper error handling in Node.js applications.
 */

// ============================================================================
// ❌ ANTI-PATTERN: Generic Try/Catch Block
// ============================================================================

// DON'T DO THIS - Generic error handling that masks problems
async function getUserDataBadPattern(userId) {
  try {
    const user = await User.findById(userId);
    const orders = await Order.findByUserId(userId);
    const preferences = await Preferences.findByUserId(userId);
    
    return {
      user,
      orders,
      preferences
    };
  } catch (error) {
    console.log('Something went wrong:', error);
    return null; // Silent failure - debugging nightmare!
  }
}

// ============================================================================
// ✅ BEST PRACTICE: Custom Error Classes
// ============================================================================

class UserDataError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'UserDataError';
    this.code = code;
    this.originalError = originalError;
  }
}

class CriticalOperationError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'CriticalOperationError';
    this.originalError = originalError;
  }
}

class ProcessingError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'ProcessingError';
    this.originalError = originalError;
  }
}

// ============================================================================
// ✅ BEST PRACTICE: Strategic Error Handling
// ============================================================================

async function getUserData(userId) {
  if (!userId) {
    throw new UserDataError('User ID is required', 'INVALID_INPUT');
  }

  let user, orders, preferences;

  // Handle user fetch separately - this is critical
  try {
    user = await User.findById(userId);
    if (!user) {
      throw new UserDataError(`User not found: ${userId}`, 'USER_NOT_FOUND');
    }
  } catch (error) {
    if (error instanceof UserDataError) throw error;
    throw new UserDataError('Failed to fetch user', 'DATABASE_ERROR', error);
  }

  // Handle orders with different strategy - non-critical
  try {
    orders = await Order.findByUserId(userId);
  } catch (error) {
    // Orders are not critical - log and continue
    console.warn(`Failed to fetch orders for user ${userId}:`, error);
    orders = [];
  }

  // Handle preferences with retry logic
  try {
    preferences = await fetchPreferencesWithRetry(userId);
  } catch (error) {
    // Use default preferences if fetch fails
    preferences = getDefaultPreferences();
  }

  return { user, orders, preferences };
}

// ============================================================================
// ✅ RETRY LOGIC PATTERN
// ============================================================================

async function fetchPreferencesWithRetry(userId, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await Preferences.findByUserId(userId);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw new UserDataError('Failed to fetch preferences after retries', 'PREFERENCES_ERROR', lastError);
}

function getDefaultPreferences() {
  return {
    theme: 'light',
    notifications: true,
    language: 'en'
  };
}

// ============================================================================
// ✅ EXPRESS.JS INTEGRATION
// ============================================================================

function getStatusCode(errorCode) {
  const statusMap = {
    'INVALID_INPUT': 400,
    'USER_NOT_FOUND': 404,
    'DATABASE_ERROR': 500,
    'PREFERENCES_ERROR': 500
  };
  return statusMap[errorCode] || 500;
}

// Custom error handling middleware
function errorHandler(error, req, res, next) {
  if (error instanceof UserDataError) {
    const statusCode = getStatusCode(error.code);
    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          originalError: error.originalError 
        })
      }
    });
  }

  // Unknown error
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}

// Example Express route
function setupExpressRoute(app) {
  app.get('/api/users/:id', async (req, res, next) => {
    try {
      const userData = await getUserData(req.params.id);
      res.json({ success: true, data: userData });
    } catch (error) {
      next(error); // Pass to error handling middleware
    }
  });

  app.use(errorHandler);
}

// ============================================================================
// ✅ ADVANCED PATTERN: Error Boundaries for Critical Operations
// ============================================================================

class CriticalOperationBoundary {
  constructor(operationName, fallbackStrategy = 'throw') {
    this.operationName = operationName;
    this.fallbackStrategy = fallbackStrategy;
    this.metrics = {
      attempts: 0,
      failures: 0,
      lastFailure: null
    };
  }

  async execute(operation, fallback = null) {
    this.metrics.attempts++;
    
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      this.metrics.failures++;
      this.metrics.lastFailure = new Date();
      
      console.error(`Critical operation "${this.operationName}" failed:`, {
        error: error.message,
        metrics: this.metrics
      });

      switch (this.fallbackStrategy) {
        case 'fallback':
          if (fallback) {
            const fallbackResult = await fallback();
            return { success: false, data: fallbackResult, usedFallback: true };
          }
          break;
        case 'retry':
          return this.executeWithRetry(operation, 3);
        case 'throw':
        default:
          throw new CriticalOperationError(
            `Critical operation "${this.operationName}" failed`,
            error
          );
      }
    }
  }

  async executeWithRetry(operation, maxRetries) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        return { success: true, data: result };
      } catch (error) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    
    throw lastError;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.attempts > 0 
        ? ((this.metrics.attempts - this.metrics.failures) / this.metrics.attempts * 100).toFixed(2) + '%'
        : '100%'
    };
  }
}

// Usage example with payment processing
const paymentBoundary = new CriticalOperationBoundary('payment_processing', 'retry');

async function processPayment(paymentData) {
  return paymentBoundary.execute(
    () => {
      // Simulate payment processing
      if (Math.random() > 0.7) {
        throw new Error('Payment gateway timeout');
      }
      return { id: 'payment_123', status: 'completed', amount: paymentData.amount };
    },
    () => ({ id: 'fallback_payment', status: 'pending' })
  );
}

// ============================================================================
// ✅ MEMORY LEAK PREVENTION
// ============================================================================

// ❌ Memory leak potential
async function processLargeDatasetBadPattern(data) {
  try {
    const processedData = data.map(item => expensiveOperation(item));
    return processedData;
  } catch (error) {
    console.error('Processing failed:', error);
    // processedData stays in memory even after error
    return null;
  }
}

// ✅ Memory-conscious error handling
async function processLargeDataset(data) {
  let processedData = null;
  
  try {
    processedData = data.map(item => expensiveOperation(item));
    const result = processedData;
    processedData = null; // Clear reference before return
    return result;
  } catch (error) {
    processedData = null; // Ensure cleanup on error
    throw new ProcessingError('Dataset processing failed', error);
  }
}

function expensiveOperation(item) {
  // Simulate expensive computation
  return {
    ...item,
    processed: true,
    timestamp: Date.now(),
    computedValue: Math.random() * 1000
  };
}

// ============================================================================
// ✅ PERFORMANCE BENCHMARKING
// ============================================================================

async function benchmarkErrorHandling() {
  const iterations = 10000;
  
  // Simulate operations that might fail
  const simulateOperation = async (shouldFail = false) => {
    if (shouldFail && Math.random() > 0.8) {
      throw new Error('Simulated failure');
    }
    return { success: true, data: 'operation result' };
  };

  // ❌ Generic Try/Catch Approach
  console.time('Generic Try/Catch');
  let genericResults = 0;
  for (let i = 0; i < iterations; i++) {
    try {
      await simulateOperation(true);
      genericResults++;
    } catch (error) {
      // Generic handling
    }
  }
  console.timeEnd('Generic Try/Catch');

  // ✅ Specific Error Handling
  console.time('Specific Error Handling');
  let specificResults = 0;
  for (let i = 0; i < iterations; i++) {
    try {
      await simulateOperation(true);
      specificResults++;
    } catch (error) {
      if (error.message === 'Simulated failure') {
        // Handle specific error type
      }
    }
  }
  console.timeEnd('Specific Error Handling');

  console.log(`Generic approach successful operations: ${genericResults}`);
  console.log(`Specific approach successful operations: ${specificResults}`);
}

// ============================================================================
// ✅ TESTING HELPERS
// ============================================================================

// Mock implementations for testing
const mockDatabase = {
  users: [
    { id: '123', name: 'John Doe', email: 'john@example.com' },
    { id: '456', name: 'Jane Smith', email: 'jane@example.com' }
  ],
  orders: {
    '123': [{ id: 'order1', amount: 100 }, { id: 'order2', amount: 200 }],
    '456': [{ id: 'order3', amount: 150 }]
  },
  preferences: {
    '123': { theme: 'dark', notifications: false },
    '456': { theme: 'light', notifications: true }
  }
};

// Mock User model
const User = {
  async findById(id) {
    const user = mockDatabase.users.find(u => u.id === id);
    if (!user) return null;
    return user;
  }
};

// Mock Order model
const Order = {
  async findByUserId(userId) {
    return mockDatabase.orders[userId] || [];
  }
};

// Mock Preferences model
const Preferences = {
  async findByUserId(userId) {
    const prefs = mockDatabase.preferences[userId];
    if (!prefs) {
      throw new Error('Preferences not found');
    }
    return prefs;
  }
};

// ============================================================================
// ✅ USAGE EXAMPLES AND DEMOS
// ============================================================================

async function demonstrateErrorHandling() {
  console.log('=== Node.js Error Handling Best Practices Demo ===\n');

  // Example 1: Strategic error handling
  console.log('1. Strategic Error Handling:');
  try {
    const userData = await getUserData('123');
    console.log('✅ User data retrieved successfully:', userData);
  } catch (error) {
    console.log('❌ Error:', error.message, error.code);
  }

  // Example 2: Critical operation boundary
  console.log('\n2. Critical Operation Boundary:');
  try {
    const paymentResult = await processPayment({ amount: 100 });
    console.log('✅ Payment processed:', paymentResult);
    console.log('Payment boundary metrics:', paymentBoundary.getMetrics());
  } catch (error) {
    console.log('❌ Payment failed:', error.message);
  }

  // Example 3: Memory-conscious processing
  console.log('\n3. Memory-Conscious Processing:');
  try {
    const sampleData = Array.from({ length: 5 }, (_, i) => ({ id: i, value: i * 10 }));
    const processed = await processLargeDataset(sampleData);
    console.log('✅ Data processed successfully:', processed.length, 'items');
  } catch (error) {
    console.log('❌ Processing failed:', error.message);
  }

  // Example 4: Performance benchmark
  console.log('\n4. Performance Benchmark:');
  await benchmarkErrorHandling();
}

// ============================================================================
// ✅ EXPORT FOR MODULE USAGE
// ============================================================================

module.exports = {
  // Error classes
  UserDataError,
  CriticalOperationError,
  ProcessingError,
  
  // Main functions
  getUserData,
  fetchPreferencesWithRetry,
  getDefaultPreferences,
  
  // Express integration
  errorHandler,
  getStatusCode,
  setupExpressRoute,
  
  // Advanced patterns  
  CriticalOperationBoundary,
  processPayment,
  processLargeDataset,
  
  // Utilities
  benchmarkErrorHandling,
  demonstrateErrorHandling,
  
  // Mock data for testing
  User,
  Order,
  Preferences
};

// ============================================================================
// ✅ RUN DEMO IF EXECUTED DIRECTLY
// ============================================================================

if (require.main === module) {
  demonstrateErrorHandling().catch(console.error);
}
