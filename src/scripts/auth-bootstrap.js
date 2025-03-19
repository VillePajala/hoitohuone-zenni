/**
 * Auth Bootstrap Script
 * 
 * This script runs in the browser to help prevent authentication loops
 * by clearing auth state when needed.
 */

(function() {
  // Function to detect auth loops
  function detectAuthLoop() {
    try {
      // Check for recent navigations
      const navHistory = JSON.parse(sessionStorage.getItem('auth_navigation') || '[]');
      const now = Date.now();
      
      // Add current URL to history
      navHistory.push({
        url: window.location.pathname,
        time: now
      });
      
      // Keep only last 10 navigations
      if (navHistory.length > 10) {
        navHistory.shift();
      }
      
      // Save updated history
      sessionStorage.setItem('auth_navigation', JSON.stringify(navHistory));
      
      // Check for loop pattern (same URL visited multiple times in short period)
      const lastMinute = now - 60000; // 1 minute
      const recentNavs = navHistory.filter(nav => nav.time > lastMinute);
      
      // Create a map of URL frequencies
      const urlCounts = {};
      recentNavs.forEach(nav => {
        urlCounts[nav.url] = (urlCounts[nav.url] || 0) + 1;
      });
      
      // Check if any URL was visited more than 3 times in the last minute
      for (const url in urlCounts) {
        if (urlCounts[url] >= 3) {
          console.error('Auth loop detected! Same URL visited 3+ times in one minute:', url);
          return true;
        }
      }
      
      return false;
    } catch (e) {
      console.error('Error in auth loop detection:', e);
      return false;
    }
  }
  
  // Function to clear auth state
  function clearAuthState() {
    console.log('🔄 Clearing auth state to break potential loop');
    
    try {
      // Clear Clerk-related cookies
      document.cookie.split(";").forEach(c => {
        if (c.includes('__clerk') || c.includes('__session')) {
          const cookieName = c.split("=")[0].trim();
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      // Clear relevant sessionStorage items
      sessionStorage.removeItem('clerk');
      sessionStorage.removeItem('clerk:auth');
      sessionStorage.removeItem('auth_navigation');
      
      // Mark that we've cleared auth
      localStorage.setItem('auth_cleared_at', Date.now().toString());
      
      // Reload with a clean URL if on certain problematic pages
      const path = window.location.pathname;
      if (path.includes('/admin/sign-in') || path.includes('/admin/dashboard')) {
        window.location.href = '/admin/sign-in?cleared=true';
        return true;
      }
    } catch (e) {
      console.error('Error clearing auth state:', e);
    }
    
    return false;
  }
  
  // Main function
  function initAuthBootstrap() {
    // Only run in admin sections
    if (!window.location.pathname.includes('/admin')) {
      return;
    }
    
    console.log('🔒 Auth bootstrap initialized');
    
    // Check if we recently cleared auth to avoid repeated clearing
    const lastCleared = parseInt(localStorage.getItem('auth_cleared_at') || '0');
    const now = Date.now();
    const timeSinceLastClear = now - lastCleared;
    
    // If we cleared auth in the last 5 seconds, don't do anything
    if (timeSinceLastClear < 5000) {
      console.log('Recently cleared auth, skipping check');
      return;
    }
    
    // Check for auth loop
    if (detectAuthLoop()) {
      clearAuthState();
    }
  }
  
  // Run on page load
  if (document.readyState === 'complete') {
    initAuthBootstrap();
  } else {
    window.addEventListener('load', initAuthBootstrap);
  }
})(); 