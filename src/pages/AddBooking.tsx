import { 
  AttachmentDoc, 
  parseAttachmentDocs, 
  serializeAttachmentDocs, 
  processUploadedFile, 
  downloadAttachment, 
  isImageDoc, 
  getDocBadgeInfo, 
  formatFileSize 
} from '../lib/documentUtils';
import AttachmentPreviewModal from '../components/AttachmentPreviewModal';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useCrmStore } from '../store/crmStore';
import { QUERY_STATUSES, QUERY_SOURCES, CABINS, PnrDetail, RemarkEntry, SUPPLIERS, PAYMENT_METHODS } from '../types';
import { AIRPORTS } from '../data/airports';
import { uploadImage, uploadFile, getImageUrl } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Plus, X, Check, ChevronsUpDown, Image as ImageIcon, ArrowLeft, Eye, Mail, Loader2, Trash2, Upload, Download } from 'lucide-react';
import { client } from '../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';
import { safeParsePnrDetails } from '../lib/utils';

// Force-download helper: fetch blob and trigger download for cross-origin URLs
function forceDownloadFile(url: string, filename: string) {
  if (url.startsWith('data:')) {
    // Data URIs can be downloaded directly
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(() => {
      window.open(url, '_blank');
    });
}

// Verification Section Component for Edit Mode
function VerificationSection({ bookingId }: { bookingId: number }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  useEffect(() => {
    client.api.fetch(`/api/public/verification/booking/${bookingId}`)
      .then(r => r.json())
      .then((res: any) => {
        if (res.success) {
          setData(res.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) return <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center text-gray-400 text-sm">Loading verification data...</div>;
  if (!data.length) return null;

  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-4 text-white flex items-center justify-between">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Eye size={18} /> Client Identity Verification Details
        </h3>
        <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">{data.length} record{data.length > 1 ? 's' : ''}</span>
      </div>
      <div className="p-4 space-y-4">
        {data.map((v: any, idx: number) => (
          <div key={v.id || idx} className={`border rounded-xl p-4 transition-all ${
            (v.reviewStatus || v.review_status) === 'approved' ? 'border-green-300 bg-green-50/40' : 
            (v.reviewStatus || v.review_status) === 'rejected' ? 'border-red-300 bg-red-50/40' : 
            'border-blue-200 bg-blue-50/30'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  (v.reviewStatus || v.review_status || v.status) === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                  (v.reviewStatus || v.review_status || v.status) === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                  v.status === 'submitted' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  'bg-yellow-100 text-yellow-700 border border-yellow-200'
                }`}>{((v.reviewStatus || v.review_status || v.status) || 'pending').toUpperCase()}</span>
                {(v.documentType || v.document_type) && <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">{v.documentType || v.document_type}</span>}
                {v.client_name && <span className="text-xs text-gray-700 font-medium">Client: <strong>{v.client_name}</strong></span>}
                {v.client_email && <span className="text-xs text-gray-500">({v.client_email})</span>}
              </div>
              <span className="text-xs text-gray-500 font-mono">{v.submitted_at || v.created}</span>
            </div>

            {/* Images Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {(v.selfieImage || v.selfie_image) && (() => {
                const raw = v.selfieImage || v.selfie_image;
                const src = raw.startsWith('data:image/') ? raw : raw.startsWith('http') ? raw : raw.startsWith('uploads/') ? `${API_BASE_URL}/${raw}` : `data:image/jpeg;base64,${raw}`;
                return (
                  <div className="relative group cursor-pointer" onClick={() => setZoomImg(src)}>
                    <img src={src} alt="Selfie" className="w-full h-24 object-cover rounded-xl border border-gray-200 shadow-sm hover:scale-[1.02] transition-transform" />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-medium">Selfie Front</span>
                    <button onClick={(e) => { e.stopPropagation(); forceDownloadFile(src, `selfie-${v.id}.jpg`); }} className="absolute top-1 right-1 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download size={12} />
                    </button>
                  </div>
                );
              })()}
              {(v.selfie_image_back || v.selfieImageBack) && (() => {
                const raw = v.selfie_image_back || v.selfieImageBack;
                const src = raw.startsWith('data:image/') ? raw : raw.startsWith('http') ? raw : raw.startsWith('uploads/') ? `${API_BASE_URL}/${raw}` : `data:image/jpeg;base64,${raw}`;
                return (
                  <div className="relative group cursor-pointer" onClick={() => setZoomImg(src)}>
                    <img src={src} alt="Selfie Back" className="w-full h-24 object-cover rounded-xl border border-gray-200 shadow-sm hover:scale-[1.02] transition-transform" />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-medium">Selfie with Card</span>
                    <button onClick={(e) => { e.stopPropagation(); forceDownloadFile(src, `selfie-back-${v.id}.jpg`); }} className="absolute top-1 right-1 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download size={12} />
                    </button>
                  </div>
                );
              })()}
              {(() => {
                const docImg = v.documentImage || v.document_image;
                if (!docImg) return null;
                const normSrc = (raw: string) => raw.startsWith('data:image/') ? raw : raw.startsWith('http') ? raw : raw.startsWith('uploads/') ? `${API_BASE_URL}/${raw}` : `data:image/jpeg;base64,${raw}`;
                try {
                  const photos = JSON.parse(docImg);
                  if (Array.isArray(photos)) {
                    return photos.map((photo: string, pi: number) => (
                      <div key={pi} className="relative group cursor-pointer" onClick={() => setZoomImg(normSrc(photo))}>
                        <img src={normSrc(photo)} alt={`Doc ${pi+1}`} className="w-full h-24 object-cover rounded-xl border border-gray-200 shadow-sm hover:scale-[1.02] transition-transform" />
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-medium">Doc Photo #{pi+1}</span>
                        <button onClick={(e) => { e.stopPropagation(); forceDownloadFile(normSrc(photo), `doc-${v.id}-${pi+1}.jpg`); }} className="absolute top-1 right-1 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download size={12} />
                        </button>
                      </div>
                    ));
                  }
                } catch {}
                return (
                  <div className="relative group cursor-pointer" onClick={() => setZoomImg(normSrc(docImg))}>
                    <img src={normSrc(docImg)} alt="Document" className="w-full h-24 object-cover rounded-xl border border-gray-200 shadow-sm hover:scale-[1.02] transition-transform" />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-medium">Document</span>
                    <button onClick={(e) => { e.stopPropagation(); forceDownloadFile(normSrc(docImg), `doc-${v.id}.jpg`); }} className="absolute top-1 right-1 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download size={12} />
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Review Status & Metadata */}
            <div className="pt-2 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                {(v.reviewStatus || v.review_status) === 'approved' && (
                  <span className="text-green-700 font-semibold flex items-center gap-1">✓ Approved by {v.reviewedBy || v.reviewed_by || 'Admin'} • {v.reviewedAt || v.reviewed_at}</span>
                )}
                {(v.reviewStatus || v.review_status) === 'rejected' && (
                  <span className="text-red-700 font-semibold flex items-center gap-1">✗ Rejected by {v.reviewedBy || v.reviewed_by || 'Admin'} • {v.reviewedAt || v.reviewed_at}{(v.rejectionReason || v.rejection_reason) ? ` — ${v.rejectionReason || v.rejection_reason}` : ''}</span>
                )}
                {!(v.reviewStatus || v.review_status) && v.status === 'submitted' && (
                  <span className="text-blue-700 font-medium">⏳ Submitted by client • Awaiting review</span>
                )}
              </div>
              <div className="text-gray-400 text-[11px] flex items-center gap-2">
                {v.ip_address && <span>IP: {v.ip_address}</span>}
                {v.latitude && v.longitude && <span>Loc: {v.latitude}, {v.longitude}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zoom Modal */}
      {zoomImg && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[150] p-4" onClick={() => setZoomImg(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomImg(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1">
              <X size={24} />
            </button>
            <img src={zoomImg} alt="Enlarged document" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

// Custom airport autocomplete that always retains free text
function AirportInput({ value, onChange, placeholder, hasError, filterAirportsFn }: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hasError?: boolean;
  filterAirportsFn: (q: string) => [string, string][];
}) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync if external value changes (edit mode load)
  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  const suggestions = useMemo(() => filterAirportsFn(inputVal), [inputVal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase();
    setInputVal(v);
    onChange(v);
    setOpen(true);
  };

  const handleSelect = (code: string) => {
    setInputVal(code);
    onChange(code);
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className={`relative w-full rounded-lg bg-white border ${hasError ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}>
        <input
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onFocus={() => inputVal.length > 0 && setOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder || 'IATA code or city...'}
          className="w-full border-none py-2.5 pl-3 pr-10 text-sm text-gray-900 focus:ring-0 rounded-lg uppercase bg-transparent focus:outline-none"
        />
        <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-2" onClick={() => setOpen(o => !o)}>
          <ChevronsUpDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute mt-1 max-h-60 min-w-[200px] sm:min-w-[320px] w-max max-w-[90vw] sm:max-w-[480px] overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {suggestions.map((airport) => (
            <li
              key={airport[0]}
              onMouseDown={() => handleSelect(airport[0])}
              className="cursor-pointer select-none py-2 pl-3 pr-4 hover:bg-blue-600 hover:text-white text-gray-900"
            >
              <span className="font-bold mr-2">{airport[0]}</span>
              <span className="text-xs opacity-80">{airport[1]}</span>
            </li>
          ))}
        </ul>
      )}
      {open && inputVal.length > 0 && suggestions.length === 0 && (
        <div className="absolute mt-1 min-w-[160px] sm:min-w-[200px] rounded-md bg-white py-2 px-4 text-sm text-gray-500 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          No airports found — free text accepted
        </div>
      )}
    </div>
  );
}

const CURRENCIES = ['CAD', 'USD', 'AUD'];
const TRIP_TYPES = ['One Way', 'Round Trip', 'Multi City'];
// Priority countries at top, then all others alphabetically
const PRIORITY_COUNTRY_CODES = [
  { code: '+1', flag: '🇨🇦', label: '🇨🇦 +1 (CA)', maxLen: 10, country: 'Canada' },
  { code: '+1', flag: '🇺🇸', label: '🇺🇸 +1 (US)', maxLen: 10, country: 'United States' },
  { code: '+91', flag: '🇮🇳', label: '🇮🇳 +91 (IN)', maxLen: 10, country: 'India' },
  { code: '+61', flag: '🇦🇺', label: '🇦🇺 +61 (AU)', maxLen: 9, country: 'Australia' },
  { code: '+44', flag: '🇬🇧', label: '🇬🇧 +44 (GB)', maxLen: 10, country: 'United Kingdom' },
];

const OTHER_COUNTRY_CODES = [
  { code: '+93', flag: '🇦🇫', label: '🇦🇫 +93 (AF)', maxLen: 9, country: 'Afghanistan' },
  { code: '+355', flag: '🇦🇱', label: '🇦🇱 +355 (AL)', maxLen: 9, country: 'Albania' },
  { code: '+213', flag: '🇩🇿', label: '🇩🇿 +213 (DZ)', maxLen: 9, country: 'Algeria' },
  { code: '+376', flag: '🇦🇩', label: '🇦🇩 +376 (AD)', maxLen: 6, country: 'Andorra' },
  { code: '+244', flag: '🇦🇴', label: '🇦🇴 +244 (AO)', maxLen: 9, country: 'Angola' },
  { code: '+54', flag: '🇦🇷', label: '🇦🇷 +54 (AR)', maxLen: 10, country: 'Argentina' },
  { code: '+374', flag: '🇦🇲', label: '🇦🇲 +374 (AM)', maxLen: 8, country: 'Armenia' },
  { code: '+297', flag: '🇦🇼', label: '🇦🇼 +297 (AW)', maxLen: 7, country: 'Aruba' },
  { code: '+43', flag: '🇦🇹', label: '🇦🇹 +43 (AT)', maxLen: 10, country: 'Austria' },
  { code: '+994', flag: '🇦🇿', label: '🇦🇿 +994 (AZ)', maxLen: 9 },
  { code: '+973', flag: '🇧🇭', label: '🇧🇭 +973 (BH)', maxLen: 8 },
  { code: '+880', flag: '🇧🇩', label: '🇧🇩 +880 (BD)', maxLen: 10 },
  { code: '+375', flag: '🇧🇾', label: '🇧🇾 +375 (BY)', maxLen: 10 },
  { code: '+32', flag: '🇧🇪', label: '🇧🇪 +32 (BE)', maxLen: 9 },
  { code: '+501', flag: '🇧🇿', label: '🇧🇿 +501 (BZ)', maxLen: 7 },
  { code: '+229', flag: '🇧🇯', label: '🇧🇯 +229 (BJ)', maxLen: 8 },
  { code: '+975', flag: '🇧🇹', label: '🇧🇹 +975 (BT)', maxLen: 8 },
  { code: '+591', flag: '🇧🇴', label: '🇧🇴 +591 (BO)', maxLen: 8 },
  { code: '+387', flag: '🇧🇦', label: '🇧🇦 +387 (BA)', maxLen: 8 },
  { code: '+267', flag: '🇧🇼', label: '🇧🇼 +267 (BW)', maxLen: 7 },
  { code: '+55', flag: '🇧🇷', label: '🇧🇷 +55 (BR)', maxLen: 11 },
  { code: '+673', flag: '🇧🇳', label: '🇧🇳 +673 (BN)', maxLen: 7 },
  { code: '+359', flag: '🇧🇬', label: '🇧🇬 +359 (BG)', maxLen: 9 },
  { code: '+226', flag: '🇧🇫', label: '🇧🇫 +226 (BF)', maxLen: 8 },
  { code: '+95', flag: '🇲🇲', label: '🇲🇲 +95 (MM)', maxLen: 10 },
  { code: '+257', flag: '🇧🇮', label: '🇧🇮 +257 (BI)', maxLen: 8 },
  { code: '+855', flag: '🇰🇭', label: '🇰🇭 +855 (KH)', maxLen: 9 },
  { code: '+237', flag: '🇨🇲', label: '🇨🇲 +237 (CM)', maxLen: 9 },
  { code: '+1', flag: '🇨🇦', label: '🇨🇦 +1 (CA)', maxLen: 10 },
  { code: '+238', flag: '🇨🇻', label: '🇨🇻 +238 (CV)', maxLen: 7 },
  { code: '+236', flag: '🇨🇫', label: '🇨🇫 +236 (CF)', maxLen: 8 },
  { code: '+235', flag: '🇹🇩', label: '🇹🇩 +235 (TD)', maxLen: 8 },
  { code: '+56', flag: '🇨🇱', label: '🇨🇱 +56 (CL)', maxLen: 9 },
  { code: '+86', flag: '🇨🇳', label: '🇨🇳 +86 (CN)', maxLen: 11 },
  { code: '+57', flag: '🇨🇴', label: '🇨🇴 +57 (CO)', maxLen: 10 },
  { code: '+269', flag: '🇰🇲', label: '🇰🇲 +269 (KM)', maxLen: 7 },
  { code: '+242', flag: '🇨🇬', label: '🇨🇬 +242 (CG)', maxLen: 9 },
  { code: '+243', flag: '🇨🇩', label: '🇨🇩 +243 (CD)', maxLen: 9 },
  { code: '+506', flag: '🇨🇷', label: '🇨🇷 +506 (CR)', maxLen: 8 },
  { code: '+385', flag: '🇭🇷', label: '🇭🇷 +385 (HR)', maxLen: 9 },
  { code: '+53', flag: '🇨🇺', label: '🇨🇺 +53 (CU)', maxLen: 8 },
  { code: '+357', flag: '🇨🇾', label: '🇨🇾 +357 (CY)', maxLen: 8 },
  { code: '+420', flag: '🇨🇿', label: '🇨🇿 +420 (CZ)', maxLen: 9 },
  { code: '+45', flag: '🇩🇰', label: '🇩🇰 +45 (DK)', maxLen: 8 },
  { code: '+253', flag: '🇩🇯', label: '🇩🇯 +253 (DJ)', maxLen: 8 },
  { code: '+593', flag: '🇪🇨', label: '🇪🇨 +593 (EC)', maxLen: 9 },
  { code: '+20', flag: '🇪🇬', label: '🇪🇬 +20 (EG)', maxLen: 10 },
  { code: '+503', flag: '🇸🇻', label: '🇸🇻 +503 (SV)', maxLen: 8 },
  { code: '+240', flag: '🇬🇶', label: '🇬🇶 +240 (GQ)', maxLen: 9 },
  { code: '+291', flag: '🇪🇷', label: '🇪🇷 +291 (ER)', maxLen: 7 },
  { code: '+372', flag: '🇪🇪', label: '🇪🇪 +372 (EE)', maxLen: 8 },
  { code: '+251', flag: '🇪🇹', label: '🇪🇹 +251 (ET)', maxLen: 9 },
  { code: '+679', flag: '🇫🇯', label: '🇫🇯 +679 (FJ)', maxLen: 7 },
  { code: '+358', flag: '🇫🇮', label: '🇫🇮 +358 (FI)', maxLen: 10 },
  { code: '+33', flag: '🇫🇷', label: '🇫🇷 +33 (FR)', maxLen: 9 },
  { code: '+241', flag: '🇬🇦', label: '🇬🇦 +241 (GA)', maxLen: 7 },
  { code: '+220', flag: '🇬🇲', label: '🇬🇲 +220 (GM)', maxLen: 7 },
  { code: '+995', flag: '🇬🇪', label: '🇬🇪 +995 (GE)', maxLen: 9 },
  { code: '+49', flag: '🇩🇪', label: '🇩🇪 +49 (DE)', maxLen: 11 },
  { code: '+233', flag: '🇬🇭', label: '🇬🇭 +233 (GH)', maxLen: 9 },
  { code: '+30', flag: '🇬🇷', label: '🇬🇷 +30 (GR)', maxLen: 10 },
  { code: '+502', flag: '🇬🇹', label: '🇬🇹 +502 (GT)', maxLen: 8 },
  { code: '+224', flag: '🇬🇳', label: '🇬🇳 +224 (GN)', maxLen: 9 },
  { code: '+245', flag: '🇬🇼', label: '🇬🇼 +245 (GW)', maxLen: 9 },
  { code: '+592', flag: '🇬🇾', label: '🇬🇾 +592 (GY)', maxLen: 7 },
  { code: '+509', flag: '🇭🇹', label: '🇭🇹 +509 (HT)', maxLen: 8 },
  { code: '+504', flag: '🇭🇳', label: '🇭🇳 +504 (HN)', maxLen: 8 },
  { code: '+852', flag: '🇭🇰', label: '🇭🇰 +852 (HK)', maxLen: 8 },
  { code: '+36', flag: '🇭🇺', label: '🇭🇺 +36 (HU)', maxLen: 9 },
  { code: '+354', flag: '🇮🇸', label: '🇮🇸 +354 (IS)', maxLen: 7 },
  { code: '+91', flag: '🇮🇳', label: '🇮🇳 +91 (IN)', maxLen: 10 },
  { code: '+62', flag: '🇮🇩', label: '🇮🇩 +62 (ID)', maxLen: 11 },
  { code: '+98', flag: '🇮🇷', label: '🇮🇷 +98 (IR)', maxLen: 10 },
  { code: '+964', flag: '🇮🇶', label: '🇮🇶 +964 (IQ)', maxLen: 10 },
  { code: '+353', flag: '🇮🇪', label: '🇮🇪 +353 (IE)', maxLen: 9 },
  { code: '+972', flag: '🇮🇱', label: '🇮🇱 +972 (IL)', maxLen: 9 },
  { code: '+39', flag: '🇮🇹', label: '🇮🇹 +39 (IT)', maxLen: 10 },
  { code: '+225', flag: '🇨🇮', label: '🇨🇮 +225 (CI)', maxLen: 10 },
  { code: '+81', flag: '🇯🇵', label: '🇯🇵 +81 (JP)', maxLen: 10 },
  { code: '+962', flag: '🇯🇴', label: '🇯🇴 +962 (JO)', maxLen: 9 },
  { code: '+7', flag: '🇰🇿', label: '🇰🇿 +7 (KZ)', maxLen: 10 },
  { code: '+254', flag: '🇰🇪', label: '🇰🇪 +254 (KE)', maxLen: 10 },
  { code: '+965', flag: '🇰🇼', label: '🇰🇼 +965 (KW)', maxLen: 8 },
  { code: '+996', flag: '🇰🇬', label: '🇰🇬 +996 (KG)', maxLen: 9 },
  { code: '+856', flag: '🇱🇦', label: '🇱🇦 +856 (LA)', maxLen: 10 },
  { code: '+371', flag: '🇱🇻', label: '🇱🇻 +371 (LV)', maxLen: 8 },
  { code: '+961', flag: '🇱🇧', label: '🇱🇧 +961 (LB)', maxLen: 8 },
  { code: '+266', flag: '🇱🇸', label: '🇱🇸 +266 (LS)', maxLen: 8 },
  { code: '+231', flag: '🇱🇷', label: '🇱🇷 +231 (LR)', maxLen: 9 },
  { code: '+218', flag: '🇱🇾', label: '🇱🇾 +218 (LY)', maxLen: 10 },
  { code: '+423', flag: '🇱🇮', label: '🇱🇮 +423 (LI)', maxLen: 7 },
  { code: '+370', flag: '🇱🇹', label: '🇱🇹 +370 (LT)', maxLen: 8 },
  { code: '+352', flag: '🇱🇺', label: '🇱🇺 +352 (LU)', maxLen: 9 },
  { code: '+853', flag: '🇲🇴', label: '🇲🇴 +853 (MO)', maxLen: 8 },
  { code: '+389', flag: '🇲🇰', label: '🇲🇰 +389 (MK)', maxLen: 8 },
  { code: '+261', flag: '🇲🇬', label: '🇲🇬 +261 (MG)', maxLen: 10 },
  { code: '+265', flag: '🇲🇼', label: '🇲🇼 +265 (MW)', maxLen: 9 },
  { code: '+60', flag: '🇲🇾', label: '🇲🇾 +60 (MY)', maxLen: 10 },
  { code: '+960', flag: '🇲🇻', label: '🇲🇻 +960 (MV)', maxLen: 7 },
  { code: '+223', flag: '🇲🇱', label: '🇲🇱 +223 (ML)', maxLen: 8 },
  { code: '+356', flag: '🇲🇹', label: '🇲🇹 +356 (MT)', maxLen: 8 },
  { code: '+222', flag: '🇲🇷', label: '🇲🇷 +222 (MR)', maxLen: 8 },
  { code: '+230', flag: '🇲🇺', label: '🇲🇺 +230 (MU)', maxLen: 8 },
  { code: '+52', flag: '🇲🇽', label: '🇲🇽 +52 (MX)', maxLen: 10 },
  { code: '+373', flag: '🇲🇩', label: '🇲🇩 +373 (MD)', maxLen: 8 },
  { code: '+377', flag: '🇲🇨', label: '🇲🇨 +377 (MC)', maxLen: 8 },
  { code: '+976', flag: '🇲🇳', label: '🇲🇳 +976 (MN)', maxLen: 8 },
  { code: '+382', flag: '🇲🇪', label: '🇲🇪 +382 (ME)', maxLen: 8 },
  { code: '+212', flag: '🇲🇦', label: '🇲🇦 +212 (MA)', maxLen: 9 },
  { code: '+258', flag: '🇲🇿', label: '🇲🇿 +258 (MZ)', maxLen: 9 },
  { code: '+264', flag: '🇳🇦', label: '🇳🇦 +264 (NA)', maxLen: 10 },
  { code: '+977', flag: '🇳🇵', label: '🇳🇵 +977 (NP)', maxLen: 10 },
  { code: '+31', flag: '🇳🇱', label: '🇳🇱 +31 (NL)', maxLen: 9 },
  { code: '+64', flag: '🇳🇿', label: '🇳🇿 +64 (NZ)', maxLen: 9 },
  { code: '+505', flag: '🇳🇮', label: '🇳🇮 +505 (NI)', maxLen: 8 },
  { code: '+227', flag: '🇳🇪', label: '🇳🇪 +227 (NE)', maxLen: 8 },
  { code: '+234', flag: '🇳🇬', label: '🇳🇬 +234 (NG)', maxLen: 10 },
  { code: '+850', flag: '🇰🇵', label: '🇰🇵 +850 (KP)', maxLen: 10 },
  { code: '+47', flag: '🇳🇴', label: '🇳🇴 +47 (NO)', maxLen: 8 },
  { code: '+968', flag: '🇴🇲', label: '🇴🇲 +968 (OM)', maxLen: 8 },
  { code: '+92', flag: '🇵🇰', label: '🇵🇰 +92 (PK)', maxLen: 10 },
  { code: '+970', flag: '🇵🇸', label: '🇵🇸 +970 (PS)', maxLen: 9 },
  { code: '+507', flag: '🇵🇦', label: '🇵🇦 +507 (PA)', maxLen: 8 },
  { code: '+675', flag: '🇵🇬', label: '🇵🇬 +675 (PG)', maxLen: 8 },
  { code: '+595', flag: '🇵🇾', label: '🇵🇾 +595 (PY)', maxLen: 9 },
  { code: '+51', flag: '🇵🇪', label: '🇵🇪 +51 (PE)', maxLen: 9 },
  { code: '+63', flag: '🇵🇭', label: '🇵🇭 +63 (PH)', maxLen: 10 },
  { code: '+48', flag: '🇵🇱', label: '🇵🇱 +48 (PL)', maxLen: 9 },
  { code: '+351', flag: '🇵🇹', label: '🇵🇹 +351 (PT)', maxLen: 9 },
  { code: '+974', flag: '🇶🇦', label: '🇶🇦 +974 (QA)', maxLen: 8 },
  { code: '+40', flag: '🇷🇴', label: '🇷🇴 +40 (RO)', maxLen: 9 },
  { code: '+7', flag: '🇷🇺', label: '🇷🇺 +7 (RU)', maxLen: 10 },
  { code: '+250', flag: '🇷🇼', label: '🇷🇼 +250 (RW)', maxLen: 9 },
  { code: '+966', flag: '🇸🇦', label: '🇸🇦 +966 (SA)', maxLen: 9 },
  { code: '+221', flag: '🇸🇳', label: '🇸🇳 +221 (SN)', maxLen: 9 },
  { code: '+381', flag: '🇷🇸', label: '🇷🇸 +381 (RS)', maxLen: 9 },
  { code: '+248', flag: '🇸🇨', label: '🇸🇨 +248 (SC)', maxLen: 7 },
  { code: '+232', flag: '🇸🇱', label: '🇸🇱 +232 (SL)', maxLen: 8 },
  { code: '+65', flag: '🇸🇬', label: '🇸🇬 +65 (SG)', maxLen: 8 },
  { code: '+421', flag: '🇸🇰', label: '🇸🇰 +421 (SK)', maxLen: 9 },
  { code: '+386', flag: '🇸🇮', label: '🇸🇮 +386 (SI)', maxLen: 8 },
  { code: '+252', flag: '🇸🇴', label: '🇸🇴 +252 (SO)', maxLen: 8 },
  { code: '+27', flag: '🇿🇦', label: '🇿🇦 +27 (ZA)', maxLen: 9 },
  { code: '+82', flag: '🇰🇷', label: '🇰🇷 +82 (KR)', maxLen: 10 },
  { code: '+211', flag: '🇸🇸', label: '🇸🇸 +211 (SS)', maxLen: 9 },
  { code: '+34', flag: '🇪🇸', label: '🇪🇸 +34 (ES)', maxLen: 9 },
  { code: '+94', flag: '🇱🇰', label: '🇱🇰 +94 (LK)', maxLen: 9 },
  { code: '+249', flag: '🇸🇩', label: '🇸🇩 +249 (SD)', maxLen: 9 },
  { code: '+597', flag: '🇸🇷', label: '🇸🇷 +597 (SR)', maxLen: 7 },
  { code: '+268', flag: '🇸🇿', label: '🇸🇿 +268 (SZ)', maxLen: 8 },
  { code: '+46', flag: '🇸🇪', label: '🇸🇪 +46 (SE)', maxLen: 10 },
  { code: '+41', flag: '🇨🇭', label: '🇨🇭 +41 (CH)', maxLen: 9 },
  { code: '+963', flag: '🇸🇾', label: '🇸🇾 +963 (SY)', maxLen: 9 },
  { code: '+886', flag: '🇹🇼', label: '🇹🇼 +886 (TW)', maxLen: 9 },
  { code: '+992', flag: '🇹🇯', label: '🇹🇯 +992 (TJ)', maxLen: 9 },
  { code: '+255', flag: '🇹🇿', label: '🇹🇿 +255 (TZ)', maxLen: 9 },
  { code: '+66', flag: '🇹🇭', label: '🇹🇭 +66 (TH)', maxLen: 9 },
  { code: '+670', flag: '🇹🇱', label: '🇹🇱 +670 (TL)', maxLen: 8 },
  { code: '+228', flag: '🇹🇬', label: '🇹🇬 +228 (TG)', maxLen: 8 },
  { code: '+676', flag: '🇹🇴', label: '🇹🇴 +676 (TO)', maxLen: 7 },
  { code: '+216', flag: '🇹🇳', label: '🇹🇳 +216 (TN)', maxLen: 8 },
  { code: '+90', flag: '🇹🇷', label: '🇹🇷 +90 (TR)', maxLen: 10 },
  { code: '+993', flag: '🇹🇲', label: '🇹🇲 +993 (TM)', maxLen: 8 },
  { code: '+256', flag: '🇺🇬', label: '🇺🇬 +256 (UG)', maxLen: 9 },
  { code: '+380', flag: '🇺🇦', label: '🇺🇦 +380 (UA)', maxLen: 9 },
  { code: '+971', flag: '🇦🇪', label: '🇦🇪 +971 (AE)', maxLen: 9 },
  { code: '+44', flag: '🇬🇧', label: '🇬🇧 +44 (GB)', maxLen: 10 },
  { code: '+1', flag: '🇺🇸', label: '🇺🇸 +1 (US)', maxLen: 10 },
  { code: '+598', flag: '🇺🇾', label: '🇺🇾 +598 (UY)', maxLen: 8 },
  { code: '+998', flag: '🇺🇿', label: '🇺🇿 +998 (UZ)', maxLen: 9 },
  { code: '+678', flag: '🇻🇺', label: '🇻🇺 +678 (VU)', maxLen: 7 },
  { code: '+58', flag: '🇻🇪', label: '🇻🇪 +58 (VE)', maxLen: 10 },
  { code: '+84', flag: '🇻🇳', label: '🇻🇳 +84 (VN)', maxLen: 10 },
  { code: '+967', flag: '🇾🇪', label: '🇾🇪 +967 (YE)', maxLen: 9 },
  { code: '+260', flag: '🇿🇲', label: '🇿🇲 +260 (ZM)', maxLen: 9 },
  { code: '+263', flag: '🇿🇼', label: '🇿🇼 +263 (ZW)', maxLen: 9 },
];

// Remove duplicate entries from OTHER that already exist in PRIORITY
const COUNTRY_CODES = [
  ...PRIORITY_COUNTRY_CODES,
  ...OTHER_COUNTRY_CODES.filter(o => !PRIORITY_COUNTRY_CODES.some(p => p.label === o.label)),
];

const getPhoneMaxLen = (code: string): number => {
  const found = COUNTRY_CODES.find(c => c.code === code);
  return found?.maxLen ?? 10;
};

// Agent-restricted statuses (only visible to Supervisor/Manager/Admin/HR)
const RESTRICTED_STATUSES = ['Sold', 'Date Change', 'Variance', 'Cancellation', 'Post Sale', 'Schedule Change'];

// Country code search state for phone field
function CountryCodeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-gray-50 border-r border-gray-200 px-2 py-2.5 text-xs font-medium text-gray-700 focus:outline-none min-w-[110px] max-w-[120px] h-full hover:bg-gray-100 transition-colors cursor-pointer"
    >
      <optgroup label="Frequently Used">
        {PRIORITY_COUNTRY_CODES.map((c, i) => (
          <option key={`priority-${c.code}-${i}`} value={c.code}>
            {c.flag} {c.code} {c.country ? `(${c.country})` : ''}
          </option>
        ))}
      </optgroup>
      <optgroup label="All Countries">
        {OTHER_COUNTRY_CODES.map((c, i) => (
          <option key={`other-${c.code}-${i}`} value={c.code}>
            {c.flag} {c.code} {c.country ? `(${c.country})` : ''}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

export default function AddBooking() {
  const { bookings, addBooking, updateBooking, fetchData } = useCrmStore();
  const { currentUser, addNotification, activeCompany } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editId = id ? Number(id) : null;
  const isEdit = !!editId;
  
  // Smart back navigation: go back in history if possible, otherwise fallback to /bookings
  const goBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/bookings');
    }
  };

  const imageFileRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    addedBy: currentUser?.name || 'Admin',
    firstName: '', lastName: '', email: '', phone: '', countryCode: '+1',
    origin: '', destination: '', departureDate: '', returnDate: '',
    cabin: 'Economy' as any, adults: '' as any, children: '' as any, infants: '' as any,
    queryStatus: '', querySource: '', remarks: '', partialPayment: 'No' as any,
    tripType: 'One Way', currency: 'CAD', company: '', callbackDate: '', callbackTime: ''
  });

  const [remarksList, setRemarksList] = useState<RemarkEntry[]>([]);
  const [newRemark, setNewRemark] = useState('');
  const [pnrDetails, setPnrDetails] = useState<PnrDetail[]>([{ pnr: '', firstName: '', lastName: '', airline: '', supplier: '', paymentMethod: '', cost: '' as any, sell: '' as any, fee: '' as any, mco: '' as any, gpm: '' as any }]);
  const [images, setImages] = useState<AttachmentDoc[]>([]);
  const [activePreviewDoc, setActivePreviewDoc] = useState<AttachmentDoc | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  // (queryOrigin/Destination now managed inside AirportInput component)

  // Fetch data on mount for reliability
  useEffect(() => { fetchData(); }, []);

  // If edit mode, load booking data
  const [hasLoadedData, setHasLoadedData] = useState(false);

  useEffect(() => {
    setHasLoadedData(false);
  }, [id]);
  useEffect(() => {
    if (editId && bookings.length > 0 && !hasLoadedData) {
      const b = bookings.find(bk => bk.id === editId || String(bk.id) === String(id) || bk.queryId === id);
      if (b) {
        setOriginalQueryStatus(b.queryStatus || '');
        setForm({
          addedBy: b.addedBy,
          firstName: b.firstName,
          lastName: b.lastName,
          email: b.email,
          phone: b.phone?.includes('-') ? b.phone.split('-')[1] : b.phone || '',
          countryCode: b.phone?.includes('-') ? b.phone.split('-')[0] : '+1',
          origin: b.origin,
          destination: b.destination,
          departureDate: b.departureDate,
          returnDate: b.returnDate,
          cabin: b.cabin,
          adults: b.adults || '',
          children: b.children || '',
          infants: b.infants || '',
          queryStatus: b.queryStatus,
          querySource: b.querySource,
          remarks: '',
          partialPayment: b.partialPayment,
          partialPaymentDueDate: (b as any).partialPaymentDueDate || '',
          partialPaymentAmount: (b as any).partialPaymentAmount || '',
          receivedAmount: (b as any).receivedAmount || '',
          callbackDate: (b as any).callbackDate || '',
          callbackTime: (b as any).callbackTime || '',
          tripType: b.tripType || 'One Way',
          currency: b.currency || 'CAD',
          company: b.company || ''
        });

        try {
          const parsed = JSON.parse(b.remarks);
          setRemarksList(Array.isArray(parsed) ? parsed : b.remarks ? [{ text: b.remarks, addedBy: b.addedBy, date: b.created }] : []);
        } catch {
          setRemarksList(b.remarks ? [{ text: b.remarks, addedBy: b.addedBy, date: b.created }] : []);
        }

        const existingPnrs = safeParsePnrDetails(b);
        if (existingPnrs.length > 0) {
          setPnrDetails(existingPnrs.map((p: any) => ({
            pnr: p.pnr || '',
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            airline: p.airline || '',
            supplier: p.supplier || '',
            paymentMethod: p.paymentMethod || '',
            cost: p.cost ?? '',
            sell: p.sell ?? '',
            fee: p.fee ?? '',
            mco: p.mco ?? '',
            gpm: p.gpm ?? ''
          })));
        } else {
          setPnrDetails([{
            pnr: b.pnr || '',
            firstName: b.firstName || '',
            lastName: b.lastName || '',
            airline: '',
            supplier: '',
            paymentMethod: '',
            cost: '' as any,
            sell: '' as any,
            fee: '' as any,
            mco: '' as any,
            gpm: '' as any
          }]);
        }
        setImages(parseAttachmentDocs(b.images));
        setHasLoadedData(true);
      }
    }
  }, [editId, bookings, hasLoadedData]);

  // Resolve image URLs when images change
  useEffect(() => {
    const resolveUrls = async () => {
      const newResolved: Record<string, string> = {};
      for (const img of images) {
        if (img.startsWith('http')) {
          newResolved[img] = img;
        } else if (!resolvedImages[img]) {
          const url = await getImageUrl(img);
          if (url) newResolved[img] = url;
        } else {
          newResolved[img] = resolvedImages[img];
        }
      }
      setResolvedImages(prev => ({ ...prev, ...newResolved }));
    };
    if (images.length > 0) resolveUrls();
  }, [images]);

  const filterAirports = (query: string) => {
    if (!query) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const getCityName = (name: string) => name.split(/[\s-,]/)[0].toLowerCase();
    const exactCode: typeof AIRPORTS = [];
    const startsWithCode: typeof AIRPORTS = [];
    const startsWithCity: typeof AIRPORTS = [];
    const containsMatch: typeof AIRPORTS = [];
    for (const airport of AIRPORTS) {
      const code = airport[0].toLowerCase();
      const name = airport[1].toLowerCase();
      const city = getCityName(airport[1]);
      if (code === q) exactCode.push(airport);
      else if (code.startsWith(q)) startsWithCode.push(airport);
      else if (city.startsWith(q) || name.startsWith(q)) startsWithCity.push(airport);
      else if (name.includes(q) || code.includes(q)) containsMatch.push(airport);
    }
    return [...exactCode, ...startsWithCode, ...startsWithCity, ...containsMatch].slice(0, 15);
  };

  // (filtered airports computed inside AirportInput component)
  const handlePnrDetailChange = (index: number, field: keyof PnrDetail, value: any) => {
    const newDetails = [...pnrDetails];
    const updatedDetail = { ...newDetails[index], [field]: value };
    if (['sell', 'cost', 'fee', 'mco'].includes(field as string)) {
      const sell = field === 'sell' ? Number(value) : Number(updatedDetail.sell || 0);
      const cost = field === 'cost' ? Number(value) : Number(updatedDetail.cost || 0);
      const fee = field === 'fee' ? Number(value) : Number(updatedDetail.fee || 0);
      const mco = field === 'mco' ? Number(value) : Number(updatedDetail.mco || 0);
      updatedDetail.gpm = parseFloat((sell - cost - fee - mco).toFixed(2));
    }
    // If manually editing GPM directly, just use the value as-is (no recalculate)
    newDetails[index] = updatedDetail;
    setPnrDetails(newDetails);
  };

  const addPnrRow = () => {
    setPnrDetails([...pnrDetails, { pnr: '', firstName: '', lastName: '', airline: '', supplier: '', paymentMethod: '', cost: '' as any, sell: '' as any, fee: '' as any, mco: '' as any, gpm: '' as any }]);
  };

  const removePnrRow = (index: number) => {
    const newDetails = pnrDetails.filter((_, i) => i !== index);
    setPnrDetails(newDetails.length ? newDetails : [{ pnr: '', firstName: '', lastName: '', airline: '', supplier: '', paymentMethod: '', cost: '' as any, sell: '' as any, fee: '' as any, mco: '' as any, gpm: '' as any }]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const addedDocs: AttachmentDoc[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const doc = await processUploadedFile(file);
        addedDocs.push(doc);
      }
      setImages(prev => [...prev, ...addedDocs]);
    } catch (err) {
      console.error('File upload failed', err);
      alert('Failed to process file. Please try again.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const addRemark = () => {
    if (!newRemark.trim()) return;
    const entry: RemarkEntry = { text: newRemark.trim(), addedBy: currentUser?.name || 'Admin', date: new Date().toLocaleString() };
    setRemarksList([...remarksList, entry]);
    setNewRemark('');
  };

  const sendEmailForBooking = async (bookingData: any) => {
    if (!bookingData?.email) {
      addNotification({ title: 'No Email', message: 'This booking has no email address', type: 'info' });
      return;
    }
    setSendingEmail(true);
    try {
      const res = await client.api.fetch('/api/public/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: bookingData.email, bookingData, company: activeCompany || 'GSF' })
      });
      const result = await res.json();
      if (result.success) {
        addNotification({ title: '✅ Email Sent', message: `Email sent to ${bookingData.email}`, type: 'success' });
      } else {
        addNotification({ title: 'Email Failed', message: result.error || result.message || 'Failed to send email', type: 'info' });
      }
    } catch (err: any) {
      addNotification({ title: 'Email Error', message: err?.message || 'Could not send email', type: 'info' });
    } finally {
      setSendingEmail(false);
    }
  };

  const currentStatus = form.queryStatus?.trim() || '';
  const showPnrSection = true; // Always allow PNR details for all queries
  const showImageSection = true; // Always allow attaching images and documents for all query types

  const isAgent = ['Agent', 'Travel Consultant', 'Senior Travel Consultant', 'Travel Executive', 'Sr. Travel Executive'].includes(currentUser?.role || '');
  const isSupervisorOrAbove = ['Supervisor', 'Manager', 'Admin', 'Operation Manager'].includes(currentUser?.role || '');
  // originalQueryStatus = the SAVED status from db (what it was when page loaded)
  const [originalQueryStatus, setOriginalQueryStatus] = useState<string>('');
  
  // isLockedForAgent: locks editing if the booking was ALREADY saved as 'Send to QC' or 'Sold' etc.
  // Agent can still CHANGE status TO 'Send to QC' and save - only locked AFTER saved
  // QC Rejected bookings (status changed back to 'Follow Up') are NOT locked — agent can re-edit and resend
  const isLockedForAgent = isAgent && ['Send to QC', 'Sold', 'Date Change', 'Schedule Change', 'Variance'].includes(originalQueryStatus) && originalQueryStatus !== 'Follow Up';
  const canEdit = !isLockedForAgent;

  const handleSave = async () => {
    // Prevent duplicate submissions
    if (isSaving) return;
    
    const errors: Record<string, boolean> = {};
    if (!form.firstName) errors.firstName = true;
    // lastName is NOT mandatory
    if (!form.email) errors.email = true;
    if (!form.phone) errors.phone = true;
    if (!form.origin) errors.origin = true;
    if (!form.destination) errors.destination = true;
    if (!form.departureDate) errors.departureDate = true;
    if (!form.queryStatus) errors.queryStatus = true;
    if (form.queryStatus === 'Call Back' && !(form as any).callbackDate) errors.callbackDate = true;
    if (!form.querySource) errors.querySource = true;
    if (!form.cabin) errors.cabin = true;
    if (remarksList.length === 0 && !newRemark.trim()) errors.remarks = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstErrorField = document.querySelector('.field-error');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFormErrors({});
    setIsSaving(true);

    let finalRemarks = [...remarksList];
    if (newRemark.trim()) {
      finalRemarks.push({ text: newRemark.trim(), addedBy: currentUser?.name || 'Admin', date: new Date().toLocaleString() });
    }

    const validPnrs = pnrDetails.filter(p => p.pnr && p.pnr.trim() !== '');
    const pnrRegex = /^[A-Z0-9]{4,8}$/i;
    const needsPnr = ['Date Change', 'Schedule Change', 'Send to QC', 'Cancellation', 'Sold', 'Hold', 'Variance', 'Post Sale', 'Closed Query'].some(s => currentStatus.includes(s));
    const needsImage = false; // Images are optional - user can upload for any status

    if (needsPnr && validPnrs.length > 0) {
      for (const p of validPnrs) {
        if (p.pnr && !pnrRegex.test(p.pnr.trim())) {
          alert(`Invalid PNR: ${p.pnr}. Must be 4-8 uppercase alphanumeric characters.`);
          setIsSaving(false);
          return;
        }
      }
    }
    // Images are optional for all statuses - no blocking validation

    const bookingData = {
      addedBy: form.addedBy,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: `${form.countryCode}-${form.phone}`,
      origin: form.origin,
      destination: form.destination,
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      cabin: form.cabin,
      adults: Number(form.adults) || 0,
      children: Number(form.children) || 0,
      infants: Number(form.infants) || 0,
      queryStatus: form.queryStatus,
      querySource: form.querySource,
      partialPayment: form.partialPayment,
      partialPaymentDueDate: form.partialPayment === 'Yes' ? (form as any).partialPaymentDueDate || '' : '',
      partialPaymentAmount: form.partialPayment === 'Yes' ? (form as any).partialPaymentAmount || '' : '',
      receivedAmount: form.partialPayment === 'Yes' ? (form as any).receivedAmount || '' : '',
      partialPaymentCleared: false,
      callbackDate: form.queryStatus === 'Call Back' ? (form as any).callbackDate || '' : '',
      callbackTime: form.queryStatus === 'Call Back' ? (form as any).callbackTime || '' : '',
      callbackRemark: form.queryStatus === 'Call Back' ? (finalRemarks.length > 0 ? finalRemarks[finalRemarks.length - 1].text : '') : '',
      tripType: form.tripType,
      currency: form.currency,
      remarks: JSON.stringify(finalRemarks),
      pnr: validPnrs.map(p => p.pnr.trim()).join(','),
      pnrDetails: JSON.stringify(pnrDetails.map(p => ({
        ...p,
        pnr: p.pnr ? p.pnr.trim().toUpperCase() : '',
        cost: Number(p.cost) || 0,
        sell: Number(p.sell) || 0,
        fee: Number(p.fee) || 0,
        mco: Number(p.mco) || 0,
        gpm: parseFloat((Number(p.gpm) || 0).toFixed(2))
      }))),
      pnr_details: JSON.stringify(pnrDetails.map(p => ({
        ...p,
        pnr: p.pnr ? p.pnr.trim().toUpperCase() : '',
        cost: Number(p.cost) || 0,
        sell: Number(p.sell) || 0,
        fee: Number(p.fee) || 0,
        mco: Number(p.mco) || 0,
        gpm: parseFloat((Number(p.gpm) || 0).toFixed(2))
      }))),
      images: serializeAttachmentDocs(images),
      company: form.company || (() => {
        if (activeCompany === 'LBT') return 'Look Book Ticket';
        if (activeCompany === 'travelo') return 'Traveloboom';
        return 'Get Set Flight';
      })()
    };

    try {
      if (editId) {
        // Track modification history for edits
        const existingBooking = bookings.find(b => b.id === editId);
        if (existingBooking) {
          let modHistory: any[] = [];
          try { modHistory = JSON.parse((existingBooking as any).modificationHistory || '[]'); } catch {}
          const changes: string[] = [];
          if (existingBooking.queryStatus !== form.queryStatus) changes.push(`Status: ${existingBooking.queryStatus} → ${form.queryStatus}`);
          if (existingBooking.firstName !== form.firstName) changes.push(`Name: ${existingBooking.firstName} → ${form.firstName}`);
          if ((existingBooking as any).receivedAmount !== (form as any).receivedAmount) changes.push(`Received Amount: ${(existingBooking as any).receivedAmount || '0'} → ${(form as any).receivedAmount || '0'}`);
          if ((existingBooking as any).partialPaymentAmount !== (form as any).partialPaymentAmount) changes.push(`Total Amount: ${(existingBooking as any).partialPaymentAmount || '0'} → ${(form as any).partialPaymentAmount || '0'}`);
          if (changes.length > 0) {
            modHistory.push({
              action: 'Booking Modified',
              modifiedBy: currentUser?.name || 'Unknown',
              modifiedAt: new Date().toLocaleString('en-IN'),
              oldStatus: existingBooking.queryStatus,
              newStatus: form.queryStatus,
              changes,
              note: changes.join('; ')
            });
            (bookingData as any).modificationHistory = JSON.stringify(modHistory);
          }
        }
        await updateBooking(editId, bookingData);
      } else {
        await addBooking(bookingData);
      }
      
      if (form.queryStatus === 'Send to QC') {
        addNotification({ title: 'Sent to QC', message: `Booking for ${form.firstName} ${form.lastName} sent to QC successfully`, type: 'info' });
      } else {
        addNotification({ title: isEdit ? 'Booking Updated' : 'Booking Created', message: `Booking for ${form.firstName} ${form.lastName} ${isEdit ? 'updated' : 'created'} successfully`, type: 'success' });
      }

      // Auto-send email on status change: ONLY for Hold and Sold as requested
      const autoEmailStatuses = ['Hold', 'Sold'];
      if (autoEmailStatuses.includes(form.queryStatus) && form.email) {
        try {
          await client.api.fetch('/api/public/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              to: form.email, 
              bookingData: { ...form, phone: `${form.countryCode}-${form.phone}` }, 
              status: form.queryStatus,
              company: activeCompany || form.company || 'Get Set Flight' 
            })
          });
          addNotification({ 
            title: '📧 Ticket Email Sent', 
            message: form.queryStatus === 'Sold' 
              ? `Ticket confirmed email sent to ${form.email}` 
              : `Hold notification email sent to ${form.email}`, 
            type: 'success' 
          });
        } catch {
          // Silent fail for auto-email
        }
      }

      // Auto-send payment reminder email if partial payment with due date
      if (form.partialPayment === 'Yes' && (form as any).partialPaymentDueDate && form.email) {
        try {
          await client.api.fetch('/api/public/send-payment-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: form.email,
              bookingData: { ...form, phone: `${form.countryCode}-${form.phone}`, dueDate: (form as any).partialPaymentDueDate, outstandingAmount: (form as any).partialPaymentAmount || 'Pending' },
              company: activeCompany || 'GSF',
              sendManagerReminder: true
            })
          });
          addNotification({ title: '💰 Payment Reminder Sent', message: `Payment reminder email sent to ${form.email} — Due: ${(form as any).partialPaymentDueDate}`, type: 'info' });
        } catch {
          // Silent fail for payment reminder
        }
      }

      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); goBack(); }, 1000);
    } catch (err: any) {
      console.error('Failed to save booking:', err);
      alert(`Failed to save booking: ${err?.message || 'Unknown error. Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Go Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{isEdit ? '✏️ Edit Booking' : '✈️ Add New Booking'}</h1>
            <p className="text-gray-500 text-sm mt-1">{isEdit ? 'Update booking details and save changes' : 'Fill in the passenger and flight details below'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isEdit && (
            <button
              onClick={() => sendEmailForBooking({ ...form, phone: `${form.countryCode}-${form.phone}` })}
              disabled={sendingEmail || !form.email}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </button>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-[100] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check size={18} />
          <span>Booking saved successfully! Redirecting...</span>
        </div>
      )}

      {/* QC Reviewed By Info */}
      {isEdit && (() => {
        const b = bookings.find(bk => bk.id === editId);
        if (b && (b as any).qcReviewedBy) {
          return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 flex items-center gap-3 mb-4">
              <span className="text-green-600 text-lg">✅</span>
              <div>
                <p className="text-sm font-bold text-green-800">QC Reviewed by: {(b as any).qcReviewedBy}</p>
                {(b as any).qcReviewedAt && <p className="text-xs text-green-600">on {(b as any).qcReviewedAt}</p>}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Section 1: Passenger Details */}
        <div className="card p-4 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
            Passenger Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
              <input
                value={form.firstName}
                onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setFormErrors(p => ({ ...p, firstName: false })); }}
                className={`input-field ${formErrors.firstName ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}
                placeholder="First Name"
              />
              {formErrors.firstName && <p className="text-xs text-red-500 mt-1">First name is required</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input
                value={form.lastName}
                onChange={(e) => { setForm({ ...form, lastName: e.target.value }); }}
                className="input-field"
                placeholder="Last Name"
              />

            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setFormErrors(p => ({ ...p, email: false })); }}
                className={`input-field ${formErrors.email ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}
                placeholder="email@example.com"
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">Email is required</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
              <div className={`flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${formErrors.phone ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-300'}`}>
                <CountryCodeSelect
                  value={form.countryCode}
                  onChange={(v) => { setForm({ ...form, countryCode: v, phone: '' }); setFormErrors(p => ({ ...p, phone: false })); }}
                />
                <input
                  value={form.phone}
                  onChange={(e) => {
                    const maxLen = getPhoneMaxLen(form.countryCode);
                    const val = e.target.value.replace(/\D/g, '').slice(0, maxLen);
                    setForm({ ...form, phone: val });
                    setFormErrors(p => ({ ...p, phone: false }));
                  }}
                  maxLength={getPhoneMaxLen(form.countryCode)}
                  className="flex-1 border-0 px-3 py-2 text-sm focus:outline-none"
                  placeholder={`${getPhoneMaxLen(form.countryCode)} digits`}
                />
              </div>
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">Phone number is required</p>}
              {!formErrors.phone && form.phone && <p className="text-xs text-gray-400 mt-1">{form.countryCode} {form.phone}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Flight Details */}
        <div className="card p-4 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
            Flight Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Origin */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Origin <span className="text-red-500">*</span></label>
              <AirportInput
                value={form.origin}
                onChange={(val) => { setForm(prev => ({ ...prev, origin: val })); setFormErrors(p => ({ ...p, origin: false })); }}
                hasError={formErrors.origin}
                filterAirportsFn={filterAirports}
                placeholder="IATA code or city..."
              />
              {formErrors.origin && <p className="text-xs text-red-500 mt-1">Origin is required</p>}
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Destination <span className="text-red-500">*</span></label>
              <AirportInput
                value={form.destination}
                onChange={(val) => { setForm(prev => ({ ...prev, destination: val })); setFormErrors(p => ({ ...p, destination: false })); }}
                hasError={formErrors.destination}
                filterAirportsFn={filterAirports}
                placeholder="IATA code or city..."
              />
              {formErrors.destination && <p className="text-xs text-red-500 mt-1">Destination is required</p>}
            </div>

            {/* Trip Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Trip Type</label>
              <select value={form.tripType} onChange={(e) => setForm({ ...form, tripType: e.target.value })} className="select-field">
                {TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Cabin */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cabin <span className="text-red-500">*</span></label>
              <select
                value={form.cabin}
                onChange={(e) => { setForm({ ...form, cabin: e.target.value as any }); setFormErrors(p => ({ ...p, cabin: false })); }}
                className={`select-field ${formErrors.cabin ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}
              >
                {CABINS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Departure Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Departure Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.departureDate}
                onChange={(e) => { setForm({ ...form, departureDate: e.target.value }); setFormErrors(p => ({ ...p, departureDate: false })); }}
                className={`input-field ${formErrors.departureDate ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}
              />
              {formErrors.departureDate && <p className="text-xs text-red-500 mt-1">Departure date is required</p>}
            </div>

            {/* Return Date */}
            {(form.tripType === 'Round Trip' || form.tripType === 'Multi City') && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Return Date</label>
                <input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} className="input-field" />
              </div>
            )}

            {/* Passengers */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Adults</label>
              <input type="number" min="1" value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} placeholder="1" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Children</label>
              <input type="number" min="0" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} placeholder="0" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Infants</label>
              <input type="number" min="0" value={form.infants} onChange={(e) => setForm({ ...form, infants: e.target.value })} placeholder="0" className="input-field" />
            </div>
          </div>
        </div>

        {/* Section 3: Status & Remarks */}
        <div className="card p-4 sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
            Status & Remarks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Query Status <span className="text-red-500">*</span></label>
              <select
                value={form.queryStatus}
                onChange={(e) => { setForm({ ...form, queryStatus: e.target.value }); setFormErrors(p => ({ ...p, queryStatus: false })); }}
                className={`select-field ${formErrors.queryStatus ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}
              >
                <option value="">Select Status</option>
                {QUERY_STATUSES.filter(s => !isAgent || !RESTRICTED_STATUSES.includes(s)).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {formErrors.queryStatus && <p className="text-xs text-red-500 mt-1">Status is required</p>}
            </div>

            {/* Call Back Date & Time Picker - shown when Call Back is selected */}
            {form.queryStatus === 'Call Back' && (
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Callback Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={(form as any).callbackDate || ''}
                    onChange={(e) => setForm({ ...form, callbackDate: e.target.value } as any)}
                    className={`input-field ${formErrors.callbackDate ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {formErrors.callbackDate && <p className="text-xs text-red-500 mt-1">Callback date is required</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Callback Time <span className="text-gray-400 text-[10px]">(when to get notified)</span></label>
                  <input
                    type="time"
                    value={(form as any).callbackTime || ''}
                    onChange={(e) => setForm({ ...form, callbackTime: e.target.value } as any)}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1">⏰ Notification pops at this time</p>
                </div>
                <p className="text-xs text-gray-400 mt-0 sm:col-span-2">📅 A reminder notification will appear at the selected time on this date to call the client. If no time is set, it will show on page load.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Query Source <span className="text-red-500">*</span></label>
              <select
                value={form.querySource}
                onChange={(e) => { setForm({ ...form, querySource: e.target.value }); setFormErrors(p => ({ ...p, querySource: false })); }}
                className={`select-field ${formErrors.querySource ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}
              >
                <option value="">Select Source</option>
                {QUERY_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {formErrors.querySource && <p className="text-xs text-red-500 mt-1">Source is required</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Partial Payment</label>
              <select value={form.partialPayment} onChange={(e) => setForm({ ...form, partialPayment: e.target.value as any })} className="select-field">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Partial Payment Due Date & Amount - shown when partial payment is Yes */}
            {form.partialPayment === 'Yes' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Due Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={(form as any).partialPaymentDueDate || ''}
                    onChange={(e) => setForm({ ...form, partialPaymentDueDate: e.target.value } as any)}
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-400 mt-1">Select date to send payment reminder to client</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Outstanding Amount</label>
                  <input
                    type="text"
                    value={(form as any).partialPaymentAmount || ''}
                    onChange={(e) => setForm({ ...form, partialPaymentAmount: e.target.value } as any)}
                    className="input-field"
                    placeholder="e.g. $500 CAD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Received Amount</label>
                  <input
                    type="number"
                    value={(form as any).receivedAmount || ''}
                    onChange={(e) => setForm({ ...form, receivedAmount: e.target.value } as any)}
                    className="input-field"
                    placeholder="Amount received so far"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount Pending</label>
                  <input
                    type="text"
                    readOnly
                    value={(() => { const total = Number((form as any).partialPaymentAmount) || 0; const received = Number((form as any).receivedAmount) || 0; return total - received > 0 ? (total - received).toFixed(2) : '0'; })()}
                    className="input-field bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </>
            )}

            {/* Remarks */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Remarks <span className="text-red-500">*</span></label>
              {remarksList.length > 0 && (
                <div className="mb-2 space-y-1.5 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {remarksList.map((r, i) => (
                    <div key={i} className="text-xs border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                      <p className="text-gray-800">{r.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <span className="font-medium text-blue-600">{r.addedBy}</span> · {r.date}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={newRemark}
                  onChange={(e) => { setNewRemark(e.target.value); setFormErrors(p => ({ ...p, remarks: false })); }}
                  className={`input-field h-16 resize-none flex-1 text-sm ${formErrors.remarks ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}
                  placeholder="Add a remark..."
                />
                <button onClick={addRemark} type="button" className="btn-secondary self-end px-4 py-2 text-sm">Add</button>
              </div>
              {formErrors.remarks && <p className="text-xs text-red-500 mt-1">⚠ Please add at least one remark</p>}
            </div>
          </div>
        </div>

        {/* Section 4: PNR Details */}
        {showPnrSection && (
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                PNR Details *
              </h3>
              <div className="flex items-center gap-2">
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="select-field text-xs py-1.5 w-24">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={addPnrRow} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                  <Plus size={14} /> Add Row
                </button>
              </div>
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full min-w-[720px] text-sm border-collapse border border-gray-200">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b-2 border-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left border border-gray-200">PNR</th>
                    <th className="px-3 py-2 text-left border border-gray-200">First Name</th>
                    <th className="px-3 py-2 text-left border border-gray-200">Last Name</th>
                    <th className="px-3 py-2 text-left border border-gray-200">Airline</th>
                    {isSupervisorOrAbove && <th className="px-3 py-2 text-left border border-gray-200">Supplier</th>}
                    {isSupervisorOrAbove && <th className="px-3 py-2 text-left border border-gray-200">Payment Method</th>}
                    <th className="px-3 py-2 text-left border border-gray-200">Sell ({form.currency})</th>
                    <th className="px-3 py-2 text-left border border-gray-200">Cost ({form.currency})</th>
                    <th className="px-3 py-2 text-left border border-gray-200">Fee ({form.currency})</th>
                    <th className="px-3 py-2 text-left border border-gray-200">MCO ({form.currency})</th>
                    <th className="px-3 py-2 text-left border border-gray-200">GPM ({form.currency})</th>
                    <th className="px-3 py-2 w-10 border border-gray-200"></th>
                  </tr>
                </thead>
                <tbody>
                  {pnrDetails.map((detail, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border border-gray-200">
                        <input value={detail.pnr} onChange={(e) => handlePnrDetailChange(idx, 'pnr', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} className="input-field py-1.5 text-sm uppercase font-mono" placeholder="PNR" maxLength={6} />
                      </td>
                      <td className="p-2 border border-gray-200">
                        <input value={detail.firstName} onChange={(e) => handlePnrDetailChange(idx, 'firstName', e.target.value.toUpperCase())} className="input-field py-1.5 text-sm uppercase" placeholder="First Name" />
                      </td>
                      <td className="p-2 border border-gray-200">
                        <input value={detail.lastName} onChange={(e) => handlePnrDetailChange(idx, 'lastName', e.target.value.toUpperCase())} className="input-field py-1.5 text-sm uppercase" placeholder="Last Name" />
                      </td>
                      <td className="p-2 border border-gray-200">
                        <input value={detail.airline} onChange={(e) => handlePnrDetailChange(idx, 'airline', e.target.value.toUpperCase())} className="input-field py-1.5 text-sm uppercase" placeholder="Airline" />
                      </td>
                      {isSupervisorOrAbove && (
                        <td className="p-2 border border-gray-200">
                          <select value={detail.supplier} onChange={(e) => handlePnrDetailChange(idx, 'supplier', e.target.value)} className="input-field py-1.5 text-sm">
                            <option value="">Select Supplier</option>
                            {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      )}
                      {isSupervisorOrAbove && (
                        <td className="p-2 border border-gray-200">
                          <select value={detail.paymentMethod} onChange={(e) => handlePnrDetailChange(idx, 'paymentMethod', e.target.value)} className="input-field py-1.5 text-sm">
                            <option value="">Select Payment Method</option>
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                      )}
                      <td className="p-2 border border-gray-200"><input type="number" value={detail.sell} onChange={(e) => handlePnrDetailChange(idx, 'sell', Number(e.target.value))} className="input-field py-1.5 text-sm" /></td>
                      <td className="p-2 border border-gray-200"><input type="number" value={detail.cost} onChange={(e) => handlePnrDetailChange(idx, 'cost', Number(e.target.value))} className="input-field py-1.5 text-sm" /></td>
                      <td className="p-2 border border-gray-200"><input type="number" value={detail.fee} onChange={(e) => handlePnrDetailChange(idx, 'fee', Number(e.target.value))} className="input-field py-1.5 text-sm" /></td>
                      <td className="p-2 border border-gray-200"><input type="number" value={detail.mco} onChange={(e) => handlePnrDetailChange(idx, 'mco', Number(e.target.value))} className="input-field py-1.5 text-sm" /></td>
                      <td className="p-2 border border-gray-200"><input type="number" value={detail.gpm} onChange={(e) => handlePnrDetailChange(idx, 'gpm', Number(e.target.value))} className="input-field py-1.5 text-sm font-medium text-green-700" title="Auto-calculated (Sell-Cost-Fee-MCO). You can override manually." /></td>
                      <td className="p-2 border border-gray-200 text-center">
                        {pnrDetails.length > 1 && (
                          <button onClick={() => removePnrRow(idx)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Last modified by: <span className="font-medium text-gray-600">{currentUser?.name || 'Admin'}</span></p>
          </div>
        )}

        {/* Section 5: Documents/Images */}
        {showImageSection && (
          <div className="card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">5</span>
                Documents & Images ({images.length})
              </h3>
              <span className="text-xs text-gray-500 font-medium">Supports PNG, JPG, PDF, DOCX, XLSX, TXT (Live Preview & Download)</span>
            </div>

            <div className="flex flex-wrap gap-4">
              {images.map((doc, idx) => {
                const isImg = isImageDoc(doc);
                const badge = getDocBadgeInfo(doc);
                return (
                  <div key={doc.id || idx} className="relative group w-32 h-32 border-2 border-gray-200 hover:border-blue-400 rounded-2xl overflow-hidden bg-gray-50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    {isImg ? (
                      <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-b from-gray-50 to-gray-100">
                        <span className="text-3xl mb-1">{badge.icon}</span>
                        <span className="text-[10px] font-bold text-gray-800 truncate w-full px-1">{doc.name}</span>
                        <span className="text-[9px] text-gray-400 mt-0.5">{badge.label} {doc.size ? `• ${formatFileSize(doc.size)}` : ''}</span>
                      </div>
                    )}

                    {/* Hover Action Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between p-2">
                      <span className="text-[10px] text-white font-semibold truncate w-full text-center px-1">
                        {doc.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button"
                          onClick={() => setActivePreviewDoc(doc)} 
                          className="bg-white text-gray-800 rounded-full p-2 hover:bg-blue-50 shadow-md transition-transform hover:scale-110" 
                          title="Preview"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => downloadAttachment(doc)} 
                          className="bg-white text-blue-600 rounded-full p-2 hover:bg-blue-50 shadow-md transition-transform hover:scale-110" 
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)} 
                          className="bg-white text-red-600 rounded-full p-2 hover:bg-red-50 shadow-md transition-transform hover:scale-110" 
                          title="Delete"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <span className="text-[9px] text-white/80 font-medium">
                        {formatFileSize(doc.size)}
                      </span>
                    </div>
                  </div>
                );
              })}

              <label className="w-32 h-32 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 transition-all group">
                <Upload size={24} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 mt-1.5">Upload File</span>
                <span className="text-[9px] text-gray-400 mt-0.5">Images & Docs</span>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf" 
                  onChange={handleImageUpload} 
                  disabled={uploading} 
                />
              </label>
            </div>
            {uploading && (
              <p className="text-xs text-blue-600 animate-pulse mt-2 flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" /> Processing & securing attachments...
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="card p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            {isLockedForAgent && (
              <div className="text-sm text-amber-600 flex items-center px-4 py-2 bg-amber-50 rounded-lg">
                🔒 Locked for editing (Status: {originalQueryStatus})
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button onClick={goBack} className="btn-secondary px-4 sm:px-6 py-2.5">Cancel</button>
            {canEdit && (
              <button onClick={handleSave} disabled={isSaving} className="btn-primary px-4 sm:px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {isSaving ? 'Saving...' : (isEdit ? 'Update Booking' : 'Save Booking')}
              </button>
            )}
          </div>
        </div>
      </div>

      <AttachmentPreviewModal doc={activePreviewDoc} onClose={() => setActivePreviewDoc(null)} />

      {/* Verification Data Section (Edit Mode) */}
      {isEdit && editId && <VerificationSection bookingId={editId} />}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              <X size={24} />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
