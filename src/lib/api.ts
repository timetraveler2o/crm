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

export const fileToBase64 = (file: Blob | File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Canvas-based fallback compression if WebWorker fails
const compressWithCanvas = (file: File, maxDimension = 1200, quality = 0.75): Promise<File> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = url;
    } catch {
      resolve(file);
    }
  });
};

export const compressImage = async (file: File): Promise<File> => {
  // If not an image (e.g. PDF or DOC), return as-is
  if (file.type && !file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB: 0.2, // Under 200KB for fast loading and minimal storage
    maxWidthOrHeight: 1280,
    initialQuality: 0.75,
    useWebWorker: true,
  };
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.warn('browser-image-compression worker failed, falling back to Canvas:', error);
    try {
      return await compressWithCanvas(file, 1280, 0.75);
    } catch {
      return file;
    }
  }
};

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressedFile);

    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/public/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.path) {
        return data.path;
      }
    }
  } catch (error) {
    console.warn('Server upload failed, using high-efficiency Base64 Data URL fallback:', error);
  }

  // Resilient fallback: store compressed base64 so upload NEVER fails or causes white screens
  try {
    const compressedFile = await compressImage(file);
    return await fileToBase64(compressedFile);
  } catch {
    return await fileToBase64(file);
  }
};

export const uploadFile = async (file: File): Promise<string> => {
  try {
    let fileToUpload: File = file;
    // Compress if file is an image (e.g. photo of Aadhar or PAN card)
    if (file.type && file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file);
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    const base = getApiBaseUrl();
    const res = await fetch(`${base}/api/public/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.path) {
        return data.path;
      }
    }
  } catch (error) {
    console.warn('Server uploadFile failed, using Base64 Data URL fallback:', error);
  }

  // Base64 fallback ensures no document upload ever breaks or throws
  try {
    if (file.type && file.type.startsWith('image/')) {
      const compressed = await compressImage(file);
      return await fileToBase64(compressed);
    }
    return await fileToBase64(file);
  } catch {
    return '';
  }
};

export const getImageUrl = async (path: string): Promise<string> => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
