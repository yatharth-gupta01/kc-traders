import { API_URL } from '../config/api';

/**
 * Custom wrapper around fetch to add:
 * 1. Timeout protection (default 10 seconds)
 * 2. Transient network failure retries (up to 2 times)
 * 3. Automatic JWT insertion
 * 4. Silent token refresh interception on 401 response
 */
export async function apiClient(endpoint, options = {}, retries = 2) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  // Initialize headers
  options.headers = options.headers || {};
  if (!(options.body instanceof FormData)) {
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
  }
  
  // Attach Access Token
  const token = localStorage.getItem('kc_token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  // Setup abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  options.signal = controller.signal;

  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    // If unauthorized, attempt to perform token refresh
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        // Retry original request with new token
        const newToken = localStorage.getItem('kc_token');
        options.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Re-setup timeout controller for retry
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 10000);
        options.signal = retryController.signal;
        
        const retryRes = await fetch(url, options);
        clearTimeout(retryTimeoutId);
        return retryRes;
      } else {
        // Refresh failed, clear session and dispatch logout
        logoutUser();
        throw new Error("Session expired. Please log in again.");
      }
    }

    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    
    // Retry on transient network errors or timeouts
    if (retries > 0 && (err.name === 'AbortError' || err.message.includes('Network') || err.message.includes('Failed to fetch'))) {
      console.warn(`API request to ${endpoint} failed. Retrying... (${retries} attempts left)`);
      return apiClient(endpoint, options, retries - 1);
    }
    
    throw err;
  }
}

// Helper to request a refreshed access token
async function attemptTokenRefresh() {
  const localUser = localStorage.getItem('kc_user');
  const fallbackRefreshToken = localUser ? JSON.parse(localUser).refreshToken : null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: fallbackRefreshToken })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('kc_token', data.token);
        if (data.refreshToken) {
          const userObj = JSON.parse(localStorage.getItem('kc_user') || '{}');
          userObj.token = data.token;
          userObj.refreshToken = data.refreshToken;
          localStorage.setItem('kc_user', JSON.stringify(userObj));
        }
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("Token refresh call failed:", err);
    return false;
  }
}

// Helper to clear credentials and dispatch event to context
function logoutUser() {
  localStorage.removeItem('kc_token');
  localStorage.removeItem('kc_user');
  localStorage.removeItem('kc_cart');
  window.dispatchEvent(new Event('kc-logout'));
}
