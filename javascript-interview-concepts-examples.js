// ===================================================================
// JavaScript Interview Concepts - Complete Examples
// ===================================================================

console.log("=== JavaScript Interview Concepts Examples ===\n");

// ===================================================================
// 1. UNDEFINED vs NULL
// ===================================================================
console.log("1. UNDEFINED vs NULL");
console.log("==================");

// Basic examples
let bookTitle; // A shelf exists, but it's empty (undefined)
let reservedSpace = null; // Deliberately marked as "no book here"
let actualBook = "JavaScript: The Good Parts"; // Has a value

console.log("bookTitle:", bookTitle);
console.log("reservedSpace:", reservedSpace);
console.log("actualBook:", actualBook);

// Type checking differences
console.log("\nType Checking:");
console.log("typeof undefined:", typeof undefined); // "undefined" 
console.log("typeof null:", typeof null); // "object" (JavaScript's famous quirk)
console.log("null == undefined:", null == undefined); // true (loose equality)
console.log("null === undefined:", null === undefined); // false (strict equality)

console.log("\n" + "=".repeat(50) + "\n");

// ===================================================================
// 2. HOISTING
// ===================================================================
console.log("2. HOISTING");
console.log("===========");

// Function hoisting example
console.log("Function hoisting result:", mysterFunction()); // "Time travel is real!"

function mysterFunction() {
    return "Time travel is real!";
}

// Variable hoisting with var
console.log("Variable before declaration:", ghost); // undefined (not an error!)
var ghost = "I exist now";
console.log("Variable after assignment:", ghost);

// Temporal Dead Zone with let/const
try {
    console.log("Trying to access let before declaration:", trapped);
} catch (error) {
    console.log("Error:", error.message); // ReferenceError: Cannot access before initialization
}
let trapped = "I'm free!";
console.log("After declaration:", trapped);

console.log("\n" + "=".repeat(50) + "\n");

// ===================================================================
// 3. THIS KEYWORD
// ===================================================================
console.log("3. THIS KEYWORD");
console.log("===============");

const person = {
    name: "Emma",
    introduce: function() {
        console.log(`Hi, I'm ${this.name}`);
    },
    introduceArrow: () => {
        console.log(`Arrow function - Hi, I'm ${this.name}`); // this !== person!
    }
};

console.log("Method call:");
person.introduce(); // "Hi, I'm Emma" (this = person object)

console.log("\nFunction reference:");
const lostFunction = person.introduce;
try {
    lostFunction(); // "Hi, I'm undefined" (this = global object or undefined in strict mode)
} catch (error) {
    console.log("Error in strict mode:", error.message);
}

console.log("\nArrow function:");
person.introduceArrow(); // this doesn't refer to person

// Explicit binding examples
console.log("\nExplicit binding:");
const boundFunction = person.introduce.bind(person);
boundFunction(); // "Hi, I'm Emma"

console.log("\n" + "=".repeat(50) + "\n");

// ===================================================================
// 4. CALLBACKS AND PROMISES
// ===================================================================
console.log("4. CALLBACKS AND PROMISES");
console.log("=========================");

// Simulated async functions for demonstration
function simulateAsyncOperation(data, callback) {
    setTimeout(() => {
        callback(null, `Processed: ${data}`);
    }, 100);
}

