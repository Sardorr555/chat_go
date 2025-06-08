/**
 * Firebase Initialization Script
 * This script initializes Firebase for client-side use
 */

// Firebase configuration 
// These values match the server-side configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOKeEnQuV_bkKXq7lE08tEZ-S7CuAHXlw",
  authDomain: "swipies-ai.firebaseapp.com",
  projectId: "swipies-ai",
  storageBucket: "swipies-ai.appspot.com",
  messagingSenderId: "705282430100",
  appId: "1:705282430100:web:bc179e131a6dea6b6f5081",
  measurementId: "G-E7MF4TNZ5T"
};

// Initialize Firebase
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    // Initialize Firebase with the configuration
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    // Set the flag that Firebase has been initialized
    firebaseInitialized = true;
    window.firebaseInitialized = true;
    
    // Dispatch event for any listeners waiting for Firebase
    const event = new Event('firebaseInitialized');
    window.dispatchEvent(event);
    
    console.log('Firebase successfully initialized');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    
    // Even if there's an error, we'll set this to avoid repeated initialization attempts
    firebaseInitialized = true;
    window.firebaseInitialized = false;
  }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if Firebase SDK is loaded
  if (typeof firebase !== 'undefined') {
    initializeFirebase();
  } else {
    console.error('Firebase SDK not loaded. Cannot initialize Firebase.');
  }
});

// Export the initialization function
window.initializeFirebase = initializeFirebase;
