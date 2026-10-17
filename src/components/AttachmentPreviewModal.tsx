import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink, FileText } from 'lucide-react';
import { AttachmentDoc, isImageDoc, isPdfDoc, createSafeUrl, downloadAttachment, formatFileSize, getDocBadgeInfo } from '../lib/documentUtils';

interface Props {
  doc: AttachmentDoc | null;
  onClose: () => void;
}

export default function AttachmentPreviewModal({ doc, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [safeUrl, setSafeUrl] = useState('');
  const [isBlob, setIsBlob] = useState(false);

  useEffect(() => {
    if (!doc) {
      setSafeUrl('');
      return;
    }

    setZoom(1);
    setRotation(0);
    const { url, isBlob: blobCreated } = createSafeUrl(doc);
    setSafeUrl(url);
    setIsBlob(blobCreated);

    return () => {
      if (blobCreated && url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [doc]);

  if (!doc) return null;

  const isImg = isImageDoc(doc);
  const isPdf = isPdfDoc(doc);
  const badge = getDocBadgeInfo(doc);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleDownload = () => downloadAttachment(doc);

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex flex-col justify-between p-3 sm:p-6 animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div 
        className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 text-white z-10 border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <span className="text-2xl flex-shrink-0">{badge.icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold truncate text-white">{doc.name}</h3>
            <p className="text-xs text-white/70">
              {badge.label} {doc.size ? `• ${formatFileSize(doc.size)}` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {isImg && (
            <>
              <button 
                onClick={handleZoomIn} 
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/90 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button 
                onClick={handleZoomOut} 
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/90 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button 
                onClick={handleRotate} 
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/90 hover:text-white"
                title="Rotate 90°"
              >
                <RotateCw size={18} />
              </button>
            </>
          )}

          {isPdf && safeUrl && (
            <button 
              onClick={() => window.open(safeUrl, '_blank')}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all text-xs font-semibold text-white flex items-center gap-1.5"
              title="Open in new window"
            >
              <ExternalLink size={14} /> Full Screen
            </button>
          )}

          <button 
            onClick={handleDownload}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all text-xs font-bold text-white flex items-center gap-1.5 shadow-lg"
            title="Download document"
          >
            <Download size={14} /> Download
          </button>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-500/80 rounded-xl transition-all text-white/90 hover:text-white ml-1"
            title="Close preview"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div 
        className="flex-1 flex items-center justify-center my-3 overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {isImg ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
            <img 
              src={safeUrl} 
              alt={doc.name}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition-all pointer-events-auto"
            />
          </div>
        ) : isPdf ? (
          <div className="w-full h-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <iframe 
              src={safeUrl} 
              title={doc.name}
              className="w-full h-full flex-1 border-0 rounded-2xl"
            />
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-gray-100 animate-fadeIn">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center text-4xl mx-auto mb-4 border border-indigo-200">
              {badge.icon}
            </div>
            <h4 className="text-lg font-bold text-gray-900 break-words mb-1">{doc.name}</h4>
            <p className="text-xs text-gray-500 mb-6">
              {badge.label} Document {doc.size ? `(${formatFileSize(doc.size)})` : ''}
            </p>
            <button
              onClick={handleDownload}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Download size={16} /> Download {badge.label}
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-white/50 text-xs">
        Press ESC or click outside to close • Direct secure download supported
      </div>
    </div>
  );
}