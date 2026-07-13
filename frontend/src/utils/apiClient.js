/**
 * Global API Client Wrapper
 * 
 * [Centralized API handler — so we don't repeat headers and error checks in 100 places (DRY principle!)]
 */
export async function fetchApi(url, options = {}) {
  const { method = 'GET', body, token, ...customHeaders } = options;

  const headers = {
    ...customHeaders,
  };

  // [Attach token if provided — keeping authentication consistent]
  if (token) {
    headers['X-Master-Token'] = token;
  }

  // [Auto-set content type for JSON bodies — one less thing to worry about]
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    // [Handle non-2xx responses gracefully — so the UI gets clean error messages]
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'API request failed');
    }

    // [Some endpoints might return empty bodies (like 204 No Content), so handle JSON parsing safely]
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    // [Bubble up the error so the caller can show a toast or handle it]
    throw error;
  }
}
