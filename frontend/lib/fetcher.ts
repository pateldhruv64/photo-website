const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * SWR fetcher with error handling.
 * All API calls go through this — ensures consistency.
 */
export const fetcher = async (url: string) => {
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
  const res = await fetch(fullUrl, {
    credentials: 'include', // Send cookies for auth
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const error = new Error('API request failed') as Error & { status: number; info: unknown };
    error.status = res.status;
    try {
      error.info = await res.json();
    } catch {
      error.info = { error: res.statusText };
    }
    throw error;
  }
  
  return res.json();
};

/**
 * API helper for mutations (POST, PUT, DELETE)
 */
export const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  body?: Record<string, unknown>
) => {
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(fullUrl, options);
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || 'Request failed');
  }
  
  return res.json();
};
