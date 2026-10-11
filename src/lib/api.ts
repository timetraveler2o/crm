// Initialize API Base URL
// Dynamically detects environment: local dev, custom API URL, or deployed HTTPS site
export const getApiBaseUrl = (): string => {
  // If explicitly provided via environment variable
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) {
    return String(envUrl).replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol, origin } = window.location;
    // Local development targets local backend port 3000
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return `http://${hostname}:3000`;
    }
    // Deployed site over HTTPS uses same origin to avoid mixed-content security blocks
    if (protocol === 'https:') {
      return origin;
    }
    return `http://${hostname}:3000`;
  }
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

// Standard Fetch Wrapper with automatic fallback
export const client = {
  api: {
    fetch: async (path: string, options?: RequestInit) => {
      const base = getApiBaseUrl();
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      try {
        const fullUrl = base ? `${base}${cleanPath}` : cleanPath;
        const res = await fetch(fullUrl, options);
        return res;
      } catch (err) {
        console.warn(`[API Fetch Warning] Direct fetch to ${base}${cleanPath} failed, attempting fallback:`, err);
        // Fallback 1: try relative path (works if reverse proxied on deployed host)
        try {
          return await fetch(cleanPath, options);
        } catch {
          // Fallback 2: localhost / 127.0.0.1 toggle
          const altHost = (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1')
            ? 'localhost'
            : '127.0.0.1';
          return fetch(`http://${altHost}:3000${cleanPath}`, options);
        }
      }
    }
  }
};

// Helper for image compression
import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.1, // Max 100KB for ultra-fast CRM loading and minimal storage
    maxWidthOrHeight: 1280,
    initialQuality: 0.7,
    useWebWorker: true,
  };
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Image compression failed:", error);
    return file; // Return original if compression fails
  }
};

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressedFile);

    const res = await fetch(`${API_BASE_URL}/api/public/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) throw new Error("Failed to upload image");
    const { path } = await res.json();
    return path;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

export const uploadFile = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/api/public/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) throw new Error("Failed to upload file");
    const { path } = await res.json();
    return path;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

export const getImageUrl = async (path: string): Promise<string> => {
  if (!path) return '';
  return `${API_BASE_URL}${path}`;
};
