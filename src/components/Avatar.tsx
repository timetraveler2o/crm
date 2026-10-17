import { useState, useEffect, useCallback, useRef } from 'react';
import { getImageUrl } from '../lib/api';

interface AvatarProps {
  src?: string;
  name?: string;
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

function getColorForName(name?: string): string {
  if (!name || typeof name !== 'string') return nameColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return nameColors[Math.abs(hash) % nameColors.length];
}

function getInitials(name?: string): string {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim() ? name.trim()[0].toUpperCase() : 'U';
}

export default function Avatar({ src, name = 'User', className = "w-8 h-8", textSize = "text-xs" }: AvatarProps) {
  const [url, setUrl] = useState<string>('');
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const srcRef = useRef(src);

  // Re-resolve the image from API (handles direct links, data URLs, and paths)
  const resolveImage = useCallback(async (imagePath: string) => {
    if (!imagePath) {
      setUrl('');
      return;
    }
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
      setUrl(imagePath);
      setFailed(false);
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

  // Re-resolve presigned URLs every 30 minutes to prevent expiry (skip data/http URLs)
  useEffect(() => {
    if (!src || src.startsWith('http') || src.startsWith('data:')) return;
    const interval = setInterval(() => {
      if (srcRef.current && !srcRef.current.startsWith('http') && !srcRef.current.startsWith('data:')) {
        resolveImage(srcRef.current);
      }
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [src, resolveImage]);

  const handleError = useCallback(() => {
    if (retryCount < 2 && srcRef.current && !srcRef.current.startsWith('data:')) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        if (srcRef.current) {
          if (srcRef.current.startsWith('http')) {
            setUrl(srcRef.current + (srcRef.current.includes('?') ? '&' : '?') + '_r=' + Date.now());
          } else {
            resolveImage(srcRef.current);
          }
        }
      }, 1500 * (retryCount + 1));
    } else {
      setFailed(true);
    }
  }, [retryCount, resolveImage]);

  const safeName = name || 'User';
  const colorClass = getColorForName(safeName);
  const initials = getInitials(safeName);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={safeName}
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