function simulateAsyncPromise(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Promise processed: ${data}`);
        }, 100);
    });
}

// Callback Hell Example (commented out to avoid actual nested execution)
console.log("Callback Hell Structure:");
console.log(`
// The descent into callback hell
fetchUser(userId, function(user) {
    fetchUserPosts(user.id, function(posts) {
        fetchPostComments(posts[0].id, function(comments) {
            fetchCommentAuthors(comments, function(authors) {
                // We're now four levels deep in callback hell
                displayData(user, posts, comments, authors);
            });
        });
    });
});
`);

// Promise Chain Example
console.log("Promise Chain Structure:");
console.log(`
fetchUser(userId)
    .then(user => fetchUserPosts(user.id))
    .then(posts => fetchPostComments(posts[0].id))
    .then(comments => fetchCommentAuthors(comments))
    .then(authors => displayData(authors))
    .catch(error => handleError(error));
`);

// Actual Promise example
simulateAsyncPromise("test data")
    .then(result => {
        console.log("Promise result:", result);
        return simulateAsyncPromise("chained data");
    })
    .then(result => {
        console.log("Chained result:", result);
    })
    .catch(error => {
        console.log("Promise error:", error);
    });

console.log("\n" + "=".repeat(50) + "\n");

// ===================================================================
// 5. SCOPE AND CLOSURES
// ===================================================================
console.log("5. SCOPE AND CLOSURES");
console.log("=====================");

// Basic closure example
function outerNeighborhood(secret) {
    let privateMessage = "Only inner functions can see this";
    
    function innerResident() {
        // This function remembers its childhood neighborhood
        console.log(secret + " " + privateMessage);
    }
    
    return innerResident;
}

const messenger = outerNeighborhood("The treasure is buried");
messenger(); // "The treasure is buried Only inner functions can see this"

// Classic closure trap in loops
console.log("\nClosure trap in loops:");
console.log("What gets logged?");

// Using var (problematic)
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log("var loop:", i), 200 + (i * 10));
}
// Output: 3, 3, 3 (not 0, 1, 2!)

// Using let (correct)
for (let j = 0; j < 3; j++) {
    setTimeout(() => console.log("let loop:", j), 300 + (j * 10));
}
// Output: 0, 1, 2

// IIFE solution for var
for (var k = 0; k < 3; k++) {
    ((index) => {
        setTimeout(() => console.log("IIFE solution:", index), 400 + (index * 10));
    })(k);
}

console.log("\n" + "=".repeat(50) + "\n");

// ===================================================================
// 6. PROTOTYPAL INHERITANCE
// ===================================================================
console.log("6. PROTOTYPAL INHERITANCE");
console.log("=========================");

// Object.create example
const Animal = {
    speak() {
        console.log(`${this.name} makes a sound`);
    },
    type: "generic animal"
};

const dog = Object.create(Animal);
dog.name = "Buddy";
dog.breed = "Golden Retriever";
dog.bark = function() {
    console.log(`${this.name} barks loudly!`);
};

console.log("Inherited method:");
dog.speak(); // "Buddy makes a sound" (inherited)

console.log("Own method:");
dog.bark(); // "Buddy barks loudly!" (own method)

console.log("Prototype chain:");
console.log("dog.hasOwnProperty('name'):", dog.hasOwnProperty('name')); // true
console.log("dog.hasOwnProperty('speak'):", dog.hasOwnProperty('speak')); // false
console.log("dog.type:", dog.type); // "generic animal" (inherited)

// ES6 Class (syntactic sugar over prototypes)
class ModernAnimal {
    constructor(name) {
        this.name = name;
    }
    
    speak() {
        console.log(`${this.name} makes a sound`);
    }
}

class Dog extends ModernAnimal {
    constructor(name, breed) {
        super(name);
        this.breed = breed;
    }
    
    bark() {
        console.log(`${this.name} barks loudly!`);
    }
}

const modernDog = new Dog("Rex", "German Shepherd");
console.log("\nES6 Class example:");
modernDog.speak(); // Inherited method
modernDog.bark(); // Own method

console.log("\n" + "=".repeat(50) + "\n");

// ===================================================================
// 7. EVENT LOOP
// ===================================================================
console.log("7. EVENT LOOP");
console.log("=============");

console.log("Event loop execution order:");

console.log("Order 1: Start cooking"); // Synchronous - executed immediately

setTimeout(() => {
    console.log("Order 2: Timer finished"); // Macrotask - executed last
}, 0);

Promise.resolve().then(() => {
    console.log("Order 3: Promise resolved"); // Microtask - executed before macrotasks
});

console.log("Order 4: Continue cooking"); // Synchronous - executed immediately

// More complex event loop example
setTimeout(() => console.log("Timeout 1"), 0);
setTimeout(() => console.log("Timeout 2"), 0);

Promise.resolve().then(() => {
    console.log("Promise 1");
    return Promise.resolve();
}).then(() => {
    console.log("Promise 2");
});

Promise.resolve().then(() => {
    console.log("Promise 3");
});

console.log("Synchronous end");

console.log("\n" + "=".repeat(50) + "\n");

// ===================================================================
// 8. COMPLEX REAL-WORLD EXAMPLE
// ===================================================================
console.log("8. COMPLEX REAL-WORLD EXAMPLE");
console.log("==============================");

const user = {
    name: "Sarah",
    hobbies: ["reading", "coding"],
    
    displayHobbies: function() {
        console.log("Using regular function in forEach:");
        this.hobbies.forEach(function(hobby) {
            // this.name is undefined here! Why?
            console.log(`${this.name || 'undefined'} enjoys ${hobby}`);
        });
    },
    
    displayHobbiesFixed: function() {
        console.log("Using arrow function in forEach:");
        this.hobbies.forEach((hobby) => {
            // Arrow function preserves 'this' context
            console.log(`${this.name} enjoys ${hobby}`);
        });
    },
    
    displayHobbiesBound: function() {
        console.log("Using bind to fix context:");
        this.hobbies.forEach(function(hobby) {
            console.log(`${this.name} enjoys ${hobby}`);
        }.bind(this));
    }
};

user.displayHobbies(); // Problem: this context lost
user.displayHobbiesFixed(); // Solution 1: Arrow function
user.displayHobbiesBound(); // Solution 2: Bind

console.log("\n" + "=".repeat(50) + "\n");

// ===================================================================
// 9. PERFORMANCE IMPLICATIONS
// ===================================================================
console.log("9. PERFORMANCE IMPLICATIONS");
console.log("===========================");

// Closure memory implications
function createFunctions() {
    const functions = [];
    const largeArray = new Array(1000000).fill('data'); // Large memory usage
    
    for (let i = 0; i < 1000; i++) {
        functions.push(() => {
            // This closure keeps the entire largeArray in memory
            return largeArray.length + i;
        });
    }
    
    return functions;
}

// Better approach
function createFunctionsOptimized() {
    const functions = [];
    const arrayLength = 1000000; // Only store what we need
    
    for (let i = 0; i < 1000; i++) {
        functions.push(() => {
            return arrayLength + i;
        });
    }
    
    return functions;
}

console.log("Memory usage example created (check with heap profiler)");

// Prototype vs own properties performance
const obj1 = {};
obj1.method = function() { return "own property"; };

const proto = { method: function() { return "prototype property"; } };
const obj2 = Object.create(proto);

console.log("Own property access:", obj1.method());
console.log("Prototype property access:", obj2.method());

console.log("\n" + "=".repeat(50) + "\n");

// ===================================================================
// 10. DEBUGGING HELPERS
// ===================================================================
console.log("10. DEBUGGING HELPERS");
console.log("=====================");

// Helper function to examine prototype chain
function examinePrototypeChain(obj, objName = "object") {
    console.log(`\nPrototype chain for ${objName}:`);
    let current = obj;
    let level = 0;
    
    while (current) {
        console.log(`Level ${level}: ${current.constructor.name}`);
        if (level > 5) break; // Prevent infinite loops
        current = Object.getPrototypeOf(current);
        level++;
    }
}

// Helper function to examine object properties
function examineObject(obj, objName = "object") {
    console.log(`\nExamining ${objName}:`);
    console.log("Own properties:", Object.getOwnPropertyNames(obj));
    console.log("Enumerable properties:", Object.keys(obj));
    console.log("Prototype:", Object.getPrototypeOf(obj).constructor.name);
}

// Example usage
examinePrototypeChain(dog, "dog");
examineObject(dog, "dog");

console.log("\n" + "=".repeat(50) + "\n");
console.log("Examples completed! Check console output for execution results.");

// ===================================================================
// EXPORT FOR NODE.JS MODULES (if needed)
// ===================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        mysterFunction,
        outerNeighborhood,
        Animal,
        examinePrototypeChain,
        examineObject,
        simulateAsyncPromise
    };
}
