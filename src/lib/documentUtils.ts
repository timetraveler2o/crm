// Centralized Document and Image Management for CRM
import { compressImage } from './api';

export interface AttachmentDoc {
  id?: string;
  name: string;        // e.g. "Passport.pdf", "Ticket.png"
  type: string;        // e.g. "application/pdf", "image/png"
  url: string;         // Data URI (data:...) or remote URL (http...) or path (/uploads/...)
  size?: number;       // bytes
}

// Convert Data URI to Blob for safe downloads and browser previewing
export function dataUriToBlob(dataUri: string): Blob {
  try {
    const parts = dataUri.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const b64 = parts[1] || '';
    const byteString = atob(b64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return new Blob([uint8Array], { type: mime });
  } catch (err) {
    console.warn('[dataUriToBlob error]:', err);
    return new Blob([], { type: 'application/octet-stream' });
  }
}

// Create a safe object URL from either a Data URI or remote URL
export function createSafeUrl(docOrUrl: AttachmentDoc | string): { url: string; isBlob: boolean } {
  const rawUrl = typeof docOrUrl === 'string' ? docOrUrl : docOrUrl.url;
  if (!rawUrl) return { url: '', isBlob: false };

  if (rawUrl.startsWith('data:')) {
    try {
      const blob = dataUriToBlob(rawUrl);
      return { url: URL.createObjectURL(blob), isBlob: true };
    } catch {
      return { url: rawUrl, isBlob: false };
    }
  }

  return { url: rawUrl, isBlob: false };
}

// Extract clean file extension
export function getFileExtension(filenameOrUrl: string): string {
  if (!filenameOrUrl) return '';
  if (filenameOrUrl.startsWith('data:')) {
    const mime = filenameOrUrl.split(';')[0].replace('data:', '').toLowerCase();
    const sub = mime.split('/')[1] || '';
    if (sub === 'jpeg') return 'jpg';
    if (sub === 'svg+xml') return 'svg';
    return sub;
  }
  const clean = filenameOrUrl.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

// Check if document is an image
export function isImageDoc(docOrUrl: AttachmentDoc | string): boolean {
  if (!docOrUrl) return false;
  const type = typeof docOrUrl === 'object' ? docOrUrl.type : '';
  const url = typeof docOrUrl === 'object' ? docOrUrl.url : docOrUrl;
  const name = typeof docOrUrl === 'object' ? docOrUrl.name : '';

  if (type && type.startsWith('image/')) return true;
  if (url && (url.startsWith('data:image/') || url.includes('image/'))) return true;

  const ext = getFileExtension(name || url);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'tiff'].includes(ext);
}

// Check if document is a PDF
export function isPdfDoc(docOrUrl: AttachmentDoc | string): boolean {
  if (!docOrUrl) return false;
  const type = typeof docOrUrl === 'object' ? docOrUrl.type : '';
  const url = typeof docOrUrl === 'object' ? docOrUrl.url : docOrUrl;
  const name = typeof docOrUrl === 'object' ? docOrUrl.name : '';

  if (type === 'application/pdf') return true;
  if (url && (url.startsWith('data:application/pdf') || url.includes('application/pdf'))) return true;

  const ext = getFileExtension(name || url);
  return ext === 'pdf';
}

// Get icon, color, and label for any document type
export function getDocBadgeInfo(docOrUrl: AttachmentDoc | string): { icon: string; label: string; color: string; bgColor: string } {
  if (isImageDoc(docOrUrl)) {
    return { icon: '🖼️', label: 'Image', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' };
  }
  if (isPdfDoc(docOrUrl)) {
    return { icon: '📄', label: 'PDF', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
  }

  const name = typeof docOrUrl === 'object' ? docOrUrl.name : docOrUrl;
  const ext = getFileExtension(name);

  if (['doc', 'docx'].includes(ext)) {
    return { icon: '📝', label: 'Word', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return { icon: '📊', label: 'Excel', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' };
  }
  if (['txt', 'rtf'].includes(ext)) {
    return { icon: '📃', label: 'Text', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' };
  }
  return { icon: '📎', label: ext.toUpperCase() || 'Doc', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200' };
}

// Format byte size cleanly (e.g. 142 KB, 1.2 MB)
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Normalize a single item (object or string) into an AttachmentDoc
export function normalizeAttachmentDoc(item: any, idx = 0): AttachmentDoc | null {
  if (!item) return null;

  // Case 1: Already an object
  if (typeof item === 'object' && item.url) {
    let name = item.name;
    let type = item.type;
    const url = String(item.url);

    if (!name) {
      const ext = getFileExtension(url);
      name = `attachment_${idx + 1}${ext ? `.${ext}` : ''}`;
    }
    if (!type) {
      if (url.startsWith('data:')) {
        type = url.split(';')[0].replace('data:', '');
      } else if (name.endsWith('.pdf')) {
        type = 'application/pdf';
      } else {
        type = 'application/octet-stream';
      }
    }

    return {
      id: item.id || `doc-${Date.now()}-${idx}`,
      name,
      type,
      url,
      size: Number(item.size) || 0,
    };
  }

  // Case 2: String (Data URI, URL, or path)
  if (typeof item === 'string') {
    const str = item.trim();
    if (!str) return null;

    let type = 'application/octet-stream';
    let name = `attachment_${idx + 1}`;
    let size = 0;

    if (str.startsWith('data:')) {
      const mime = str.split(';')[0].replace('data:', '');
      type = mime || type;
      const ext = getFileExtension(str);
      name = `attachment_${idx + 1}.${ext || 'bin'}`;
      const base64Len = str.split(',')[1]?.length || 0;
      size = Math.round((base64Len * 3) / 4);
    } else {
      const clean = str.split('?')[0].split('#')[0];
      const parts = clean.split('/');
      name = parts[parts.length - 1] || name;
      name = name.replace(/^\d+-/, '');
      const ext = getFileExtension(name);
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      } else if (ext === 'pdf') {
        type = 'application/pdf';
      }
    }

    return {
      id: `doc-${Date.now()}-${idx}`,
      name,
      type,
      url: str,
      size,
    };
  }

  return null;
}

/**
 * Robust attachment parser:
 * - Parses JSON arrays of AttachmentDoc or strings
 * - Automatically heals legacy comma-separated data URIs that were split at "data:...;base64,"
 * - Handles raw Base64, URLs, and file paths
 */
export function parseAttachmentDocs(raw: any): AttachmentDoc[] {
  if (!raw) return [];

  // If already an array
  if (Array.isArray(raw)) {
    return raw.map((item, idx) => normalizeAttachmentDoc(item, idx)).filter(Boolean) as AttachmentDoc[];
  }

  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // 1. Try JSON parsing
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => normalizeAttachmentDoc(item, idx)).filter(Boolean) as AttachmentDoc[];
      }
      if (parsed && typeof parsed === 'object') {
        const doc = normalizeAttachmentDoc(parsed, 0);
        return doc ? [doc] : [];
      }
    } catch {}
  }

  // 2. Detect & heal legacy comma-split corruption
  const parts = trimmed.split(',');
  const docs: AttachmentDoc[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Is this a data URI header without body? E.g. "data:image/jpeg;base64"
    if (part.startsWith('data:') && part.includes(';base64') && !part.includes(';base64,') && i + 1 < parts.length) {
      // Re-stitch header and body with the comma!
      const fullDataUri = `${part},${parts[i + 1].trim()}`;
      const doc = normalizeAttachmentDoc(fullDataUri, docs.length);
      if (doc) docs.push(doc);
      i++;
    } else if (part.startsWith('data:')) {
      const doc = normalizeAttachmentDoc(part, docs.length);
      if (doc) docs.push(doc);
    } else if (part.startsWith('http://') || part.startsWith('https://') || part.startsWith('/')) {
      const doc = normalizeAttachmentDoc(part, docs.length);
      if (doc) docs.push(doc);
    } else if (/^[A-Za-z0-9+/=]+$/.test(part) && part.length > 50) {
      const fullDataUri = `data:image/jpeg;base64,${part}`;
      const doc = normalizeAttachmentDoc(fullDataUri, docs.length);
      if (doc) docs.push(doc);
    }
  }

  if (docs.length > 0) return docs;

  const single = normalizeAttachmentDoc(trimmed, 0);
  return single ? [single] : [];
}

/**
 * Serializes attachment docs into a safe JSON array string
 * to prevent any comma-splitting corruption in the database.
 */
export function serializeAttachmentDocs(docs: (AttachmentDoc | string)[]): string {
  if (!docs || docs.length === 0) return '';
  const normalized = docs.map((d, i) => normalizeAttachmentDoc(d, i)).filter(Boolean);
  return JSON.stringify(normalized);
}

/**
 * Process a user-selected File:
 * - If image: compresses to keep storage under ~300KB while preserving high visual quality.
 * - If document (PDF, Word, Excel, etc.): reads cleanly into base64 data URI without compression.
 * - Returns a fully formed AttachmentDoc with original name, type, and size.
 */
export async function processUploadedFile(file: File): Promise<AttachmentDoc> {
  const isImg = file.type.startsWith('image/');
  let dataUrl = '';
  let finalSize = file.size;

  if (isImg) {
    try {
      const compressed = await compressImage(file);
      finalSize = compressed.size;
      dataUrl = await fileToDataUrl(compressed);
    } catch {
      dataUrl = await fileToDataUrl(file);
    }
  } else {
    dataUrl = await fileToDataUrl(file);
  }

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    type: file.type || (isImg ? 'image/jpeg' : 'application/octet-stream'),
    url: dataUrl,
    size: finalSize,
  };
}

// Convert File / Blob to Data URL
export function fileToDataUrl(file: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Safe download handler that works across all browsers for Data URIs and remote URLs:
 * - Converts Data URIs to Blob Object URLs to prevent browser security blocks
 * - Sets the correct download filename and extension
 */
export function downloadAttachment(docOrUrl: AttachmentDoc | string, fallbackName = 'document') {
  const doc = typeof docOrUrl === 'string' ? normalizeAttachmentDoc(docOrUrl, 0) : docOrUrl;
  if (!doc || !doc.url) return;

  const filename = doc.name || `${fallbackName}.${getFileExtension(doc.url) || 'bin'}`;

  if (doc.url.startsWith('data:')) {
    const blob = dataUriToBlob(doc.url);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  } else {
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}