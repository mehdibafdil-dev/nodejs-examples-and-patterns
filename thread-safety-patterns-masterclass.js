const { Worker, isMainThread, parentPort } = require('worker_threads');
const { AsyncMutex } = require('async-mutex');

/**
 * Thread-Safe Architecture Examples and Patterns
 * Author: Mehdi BAFDIL
 * Repository: https://github.com/mehdibafdil-dev/nodejs-examples-and-patterns
 */

// ===============================
// 1. Basic Thread-Unsafe Example
// ===============================
let sharedCounter = 0;
async function unsafeIncrement() {
    const current = sharedCounter;
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
    sharedCounter = current + 1;
    return sharedCounter;
}

// ===============================
// 2. Thread-Safe Counter Implementation
// ===============================
class ThreadSafeCounter {
    constructor() {
        this.counter = 0;
        this.mutex = new AsyncMutex();
    }

    async increment() {
        const release = await this.mutex.acquire();
        try {
            this.counter += 1;
            return this.counter;
        } finally {
            release();
        }
    }

    async getValue() {
        const release = await this.mutex.acquire();
        try {
            return this.counter;
        } finally {
            release();
        }
    }
}

// ===============================
// 3. Worker Threads Implementation
// ===============================
class WorkerThreadCounter {
    constructor() {
        if (isMainThread) {
            this.worker = new Worker(__filename);
            this.worker.on('message', (count) => {
                console.log('Current count:', count);
            });
        }
    }

    increment() {
        this.worker.postMessage('INCREMENT');
    }
}

if (!isMainThread) {
    let safeCounter = 0;
    parentPort?.on('message', (message) => {
        if (message === 'INCREMENT') {
            safeCounter++;
            parentPort?.postMessage(safeCounter);
        }
    });
}

// ===============================
// 4. Thread-Safe Cache Implementation
// ===============================
class ThreadSafeCache {
    constructor() {
        this.#cache = new Map();
        this.#mutex = new AsyncMutex();
    }

    #cache;
    #mutex;

    async set(key, value) {
        const release = await this.#mutex.acquire();
        try {
            this.#cache.set(key, value);
        } finally {
            release();
        }
    }

    async get(key) {
        const release = await this.#mutex.acquire();
        try {
            return this.#cache.get(key);
        } finally {
            release();
        }
    }

    async delete(key) {
        const release = await this.#mutex.acquire();
        try {
            return this.#cache.delete(key);
        } finally {
            release();
        }
    }
}

// ===============================
// 5. E-commerce Inventory Example
// ===============================
class ThreadSafeInventory {
    constructor() {
        this.mutex = new AsyncMutex();
        this.inventory = new Map();
    }

    async initializeProduct(productId, initialStock) {
        const release = await this.mutex.acquire();
        try {
            this.inventory.set(productId, initialStock);
        } finally {
            release();
        }
    }

    async reserveStock(productId, quantity) {
        const release = await this.mutex.acquire();
        try {
            const currentStock = this.inventory.get(productId) ?? 0;
            if (currentStock < quantity) {
                throw new Error('Insufficient stock');
            }
            this.inventory.set(productId, currentStock - quantity);
            return true;
        } finally {
            release();
        }
    }

    async getStock(productId) {
        const release = await this.mutex.acquire();
        try {
            return this.inventory.get(productId) ?? 0;
        } finally {
            release();
        }
    }
}

// ===============================
// 6. Utility: Thread-Safe Operation Wrapper
// ===============================
class ThreadSafeOperation {
    constructor() {
        this.mutex = new AsyncMutex();
    }

    async execute(operation) {
        const release = await this.mutex.acquire();
        try {
            return await operation();
        } catch (error) {
            console.error('Thread-safe operation failed:', error);
            throw error;
        } finally {
            release();
        }
    }
}

// ===============================
// Usage Examples
// ===============================
async function runExamples() {
    // Example 1: Thread-Safe Counter
    const counter = new ThreadSafeCounter();
    await Promise.all([
        counter.increment(),
        counter.increment(),
        counter.increment()
    ]);
    console.log('Final count:', await counter.getValue());

    // Example 2: Thread-Safe Cache
    const cache = new ThreadSafeCache();
    await cache.set('key1', 'value1');
    console.log('Cached value:', await cache.get('key1'));

    // Example 3: Thread-Safe Inventory
    const inventory = new ThreadSafeInventory();
    await inventory.initializeProduct('PROD-1', 100);
    try {
        await inventory.reserveStock('PROD-1', 5);
        console.log('Current stock:', await inventory.getStock('PROD-1'));
    } catch (error) {
        console.error('Inventory operation failed:', error);
    }
}

// ===============================
// Export all implementations
// ===============================
module.exports = {
    ThreadSafeCounter,
    ThreadSafeCache,
    ThreadSafeInventory,
    ThreadSafeOperation,
    WorkerThreadCounter,
    runExamples
};

// Run examples if this file is executed directly
if (require.main === module && isMainThread) {
    runExamples().catch(console.error);
}
