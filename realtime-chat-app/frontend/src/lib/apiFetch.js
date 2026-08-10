/**
 * API utility — token-aware fetch wrapper
 */
const API_BASE_URL = 'http://localhost:8081';

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API error ${response.status}`);
  }

  // Handle 204 No Content
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export { API_BASE_URL };
