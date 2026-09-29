const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const error = new Error(data?.error || 'Something went wrong');
    error.status = res.status;
    error.body = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
};
