/**
 * LLM Data Platform - Authentication Check
 * Silently checks if user is authenticated and only redirects to login if confirmed not authenticated
 * Prevents redirect loops and unnecessary refreshes
 */

// Skip auth check on login/signup pages
const isLoginPage = window.location.pathname.includes('login.html');
const isSignupPage = window.location.pathname.includes('signup.html');
const isAuthPage = isLoginPage || isSignupPage;

// Static flag to track if we've done the auth check
let authCheckCompleted = false;

// Wait for document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Skip auth check on login/signup pages
  if (isAuthPage) {
    console.log('On auth page, skipping auth check');
    return;
  }
  
  // To prevent multiple checks on the same page
  if (authCheckCompleted) {
    console.log('Auth check already completed on this page load');
    return;
  }
  authCheckCompleted = true;
  
  // Ensure Firebase is initialized before checking auth
  if (window.firebaseInitialized) {
    // Firebase is already initialized
    silentlyCheckAuth();
  } else {
    // Set up a listener for Firebase initialization
    console.log('Waiting for Firebase initialization...');
    window.addEventListener('firebaseInitialized', function() {
      silentlyCheckAuth();
    });
    
    // If Firebase doesn't initialize within 2 seconds, try anyway
    setTimeout(function() {
      if (typeof firebase !== 'undefined') {
        silentlyCheckAuth();
      } else {
        console.error('Firebase initialization timed out');
      }
    }, 2000);
  }
});

/**
 * Silently check authentication status without immediate redirect
 * Only redirects to login after confirmation that user is not authenticated
 */
function silentlyCheckAuth() {
  console.log('Silently checking user authentication...');
  
  try {
    // Make sure Firebase is available
    if (typeof firebase === 'undefined') {
      console.error('Firebase not available');
      return;
    }
    
    // Store current page for possible redirect after login
    const currentUrl = new URL(window.location.href);
    // Remove any query parameters that might cause loops
    currentUrl.search = '';
    const currentPage = currentUrl.toString();
    
    // Check if auth is initialized
    if (!firebase.auth) {
      console.error('Firebase auth not initialized');
      return;
    }
    
    // Static flag to ensure we only redirect once
    let authDecisionMade = false;
    
    // First: Try to get the cached user synchronously
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      console.log('User authenticated (sync):', currentUser.email);
      setupUserData(currentUser);
      return; // User is authenticated, exit early
    }
    
    // If we don't have a cached user, wait for the auth state to be fully determined
    console.log('No cached user, waiting for full authentication check...');
    
    // Set a safety timeout (5 seconds) to redirect if Firebase auth is slow
    const safetyTimeout = setTimeout(() => {
      if (!authDecisionMade) {
        console.log('Auth check taking too long, redirecting to be safe');
        redirectToLogin(currentPage);
      }
    }, 5000);
    
    // Listen for the auth state to change 
    const unsubscribe = firebase.auth().onAuthStateChanged(function(user) {
      // Clear the safety timeout since we got a response
      clearTimeout(safetyTimeout);
      
      // Immediately unsubscribe to prevent future callbacks
      unsubscribe();
      authDecisionMade = true;
      
      if (user) {
        // User is authenticated, proceed normally
        console.log('User authenticated (async):', user.email);
        setupUserData(user);
      } else {
        // User is definitely not authenticated, redirect to login
        console.log('User confirmed not authenticated, redirecting to login');
        redirectToLogin(currentPage);
      }
    });
  } catch (error) {
    console.error('Error during silent auth check:', error);
  }
}

/**
 * Handle redirect to login page after confirming user is not authenticated
 */
function redirectToLogin(currentPage) {
  // Prevent redirect loops
  if (sessionStorage.getItem('hasRedirectedToLogin')) {
    console.log('Already redirected once, not redirecting again');
    return;
  }
  
  // Store the current page to redirect back after login
  sessionStorage.setItem('redirectAfterLogin', currentPage);
  
  // Mark that we've redirected to prevent loops
  sessionStorage.setItem('hasRedirectedToLogin', 'true');
  
  // Redirect to login page
  window.location.href = 'login.html';
}

/**
 * Initialize user data after authentication
 */
function setupUserData(user) {
  if (!user) return;
  
  try {
    // Store user ID
    localStorage.setItem('userId', user.uid);
    
    // Initialize RugPull context data
    console.log('Setting up RugPull context for:', user.email);
    
    if (firebase && firebase.firestore) {
      window.rugPullUserContext = {
        userId: user.uid,
        dataSources: [],
        settings: {
          defaultLevel: 'subtle',
          enabled: true
        }
      };
      
      // Notify application that data is ready
      console.log('Dispatching authentication events');
      
      // Make sure we're dispatching events on elements that exist
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // Document is ready, dispatch immediately
        document.dispatchEvent(new CustomEvent('rugPullDataLoaded'));
        document.dispatchEvent(new CustomEvent('userAuthenticated', {
          detail: { userId: user.uid, email: user.email }
        }));
      } else {
        // Wait for document to be ready
        document.addEventListener('DOMContentLoaded', function() {
          document.dispatchEvent(new CustomEvent('rugPullDataLoaded'));
          document.dispatchEvent(new CustomEvent('userAuthenticated', {
            detail: { userId: user.uid, email: user.email }
          }));
        });
      }
    }
  } catch (error) {
    console.error('Error setting up user data:', error);
  }
}
