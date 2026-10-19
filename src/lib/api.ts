// Initialize API Base URL
// Dynamically detects environment: local dev, custom API URL, or deployed HTTPS site
export const getApiBaseUrl = (): string => {
  // If explicitly provided via environment variable
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) {
    return String(envUrl).replace(/\/$/, '');
  }

  // When running in browser:
  // In dev (127.0.0.1:5173), Vite dev server proxies /api directly to https://getsetflightcrm.netlify.app
  // In production (getsetflightcrm.netlify.app), Netlify routes /api directly to functions
  // Returning empty string '' ensures same-origin relative URLs without CORS or port 3000 refusal
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

const LIVE_API_FALLBACK = 'https://getsetflightcrm.netlify.app';

// Standard Fetch Wrapper with automatic fallback
export const client = {
  api: {
    fetch: async (path: string, options?: RequestInit) => {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;

      const tryFetch = async (url: string) => {
        const res = await fetch(url, options);
        const contentType = res.headers.get('content-type') || '';
        // If server returned HTML instead of JSON (e.g. Vite SPA fallback when offline), throw to trigger fallback
        if (contentType.includes('text/html') && !cleanPath.includes('/uploads/')) {
          throw new Error('Endpoint returned HTML instead of API JSON response');
        }
        return res;
      };

      try {
        // Try same-origin relative path first (seamlessly proxied by Vite or Netlify)
        return await tryFetch(cleanPath);
      } catch (err) {
        console.warn(`[API Fetch Warning] Direct fetch to ${cleanPath} failed, attempting live production fallback:`, err);
        try {
          return await tryFetch(`${LIVE_API_FALLBACK}${cleanPath}`);
        } catch (liveErr) {
          console.warn(`[API Fetch Fallback Failed]:`, liveErr);
          // Last resort: raw fetch
          return await fetch(cleanPath, options);
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
