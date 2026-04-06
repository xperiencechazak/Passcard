/**
 * Centralized API utility for handling fetch calls with consistent base URLs,
 * headers, and error handling.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('admin_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_logged_in');
        window.dispatchEvent(new Event('admin-logout'));
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Failed to connect to the server. Please check your connection or ensure the server is running.');
    }
    throw error;
  }
};
