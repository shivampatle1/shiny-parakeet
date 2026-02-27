const BASE = `${import.meta.env.VITE_API_URL}/api`;
const UPLOADS = `${import.meta.env.VITE_API_URL}/uploads`;

export async function apiFetch(path, options = {}, token = null) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

// For multipart/form-data (file uploads) — do NOT set Content-Type, browser handles it
export async function apiFetchForm(path, formData, token = null) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { method: 'POST', body: formData, headers });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

// Avatar helper — returns full URL to profile pic or null
export function avatarUrl(profilePicture) {
    if (!profilePicture) return null;
    return `${UPLOADS}/${profilePicture}`;
}

// Uploads base URL (for direct use in components)
export { UPLOADS };
