/**
 * performance-comparisons.js
 * 
 * This file demonstrates various patterns and anti-patterns for async/await usage in Node.js,
 * along with their performance implications.
 * 
 * Author: MEHDI BAFDIL
 * GitHub: [@mehdibafdil](https://github.com/mehdibafdil-dev)
 * Email: mehdibafdil@gmail.com
 * 
 * To run this file:
 * node performance-comparisons.js
 */

'use strict';

// Utility function to simulate an API call or database operation
const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper function to measure execution time of async operations
 * @param {Function} fn - The async function to measure
 * @param {string} label - Label for the console output
 */
async function measureExecutionTime(fn, label) {
    const start = Date.now();
    await fn();
    const end = Date.now();
    console.log(`${label}: ${end - start}ms`);
}

/**
 * ❌ ANTI-PATTERN: Sequential Processing
 * This function demonstrates the common mistake of using async/await in a loop,
 * which processes items sequentially and results in poor performance.
 */
async function processUsersSequentially(users) {
    console.log('\n--- Sequential Processing Started ---');
    for (const user of users) {
        await processUser(user); // ❌ This creates a blocking operation
    }
    console.log('--- Sequential Processing Completed ---\n');
}

/**
 * ✅ BEST PRACTICE: Concurrent Processing
 * This function demonstrates the correct way to process items concurrently
 * using Promise.all()
 */
async function processUsersConcurrently(users) {
    console.log('\n--- Concurrent Processing Started ---');
    await Promise.all(users.map(user => processUser(user))); // ✅ All operations run in parallel
    console.log('--- Concurrent Processing Completed ---\n');
}

/**
 * ✅ BEST PRACTICE: Controlled Concurrent Processing
 * This function demonstrates how to process items in controlled batches
 * to prevent overwhelming system resources
 * @param {Array} users - Array of users to process
 * @param {number} batchSize - Number of concurrent operations to run
 */
async function processUsersInBatches(users, batchSize = 5) {
    console.log('\n--- Batch Processing Started ---');
    for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        await Promise.all(batch.map(user => processUser(user)));
        console.log(`Completed batch of ${batch.length} users`);
    }
    console.log('--- Batch Processing Completed ---\n');
}

/**
 * Simulates processing a single user
 * @param {Object} user - User object to process
 * @returns {Promise}
 */
async function processUser(user) {
    try {
        await simulateDelay(100); // Simulate a 100ms API call or DB operation
        return { success: true, user };
    } catch (error) {
        console.error(`Error processing user ${user}:`, error);
        throw error;
    }
}

/**
 * Error handling demonstration with concurrent operations
 */
async function demonstrateErrorHandling(users) {
    try {
        console.log('\n--- Error Handling Demonstration ---');
        const results = await Promise.allSettled(
            users.map(user => processUser(user))
        );
        
        // Process results
        const succeeded = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');
        
        console.log(`Succeeded: ${succeeded.length}, Failed: ${failed.length}`);
        console.log('--- Error Handling Demonstration Completed ---\n');
    } catch (error) {
        console.error('Error in batch processing:', error);
    }
}

/**
 * Real-world example: Processing API requests
 */
async function demonstrateApiRequests() {
    const endpoints = [
        'https://api.example.com/users',
        'https://api.example.com/posts',
        'https://api.example.com/comments'
    ];

    // ❌ Bad approach: Sequential requests
    console.log('\n--- Sequential API Requests ---');
    for (const endpoint of endpoints) {
        // await fetch(endpoint); // Commented out as this is just for demonstration
        await simulateDelay(100);
    }

    // ✅ Good approach: Parallel requests
    console.log('\n--- Parallel API Requests ---');
    await Promise.all(endpoints.map(endpoint => {
        // return fetch(endpoint); // Commented out as this is just for demonstration
        return simulateDelay(100);
    }));
}

/**
 * Main execution function to run all demonstrations
 */
async function runDemonstrations() {
    // Create test data
    const users = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` }));

    console.log('Starting Performance Comparisons Demo\n');

    // Demonstrate sequential vs concurrent processing
    await measureExecutionTime(
        () => processUsersSequentially(users),
        'Sequential Processing Time'
    );

    await measureExecutionTime(
        () => processUsersConcurrently(users),
        'Concurrent Processing Time'
    );

    await measureExecutionTime(
        () => processUsersInBatches(users, 5),
        'Batch Processing Time'
    );

    // Demonstrate error handling
    await demonstrateErrorHandling(users);

    // Demonstrate API requests
    await demonstrateApiRequests();

    console.log('\n Performance Comparisons Demo Completed');
}

// Execute all demonstrations
runDemonstrations().catch(console.error);

/**
 * Additional Notes:
 * 
 * 1. Memory Considerations:
 *    - When dealing with large datasets, consider using streams or batch processing
 *    - Monitor memory usage when running many concurrent operations
 * 
 * 2. Error Handling Best Practices:
 *    - Always use try/catch blocks with async/await
 *    - Consider using Promise.allSettled() instead of Promise.all() when appropriate
 * 
 * 3. Performance Monitoring:
 *    - Use console.time() and console.timeEnd() for basic timing
 *    - Consider using performance hooks for more detailed metrics
 *    - Implement proper logging in production environments
 * 
 * 4. System Resources:
 *    - Be mindful of system limitations (CPU, memory, network)
 *    - Adjust batch sizes based on your system's capabilities
 *    - Monitor resource usage in production
 */
