import { useState, useEffect, useCallback, useRef } from 'react';
import { getImageUrl } from '../lib/api';

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
  textSize?: string;
}

// Generate consistent color from name
const nameColors = [
  'from-rose-400 to-pink-500',
  'from-orange-400 to-red-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-cyan-400 to-blue-500',
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-fuchsia-400 to-pink-500',
  'from-teal-400 to-cyan-500',
  'from-indigo-400 to-violet-500',
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return nameColors[Math.abs(hash) % nameColors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name ? name[0].toUpperCase() : '?';
}

export default function Avatar({ src, name, className = "w-8 h-8", textSize = "text-xs" }: AvatarProps) {
  const [url, setUrl] = useState<string>('');
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const srcRef = useRef(src);

  // Re-resolve the image from API (handles expired presigned URLs)
  const resolveImage = useCallback(async (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      setUrl(imagePath);
    } else {
      try {
        const resolved = await getImageUrl(imagePath);
        if (resolved) {
          setUrl(resolved);
          setFailed(false);
        } else {
          setFailed(true);
        }
      } catch {
        setFailed(true);
      }
    }
  }, []);

  useEffect(() => {
    srcRef.current = src;
    setFailed(false);
    setRetryCount(0);
    if (src) {
      resolveImage(src);
    } else {
      setUrl('');
    }
  }, [src, resolveImage]);

  // Re-resolve presigned URLs every 30 minutes to prevent expiry
  useEffect(() => {
    if (!src || src.startsWith('http')) return;
    const interval = setInterval(() => {
      if (srcRef.current && !srcRef.current.startsWith('http')) {
        resolveImage(srcRef.current);
      }
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [src, resolveImage]);

  const handleError = useCallback(() => {
    if (retryCount < 3) {
      // Re-resolve from API on error (handles expired presigned URLs)
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        if (srcRef.current) {
          if (srcRef.current.startsWith('http')) {
            // For direct URLs, try cache-busting
            setUrl(srcRef.current + (srcRef.current.includes('?') ? '&' : '?') + '_r=' + Date.now());
          } else {
            // For R2 paths, re-resolve to get fresh presigned URL
            resolveImage(srcRef.current);
          }
        }
      }, 1500 * (retryCount + 1));
    } else {
      setFailed(true);
    }
  }, [retryCount, resolveImage]);

  const colorClass = getColorForName(name);
  const initials = getInitials(name);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        className={`${className} rounded-full object-cover flex-shrink-0`}
        onError={handleError}
      />
    );
  }

  return (
    <div className={`${className} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white ${textSize} font-bold flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}
