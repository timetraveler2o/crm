import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCrmStore } from '../store/crmStore';
import { QUERY_STATUSES, QUERY_SOURCES, CABINS, PnrDetail, RemarkEntry, SUPPLIERS, PAYMENT_METHODS } from '../types';
import { AIRPORTS } from '../data/airports';
import { uploadImage, getImageUrl, API_BASE_URL } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, Download, Upload, Edit2, Trash2, X, RotateCcw, Check, ChevronsUpDown, Image as ImageIcon, ArrowLeft, Eye, Mail, Loader2, ExternalLink, Printer, CheckSquare, Square, MinusSquare, ShieldCheck, Copy, Link2, CheckCircle, XCircle } from 'lucide-react';
import Pagination from '../components/Pagination';
import { formatDateDMY, formatDateTimeDMY } from '../lib/utils';
import { client } from '../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearPageFilters, loadPageFilters, savePageFilters } from '../lib/useFilterPersistence';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Consistent date/time formatting (IST - India Standard Time)
const formatLogDateTime = () => {
  const utc = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const d = new Date(utc.getTime() + istOffset);
  const day = d.getUTCDate().toString().padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon = months[d.getUTCMonth()];
  const yr = d.getUTCFullYear();
  const hr = d.getUTCHours();
  const min = d.getUTCMinutes().toString().padStart(2, '0');
  const sec = d.getUTCSeconds().toString().padStart(2, '0');
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr % 12 || 12;
  return `${day} ${mon} ${yr}, ${hr12}:${min}:${sec} ${ampm}`;
};

// AirportInput: free text + autocomplete, never resets typed value
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
  useEffect(() => { setInputVal(value || ''); }, [value]);
  const suggestions = useMemo(() => filterAirportsFn(inputVal), [inputVal]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase();
    setInputVal(v);
    onChange(v);
    setOpen(true);
  };
  const handleSelect = (code: string) => { setInputVal(code); onChange(code); setOpen(false); };
  const handleBlur = () => { setTimeout(() => setOpen(false), 150); };
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
        <ul className="absolute mt-1 max-h-60 min-w-[320px] w-max max-w-[480px] overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {suggestions.map((airport) => (
            <li key={airport[0]} onMouseDown={() => handleSelect(airport[0])} className="cursor-pointer select-none py-2 pl-3 pr-4 hover:bg-blue-600 hover:text-white text-gray-900">
              <span className="font-bold mr-2">{airport[0]}</span>
              <span className="text-xs opacity-80">{airport[1]}</span>
            </li>
          ))}
        </ul>
      )}
      {open && inputVal.length > 0 && suggestions.length === 0 && (
        <div className="absolute mt-1 min-w-[200px] rounded-md bg-white py-2 px-4 text-sm text-gray-500 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          No airports found — free text accepted
        </div>
      )}
    </div>
  );
}

// Reusable MultiSelectDropdown with checkboxes
function MultiSelectDropdown({ label, options, selected, onChange }: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };
  const clearAll = () => onChange([]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className="select-field text-sm py-2 text-left flex items-center justify-between gap-1 w-full">
        <span className="truncate">{selected.length === 0 ? label : `${selected.length} selected`}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute mt-1 w-full min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{label}</span>
            {selected.length > 0 && <button onClick={clearAll} className="text-xs text-red-500 hover:underline">Clear</button>}
          </div>
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700">
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const CURRENCIES = ['CAD', 'USD', 'AUD'];
const TRIP_TYPES = ['One Way', 'Round Trip', 'Multi City'];
const COUNTRY_CODES = [
  { code: '+1', flag: '🇨🇦', label: '🇨🇦 +1 (CA)', maxLen: 10 },
  { code: '+1', flag: '🇺🇸', label: '🇺🇸 +1 (US)', maxLen: 10 },
  { code: '+91', flag: '🇮🇳', label: '🇮🇳 +91 (IN)', maxLen: 10 },
  { code: '+44', flag: '🇬🇧', label: '🇬🇧 +44 (UK)', maxLen: 10 },
  { code: '+61', flag: '🇦🇺', label: '🇦🇺 +61 (AU)', maxLen: 9 },
  { code: '+64', flag: '🇳🇿', label: '🇳🇿 +64 (NZ)', maxLen: 9 },
  { code: '+65', flag: '🇸🇬', label: '🇸🇬 +65 (SG)', maxLen: 8 },
  { code: '+971', flag: '🇦🇪', label: '🇦🇪 +971 (UAE)', maxLen: 9 },
  { code: '+92', flag: '🇵🇰', label: '🇵🇰 +92 (PK)', maxLen: 10 },
  { code: '+880', flag: '🇧🇩', label: '🇧🇩 +880 (BD)', maxLen: 10 },
  { code: '+94', flag: '🇱🇰', label: '🇱🇰 +94 (LK)', maxLen: 9 },
  { code: '+60', flag: '🇲🇾', label: '🇲🇾 +60 (MY)', maxLen: 10 },
  { code: '+66', flag: '🇹🇭', label: '🇹🇭 +66 (TH)', maxLen: 9 },
  { code: '+968', flag: '🇴🇲', label: '🇴🇲 +968 (OM)', maxLen: 8 },
  { code: '+966', flag: '🇸🇦', label: '🇸🇦 +966 (SA)', maxLen: 9 },
  { code: '+974', flag: '🇶🇦', label: '🇶🇦 +974 (QA)', maxLen: 8 },
];

// Get phone max length based on country code
const getPhoneMaxLen = (code: string): number => {
  const found = COUNTRY_CODES.find(c => c.code === code);
  return found?.maxLen ?? 10;
};

export default function Bookings() {
  const { bookings, addBooking, updateBooking, deleteBooking, users, queryStatuses, fetchData } = useCrmStore();
  const { currentUser, addNotification, activeCompany } = useAuthStore();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewBooking, setViewBooking] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  
  // Check if we're returning from an internal bookings route (edit/add)
  const isInternalReturn = sessionStorage.getItem('crm_bookings_internal_nav') === 'true';
  // Clear the flag immediately after reading
  if (isInternalReturn) {
    sessionStorage.removeItem('crm_bookings_internal_nav');
  }

  // Filters state: restore from sessionStorage ONLY if returning from edit/add, otherwise fresh
  const [filters, setFilters] = useState(() => {
    if (isInternalReturn) {
      const saved = loadPageFilters<any>('bookings');
      return saved?.filters || {
        queryId: '', firstName: '', lastName: '', email: '', phone: '', countryCode: '+1',
        origin: '', destination: '', partialPayment: '',
        fromDate: '', toDate: '', querySource: '', pnr: ''
      };
    }
    return {
      queryId: '', firstName: '', lastName: '', email: '', phone: '', countryCode: '+1',
      origin: '', destination: '', partialPayment: '',
      fromDate: '', toDate: '', querySource: '', pnr: ''
    };
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => {
    if (isInternalReturn) {
      const saved = loadPageFilters<any>('bookings');
      return saved?.selectedStatuses || [];
    }
    return [];
  });
  const [selectedAgents, setSelectedAgents] = useState<string[]>(() => {
    if (isInternalReturn) {
      const saved = loadPageFilters<any>('bookings');
      return saved?.selectedAgents || [];
    }
    return [];
  });
  const [sortBy, setSortBy] = useState(() => {
    if (isInternalReturn) {
      const saved = loadPageFilters<any>('bookings');
      return saved?.sortBy || 'id_desc';
    }
    return 'id_desc';
  });

  // Form state
  const [form, setForm] = useState({
    addedBy: 'Admin', firstName: '', lastName: '', email: '', phone: '', countryCode: '+1',
    origin: '', destination: '', departureDate: '', returnDate: '',
    cabin: 'Economy' as any, adults: '' as any, children: '' as any, infants: '' as any,
    queryStatus: '', querySource: '', remarks: '', partialPayment: 'No' as any,
    tripType: 'One Way', currency: 'CAD'
  });

  // Remarks history
  const [remarksList, setRemarksList] = useState<RemarkEntry[]>([]);
  const [newRemark, setNewRemark] = useState('');

  // Dynamic lists
  const [pnrDetails, setPnrDetails] = useState<PnrDetail[]>([{ pnr: '', firstName: '', lastName: '', airline: '', supplier: '', paymentMethod: '', cost: '' as any, sell: '' as any, fee: '' as any, mco: '' as any, gpm: '' as any }]);
  const [qcPnrDetails, setQcPnrDetails] = useState<PnrDetail[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [originalQueryStatus, setOriginalQueryStatus] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');
  const [mailtoLink, setMailtoLink] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    if (isInternalReturn) {
      const saved = loadPageFilters<any>('bookings');
      return saved?.currentPage || 1;
    }
    return 1;
  });
  const [perPage, setPerPage] = useState(() => {
    if (isInternalReturn) {
      const saved = loadPageFilters<any>('bookings');
      return saved?.perPage || 50;
    }
    return 50;
  });

  // Client Verification State
  const [verifyModal, setVerifyModal] = useState(false);
  const [verifyLink, setVerifyLink] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyCopied, setVerifyCopied] = useState(false);
  const [verificationData, setVerificationData] = useState<any[]>([]);
  const [verifyImagePreview, setVerifyImagePreview] = useState<{ images: {src: string; label: string}[]; index: number } | null>(null);
  const [flippedImages, setFlippedImages] = useState<Record<string, boolean>>({});
  const [verifySendStatus, setVerifySendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Auto-dismiss verify send status after 5 seconds
  useEffect(() => {
    if (verifySendStatus === 'sent') {
      const timer = setTimeout(() => {
        setVerifySendStatus('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [verifySendStatus]);

  // Save filters to sessionStorage on every change (so they can be restored if returning from edit/add)
  useEffect(() => {
    savePageFilters('bookings', {
      filters,
      selectedStatuses,
      selectedAgents,
      sortBy,
      currentPage,
      perPage
    });
  }, [filters, selectedStatuses, selectedAgents, sortBy, currentPage, perPage]);

  // Old CRM Data
  const [showOldCRM, setShowOldCRM] = useState(false);
  const [oldCRMData, setOldCRMData] = useState<any[]>([]);
  const [oldCRMLoading, setOldCRMLoading] = useState(false);
  const [oldCRMPage, setOldCRMPage] = useState(1);
  const [oldCRMPerPage, setOldCRMPerPage] = useState(30);
  const [showAllAgentBookings, setShowAllAgentBookings] = useState(false);

  // Helper: convert various date formats (D-Mon-YY, DD-Mon-YYYY, etc.) to DD-MM-YYYY
  const convertOldCRMDate = (dateStr: string): string => {
    if (!dateStr || dateStr === '—') return '';
    // Already DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    // Try D-Mon-YY or DD-Mon-YY format (e.g., "8-Jan-27", "20-Apr-26")
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parts[0].trim();
      const mon = parts[1].trim().toLowerCase();
      const yr = parts[2].trim();
      if (monthMap[mon]) {
        const fullYear = yr.length === 2 ? (parseInt(yr) > 50 ? '19' + yr : '20' + yr) : yr;
        return `${day.padStart(2, '0')}-${monthMap[mon]}-${fullYear}`;
      }
    }
    // Try parsing as generic date
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${day}-${month}-${d.getFullYear()}`;
      }
    } catch {}
    return dateStr;
  };

  const loadOldCRMData = useCallback(async () => {
    if (oldCRMData.length > 0) return; // Already loaded
    setOldCRMLoading(true);
    try {
      const res = await fetch('/old-crm-data.csv');
      const text = await res.text();
      const { parseCSV } = await import('../lib/dataImport');
      const { rows } = parseCSV(text);
      // Map old CRM fields to our schema
      const mapped = rows.map((row: any, idx: number) => {
        try {
          const costVal = row.cost || row['OUR COST'] || '0';
          const sellVal = row.sell || row['SELLING COST'] || '0';
          const feeVal = row.fee || row['ISSUANCE'] || '0';
          const gpmVal = row.gpm || row['GPM'] || '0';
          // Fix: extract fullName from row.firstName (parseCSV maps NAME column to firstName)
          const fullName = row.firstName || row['NAME'] || '';
          const rawPhone = row.phone || row['CTC'] || '';
          const rawDate = row.departureDate || row['DATE OF TRAVEL'] || '';
          return {
            id: -(idx + 1), // Negative IDs to distinguish from new
            queryId: row.queryId || row['Quer ID'] || row['QUER ID'] || '',
            addedBy: row.addedBy || row['Added By'] || '',
            firstName: fullName.split(' ')[0] || '',
            lastName: row.lastName || fullName.split(' ').slice(1).join(' ') || '',
            email: row.email || row['EMAIL'] || '',
            phone: rawPhone,
            origin: row.origin || row['ORIGIN'] || (row['SECTORS'] || '').split('-')[0]?.trim() || '',
            destination: row.destination || row['DESTINATION'] || (row['SECTORS'] || '').split('-')[1]?.trim() || '',
            departureDate: convertOldCRMDate(rawDate),
            airline: row.airline || row['AIRLINES'] || '',
            queryStatus: row.queryStatus || row['QUERY STATUS'] || '',
            querySource: row.querySource || row['SOURCE'] || '',
            pnr: row.pnr || row['PNR'] || '',
            partialPayment: row.partialPayment || row['PARTIAL PAYMENT'] || '',
            pnrDetails: JSON.stringify([{
              pnr: row.pnr || row['PNR'] || '',
              ticket: row.ticket || row['TICKET'] || '',
              partial: row.partialPayment || row['PARTIAL PAYMENT'] || '',
              cost: costVal,
              sell: sellVal,
              fee: feeVal,
              mco: feeVal,
              gpm: gpmVal,
              currency: row.currency || row['CURRENCY'] || 'CAD',
            }]),
            company: row.company || 'Get Set Flight',
            created: '',
            modified: '',
            isOldCRM: true,
          };
        } catch (rowErr) {
          console.warn('Skipping bad old CRM row', idx, rowErr);
          return null;
        }
      }).filter(Boolean);
      setOldCRMData(mapped);
    } catch (err) {
      console.error('Failed to load old CRM data:', err);
    } finally {
      setOldCRMLoading(false);
    }
  }, [oldCRMData.length]);

  
  // Track processed URL to avoid re-processing on bookings update
  const urlProcessedRef = useRef<string | null>(null);
  
  // Track first render to skip resetting page on mount (when restoring from session)
  const isFirstFilterRender = useRef(true);

  // Reset pagination to page 1 whenever any filter changes (but not on initial mount)
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    setOldCRMPage(1);
    setCurrentPage(1);
  }, [filters, selectedStatuses, selectedAgents]);

  // Fetch data on mount for reliability
  useEffect(() => { fetchData(); }, []);

  // Check URL params for auto-opening modal and setting filters
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('add') && !params.has('status') && !params.has('view') && !params.has('partialPayment')) return;
    
    // Skip if we already processed this exact URL search string
    if (urlProcessedRef.current === location.search) return;
    urlProcessedRef.current = location.search;

    if (params.get('add') === 'true') {
      navigate('/bookings/add');
      return;
    }

    // IMPORTANT: When navigating from Dashboard with filter params,
    // clear ALL existing filters first to avoid stale filter accumulation
    const statusParam = params.get('status');
    const partialParam = params.get('partialPayment');
    const viewId = params.get('view');

    if (statusParam || partialParam) {
      // Reset all filters to defaults
      clearPageFilters('bookings');
      setFilters({
        queryId: '', firstName: '', lastName: '', email: '', phone: '', countryCode: '+1',
        origin: '', destination: '', partialPayment: '',
        fromDate: '', toDate: '', querySource: '', pnr: ''
      });
      setSelectedStatuses([]);
      setSelectedAgents([]);
    }

    if (statusParam) {
      setSelectedStatuses([statusParam]);
    }

    if (partialParam) {
      setFilters(f => ({ ...f, partialPayment: partialParam }));
    }

    if (viewId) {
      const b = bookings.find(bk => bk.id === Number(viewId));
      if (b) setViewBooking(b);
    }

    // Use navigate to properly clear URL (updates React Router location)
    navigate('/bookings', { replace: true });
  }, [location.search]);

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

  // Smart airport search
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


  // Helper to extract IATA code from stored value (handles full airport names)
  const getIata = (val: string) => {
    if (!val) return '';
    // Check for bracket pattern [XXX]
    const bracketMatch = val.match(/\[([A-Z]{3})\]/);
    if (bracketMatch) return bracketMatch[1];
    // If already a short code (3 letters), return as-is
    const trimmed = val.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(trimmed)) return trimmed;
    // Split by " - " first (e.g., "DFW - Dallas/Fort Worth International")
    const dashPart = trimmed.split(' - ')[0].trim();
    if (/^[A-Z]{3}$/.test(dashPart)) return dashPart;
    // Try to extract first 3-letter uppercase word
    const codeMatch = trimmed.match(/\b([A-Z]{3})\b/);
    if (codeMatch) return codeMatch[1];
    // Fallback: first word
    return dashPart.split(/[\s,]/)[0].slice(0, 6);
  };

  // Filtered bookings
  
  // Helper: parse DD-MM-YYYY date string to YYYY-MM-DD for comparison
  const parseDDMMYYYY = (dateStr: string): string | null => {
    if (!dateStr || dateStr === '—') return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      if (dd && mm && yyyy && yyyy.length === 4) {
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      }
    }
    return null;
  };

  const filteredOldCRMData = oldCRMData.filter(b => {
    // Query ID filter - also search in combined fields for flexibility
    if (filters.queryId) {
      const qid = filters.queryId.toLowerCase();
      const matchesQueryId = (b.queryId || '').toLowerCase().includes(qid);
      if (!matchesQueryId) return false;
    }
    // First Name filter - search in firstName AND full name (firstName + lastName)
    if (filters.firstName) {
      const fn = filters.firstName.toLowerCase();
      const fullName = ((b.firstName || '') + ' ' + (b.lastName || '')).toLowerCase();
      if (!fullName.includes(fn) && !(b.firstName || '').toLowerCase().includes(fn)) return false;
    }
    // Last Name filter
    if (filters.lastName) {
      const ln = filters.lastName.toLowerCase();
      const fullName = ((b.firstName || '') + ' ' + (b.lastName || '')).toLowerCase();
      if (!(b.lastName || '').toLowerCase().includes(ln) && !fullName.includes(ln)) return false;
    }
    // Email filter
    if (filters.email && !(b.email || '').toLowerCase().includes(filters.email.toLowerCase())) return false;
    // Phone filter - strip non-digit chars for flexible matching
    if (filters.phone) {
      const filterDigits = filters.phone.replace(/[^0-9]/g, '');
      const recordPhone = (b.phone || '').replace(/[^0-9]/g, '');
      if (filterDigits && !recordPhone.includes(filterDigits)) return false;
    }
    if (filters.origin && !(b.origin || '').toLowerCase().includes(filters.origin.toLowerCase())) return false;
    if (filters.destination && !(b.destination || '').toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.partialPayment && (b.partialPayment || '').toLowerCase() !== filters.partialPayment.toLowerCase()) return false;
    if (selectedAgents.length > 0 && !selectedAgents.includes(b.addedBy)) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(b.queryStatus)) return false;
    if (filters.querySource && b.querySource !== filters.querySource) return false;
    // PNR filter - check both pnr field and pnrDetails for pipe-separated PNRs
    if (filters.pnr) {
      const pnrSearch = filters.pnr.toLowerCase();
      const pnrField = (b.pnr || '').toLowerCase();
      if (!pnrField.includes(pnrSearch)) {
        // Also check inside pnrDetails (some rows have pipe-separated PNRs)
        try {
          const details = JSON.parse(b.pnrDetails || '[]');
          const anyMatch = details.some((d: any) => (d.pnr || '').toLowerCase().includes(pnrSearch));
          if (!anyMatch) return false;
        } catch { return false; }
      }
    }
    // Date range filter using departureDate (DD-MM-YYYY format after conversion)
    if (filters.fromDate || filters.toDate) {
      const isoDate = parseDDMMYYYY(b.departureDate || '');
      if (isoDate) {
        if (filters.fromDate && isoDate < filters.fromDate) return false;
        if (filters.toDate && isoDate > filters.toDate) return false;
      } else {
        // If date can't be parsed, skip date filter for this record (don't exclude it)
        // This allows other filters to still work on records with unparseable dates
      }
    }
    return true;
  });

  const filtered = bookings.filter(b => {
    // Company isolation - map activeCompany ID to full company names
    // Uses user's email-based company detection as the source of truth
    if (activeCompany) {
      const companyMatch = (() => {
        if (!b.company) return activeCompany === 'GSF';
        if (activeCompany === 'GSF') return b.company === 'Get Set Flight';
        if (activeCompany === 'LBT') return b.company === 'Look Book Ticket';
        if (activeCompany === 'travelo') return b.company === 'Traveloboom' || b.company === 'Traveloboom';
        return true;
      })();
      if (!companyMatch) return false;
    }

    // Role-based visibility: Agents only see own bookings by default
    // But can search/filter to find others by PNR, name, email, phone
    const role = currentUser?.role || '';
    const isAgentRole = role === 'Agent';
    const hasSearchFilter = filters.pnr || filters.firstName || filters.lastName || filters.email || filters.phone || filters.queryId;
    if (isAgentRole && b.addedBy !== currentUser?.name && !hasSearchFilter) return false;

    if (filters.queryId && !(b.queryId || '').toLowerCase().includes(filters.queryId.toLowerCase())) return false;
    if (filters.firstName && !(b.firstName || '').toLowerCase().includes(filters.firstName.toLowerCase())) return false;
    if (filters.lastName && !(b.lastName || '').toLowerCase().includes(filters.lastName.toLowerCase())) return false;
    if (filters.email && !(b.email || '').toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.phone && !(b.phone || '').includes(filters.phone)) return false;
    if (filters.origin && !(b.origin || '').toLowerCase().includes(filters.origin.toLowerCase())) return false;
    if (filters.destination && !(b.destination || '').toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.partialPayment && b.partialPayment !== filters.partialPayment) return false;
    if (selectedAgents.length > 0 && !selectedAgents.includes(b.addedBy)) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(b.queryStatus)) return false;
    if (filters.querySource && b.querySource !== filters.querySource) return false;
    if (filters.pnr && !(b.pnr || '').toLowerCase().includes(filters.pnr.toLowerCase())) return false;
    // Supplier filter
    if (selectedSupplier) {
      try {
        if (b.pnrDetails) {
          const details = JSON.parse(b.pnrDetails);
          if (Array.isArray(details)) {
            const hasSupplier = details.some((d: any) => d.supplier === selectedSupplier);
            if (!hasSupplier) return false;
          } else return false;
        } else return false;
      } catch { return false; }
    }
    // Date range filter
    if (filters.fromDate && b.created) {
      try { const d = new Date(b.created); if (isNaN(d.getTime())) return true; var createdDate = d.toISOString().split('T')[0]; } catch { return true; }
      if (createdDate < filters.fromDate) return false;
    }
    if (filters.toDate && b.created) {
      try { const d = new Date(b.created); if (isNaN(d.getTime())) return true; var createdDate = d.toISOString().split('T')[0]; } catch { return true; }
      if (createdDate > filters.toDate) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'id_asc') return a.id - b.id;
    if (sortBy === 'id_desc') return b.id - a.id;
    if (sortBy === 'name_asc') return (a.firstName || '').localeCompare(b.firstName || '');
    if (sortBy === 'name_desc') return (b.firstName || '').localeCompare(a.firstName || '');
    return 0;
  });

  const userRole = currentUser?.role || '';
  const roleLower = userRole.toLowerCase();
  const isSupervisorRole = ['supervisor'].includes(roleLower);
  const isManagerRole = ['manager'].includes(roleLower);
  const isLimitedExportRole = isSupervisorRole || isManagerRole;
  const isFullExportRole = ['admin', 'super admin', 'hr (human resource)', 'hr', 'it (information tech)', 'it', 'operation manager'].includes(roleLower);
  const canExport = currentUser?.permissions?.includes('Export Data') || isFullExportRole || isLimitedExportRole;

  const getBookingsExportFilename = (ext: string) => {
    const today = new Date().toISOString().split('T')[0];
    const fromDate = filters.fromDate || today;
    const toDate = filters.toDate || today;
    const statusPart = selectedStatuses.length > 0 ? '_' + selectedStatuses.join('_').replace(/\s+/g, '_') : '';
    const sourcePart = filters.querySource ? '_' + filters.querySource.replace(/\s+/g, '_') : '';
    const agentPart = selectedAgents.length > 0 ? '_' + selectedAgents.join('_').replace(/\s+/g, '_') : '';
    const supplierPart = selectedSupplier ? '_' + selectedSupplier.replace(/\\s+/g, '_') : '';
    return 'Bookings_' + fromDate + '_to_' + toDate + statusPart + sourcePart + agentPart + supplierPart + '.' + ext;
  };

  const exportCSV = () => {
    // Supervisor: limited columns (no client name/email/phone)
    const limitedHeaders = ['Agent Name', 'Query ID', 'Client Name', 'PNR', 'ORIGIN', 'DESTINATION', 'DATE OF TRAVEL', 'AIRLINES', 'SUPPLIER', 'QUERY STATUS', 'SOURCE', 'TICKET', 'PARTIAL PAYMENT', 'OUR COST', 'SELLING COST', 'ISSUANCE', 'GPM', 'CURRENCY', 'COMPANY'];
    const fullHeaders = ['Added By', 'CTC', 'EMAIL', 'PNR', 'NAME', 'ORIGIN', 'DESTINATION', 'DATE OF TRAVEL', 'AIRLINES', 'SUPPLIER', 'QUERY STATUS', 'SOURCE', 'TICKET', 'PARTIAL PAYMENT', 'OUR COST', 'SELLING COST', 'ISSUANCE', 'GPM', 'CURRENCY', 'COMPANY', 'CREATED', 'MODIFIED'];
    const useLimitedExport = isLimitedExportRole && !isFullExportRole;
    const headers = useLimitedExport ? limitedHeaders : fullHeaders;
    
    const rows = filtered.map(b => {
      let pnrs = b.pnr || '';
      let airlines = '';
      let supplier = '';
      let cost = '';
      let sell = '';
      let fee = '';
      let gpm = '';
      
      try {
        if (b.pnrDetails) {
          const details = JSON.parse(b.pnrDetails);
          if (Array.isArray(details) && details.length > 0) {
            pnrs = details.map((d: any) => d.pnr).filter(Boolean).join(' | ') || b.pnr;
            airlines = details.map((d: any) => d.airline).filter(Boolean).join(' | ');
            supplier = details.map((d: any) => d.supplier).filter(Boolean).join(' | ');
            // Sum up numeric values instead of joining with pipes
            const costSum = details.reduce((sum: number, d: any) => sum + (Number(d.cost) || 0), 0);
            const sellSum = details.reduce((sum: number, d: any) => sum + (Number(d.sell) || 0), 0);
            const feeSum = details.reduce((sum: number, d: any) => sum + (Number(d.fee) || 0), 0);
            const gpmSum = details.reduce((sum: number, d: any) => sum + (Number(d.gpm) || 0), 0);
            cost = costSum > 0 ? String(parseFloat(costSum.toFixed(2))) : '';
            sell = sellSum > 0 ? String(parseFloat(sellSum.toFixed(2))) : '';
            fee = feeSum > 0 ? String(parseFloat(feeSum.toFixed(2))) : '';
            gpm = gpmSum !== 0 ? String(parseFloat(gpmSum.toFixed(2))) : '';
          }
        }
      } catch (e) {}

      const name = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      const tickets = (Number(b.adults) || 0) + (Number(b.children) || 0) + (Number(b.infants) || 0);

      if (useLimitedExport) {
        return [b.addedBy, b.queryId || '', name, pnrs, b.origin || '', b.destination || '', b.departureDate, airlines, supplier, b.queryStatus, b.querySource, tickets, b.partialPayment, cost, sell, fee, gpm, b.currency || 'USD', b.company || ''];
      }
      return [b.addedBy, b.phone, b.email, pnrs, name, b.origin || '', b.destination || '', b.departureDate, airlines, supplier, b.queryStatus, b.querySource, tickets, b.partialPayment, cost, sell, fee, gpm, b.currency || 'USD', b.company || '', b.created, b.modified];
    });

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    
    // Add partial payment recovery summary if filtering partial payments
    let csvContent = csv;
    const partialBookings = filtered.filter(b => b.partialPayment === 'Yes');
    if (partialBookings.length > 0) {
      csvContent += '\n\n"--- PARTIAL PAYMENT RECOVERY SUMMARY ---"\n';
      csvContent += '"Agent","Query ID","Client","Selling Amount","Partial Received","Outstanding (To Recover)"\n';
      
      const agentTotals: Record<string, { sell: number; received: number; outstanding: number }> = {};
      
      partialBookings.forEach(b => {
        let sellTotal = 0;
        try {
          if (b.pnrDetails) {
            const details = JSON.parse(b.pnrDetails);
            sellTotal = details.reduce((sum: number, d: any) => sum + (Number(d.sell) || 0), 0);
          }
        } catch {}
        const received = Number((b as any).partialPaymentReceived) || 0;
        const outstanding = sellTotal - received;
        const agent = b.addedBy || 'Unknown';
        const clientName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
        
        csvContent += `"${agent}","${b.queryId}","${clientName}","${sellTotal.toFixed(2)}","${received.toFixed(2)}","${outstanding.toFixed(2)}"\n`;
        
        if (!agentTotals[agent]) agentTotals[agent] = { sell: 0, received: 0, outstanding: 0 };
        agentTotals[agent].sell += sellTotal;
        agentTotals[agent].received += received;
        agentTotals[agent].outstanding += outstanding;
      });
      
      csvContent += '\n"--- PER AGENT TOTALS ---"\n';
      csvContent += '"Agent","Total Selling","Total Received","Total To Recover"\n';
      let grandSell = 0, grandReceived = 0, grandOutstanding = 0;
      Object.entries(agentTotals).forEach(([agent, totals]) => {
        csvContent += `"${agent}","${totals.sell.toFixed(2)}","${totals.received.toFixed(2)}","${totals.outstanding.toFixed(2)}"\n`;
        grandSell += totals.sell;
        grandReceived += totals.received;
        grandOutstanding += totals.outstanding;
      });
      csvContent += `"GRAND TOTAL","${grandSell.toFixed(2)}","${grandReceived.toFixed(2)}","${grandOutstanding.toFixed(2)}"\n`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = getBookingsExportFilename('csv'); a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const useLimitedExportPdf = isLimitedExportRole && !isFullExportRole;
    
    const limitedHeadersPdf = ['Agent', 'Query ID', 'Client', 'PNR', 'ORIGIN', 'DEST', 'DATE', 'AIRLINES', 'SUPPLIER', 'STATUS', 'SOURCE', 'TKT', 'PARTIAL', 'COST', 'SELL', 'FEE', 'GPM', 'CUR', 'COMPANY'];
    const fullHeaders = ['Added By', 'CTC', 'EMAIL', 'PNR', 'NAME', 'ORIGIN', 'DEST', 'DATE', 'AIRLINES', 'SUPPLIER', 'STATUS', 'SOURCE', 'TKT', 'PARTIAL', 'COST', 'SELL', 'FEE', 'GPM', 'CUR', 'COMPANY'];
    const headers = useLimitedExportPdf ? limitedHeadersPdf : fullHeaders;
    
    const rows = filtered.map(b => {
      let pnrs = b.pnr || '';
      let airlines = '';
      let supplier = '';
      let cost = '';
      let sell = '';
      let fee = '';
      let gpm = '';
      
      try {
        if (b.pnrDetails) {
          const details = JSON.parse(b.pnrDetails);
          if (Array.isArray(details) && details.length > 0) {
            pnrs = details.map((d: any) => d.pnr).filter(Boolean).join(' | ') || b.pnr;
            airlines = details.map((d: any) => d.airline).filter(Boolean).join(' | ');
            supplier = details.map((d: any) => d.supplier).filter(Boolean).join(' | ');
            const costSum = details.reduce((sum: number, d: any) => sum + (Number(d.cost) || 0), 0);
            const sellSum = details.reduce((sum: number, d: any) => sum + (Number(d.sell) || 0), 0);
            const feeSum = details.reduce((sum: number, d: any) => sum + (Number(d.fee) || 0), 0);
            const gpmSum = details.reduce((sum: number, d: any) => sum + (Number(d.gpm) || 0), 0);
            cost = costSum > 0 ? String(parseFloat(costSum.toFixed(2))) : '';
            sell = sellSum > 0 ? String(parseFloat(sellSum.toFixed(2))) : '';
            fee = feeSum > 0 ? String(parseFloat(feeSum.toFixed(2))) : '';
            gpm = gpmSum !== 0 ? String(parseFloat(gpmSum.toFixed(2))) : '';
          }
        }
      } catch (e) {}

      const name = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      const tickets = (Number(b.adults) || 0) + (Number(b.children) || 0) + (Number(b.infants) || 0);

      if (useLimitedExportPdf) {
        return [b.addedBy, b.queryId || '', name, pnrs, b.origin || '', b.destination || '', b.departureDate, airlines, supplier, b.queryStatus, b.querySource, tickets, b.partialPayment, cost, sell, fee, gpm, b.currency || 'USD', b.company || ''];
      }
      return [b.addedBy, b.phone, b.email, pnrs, name, b.origin || '', b.destination || '', b.departureDate, airlines, supplier, b.queryStatus, b.querySource, tickets, b.partialPayment, cost, sell, fee, gpm, b.currency || 'USD', b.company || ''];
    });

    autoTable(doc, {
      head: [headers],
      body: rows,
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [59, 130, 246] },
      margin: { top: 10, right: 5, bottom: 10, left: 5 },
      theme: 'grid'
    });

    // Add partial payment recovery summary page if applicable
    const partialBookingsPdf = filtered.filter(b => b.partialPayment === 'Yes');
    if (partialBookingsPdf.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('PARTIAL PAYMENT RECOVERY SUMMARY', 14, 15);
      doc.setFontSize(8);
      
      const summaryHeaders = ['Agent', 'Query ID', 'Client', 'Selling Amt', 'Received', 'Outstanding'];
      const summaryRows: any[][] = [];
      const agentTotalsPdf: Record<string, { sell: number; received: number; outstanding: number }> = {};
      
      partialBookingsPdf.forEach(b => {
        let sellTotal = 0;
        try {
          if (b.pnrDetails) {
            const details = JSON.parse(b.pnrDetails);
            sellTotal = details.reduce((sum: number, d: any) => sum + (Number(d.sell) || 0), 0);
          }
        } catch {}
        const received = Number((b as any).partialPaymentReceived) || 0;
        const outstanding = sellTotal - received;
        const agent = b.addedBy || 'Unknown';
        const clientName = `${b.firstName || ''} ${b.lastName || ''}`.trim();
        
        summaryRows.push([agent, b.queryId || '', clientName, sellTotal.toFixed(2), received.toFixed(2), outstanding.toFixed(2)]);
        
        if (!agentTotalsPdf[agent]) agentTotalsPdf[agent] = { sell: 0, received: 0, outstanding: 0 };
        agentTotalsPdf[agent].sell += sellTotal;
        agentTotalsPdf[agent].received += received;
        agentTotalsPdf[agent].outstanding += outstanding;
      });
      
      autoTable(doc, {
        head: [summaryHeaders],
        body: summaryRows,
        startY: 20,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [147, 51, 234] },
        margin: { top: 10, right: 5, bottom: 10, left: 5 },
        theme: 'grid'
      });
      
      // Agent totals page
      doc.addPage();
      doc.setFontSize(14);
      doc.text('PER AGENT RECOVERY TOTALS', 14, 15);
      
      const agentHeaders = ['Agent', 'Total Selling', 'Total Received', 'Total To Recover'];
      const agentRows: any[][] = [];
      let grandSellPdf = 0, grandReceivedPdf = 0, grandOutstandingPdf = 0;
      Object.entries(agentTotalsPdf).forEach(([agent, totals]) => {
        agentRows.push([agent, totals.sell.toFixed(2), totals.received.toFixed(2), totals.outstanding.toFixed(2)]);
        grandSellPdf += totals.sell;
        grandReceivedPdf += totals.received;
        grandOutstandingPdf += totals.outstanding;
      });
      agentRows.push(['GRAND TOTAL', grandSellPdf.toFixed(2), grandReceivedPdf.toFixed(2), grandOutstandingPdf.toFixed(2)]);
      
      autoTable(doc, {
        head: [agentHeaders],
        body: agentRows,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [220, 38, 38] },
        margin: { top: 10, right: 5, bottom: 10, left: 5 },
        theme: 'grid'
      });
    }

    doc.save(getBookingsExportFilename('pdf'));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { alert('CSV file is empty or has no data rows'); return; }
        
        // Parse headers
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
        
        // Map CSV headers to booking fields
        const fieldMap: Record<string, string> = {
          'query id': 'queryId', 'queryid': 'queryId',
          'added by': 'addedBy', 'addedby': 'addedBy',
          'first name': 'firstName', 'firstname': 'firstName', 'first': 'firstName',
          'last name': 'lastName', 'lastname': 'lastName', 'last': 'lastName',
          'email': 'email', 'e-mail': 'email',
          'phone': 'phone', 'mobile': 'phone', 'contact': 'phone',
          'origin': 'origin', 'from': 'origin', 'departure city': 'origin',
          'destination': 'destination', 'to': 'destination', 'arrival city': 'destination',
          'departure date': 'departureDate', 'departuredate': 'departureDate', 'depart': 'departureDate',
          'return date': 'returnDate', 'returndate': 'returnDate', 'return': 'returnDate',
          'cabin': 'cabin', 'class': 'cabin',
          'adults': 'adults', 'adult': 'adults',
          'children': 'children', 'child': 'children',
          'infants': 'infants', 'infant': 'infants',
          'query status': 'queryStatus', 'querystatus': 'queryStatus', 'status': 'queryStatus',
          'query source': 'querySource', 'querysource': 'querySource', 'source': 'querySource',
          'partial payment': 'partialPayment', 'partialpayment': 'partialPayment',
          'pnr': 'pnr',
          'remarks': 'remarks', 'notes': 'remarks', 'comment': 'remarks',
          'trip type': 'tripType', 'triptype': 'tripType',
          'currency': 'currency',
        };
        
        const mappedHeaders = headers.map(h => fieldMap[h] || h);
        let importCount = 0;
        
        for (let i = 1; i < lines.length; i++) {
          // Parse CSV row (handle quoted values)
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (const char of lines[i]) {
            if (char === '"') { inQuotes = !inQuotes; continue; }
            if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
            current += char;
          }
          values.push(current.trim());
          
          const row: any = {};
          mappedHeaders.forEach((field, idx) => {
            if (values[idx] !== undefined) row[field] = values[idx];
          });
          
          // Build booking from parsed row
          const booking = {
            addedBy: row.addedBy || currentUser?.name || 'Admin',
            firstName: row.firstName || '',
            lastName: row.lastName || '',
            email: row.email || '',
            phone: row.phone || '',
            origin: row.origin || '',
            destination: row.destination || '',
            departureDate: row.departureDate || '',
            returnDate: row.returnDate || '',
            cabin: row.cabin || 'Economy',
            adults: Number(row.adults) || 1,
            children: Number(row.children) || 0,
            infants: Number(row.infants) || 0,
            queryStatus: row.queryStatus || 'Follow Up',
            querySource: row.querySource || 'Import',
            remarks: row.remarks ? JSON.stringify([{ text: row.remarks, addedBy: 'Import', date: formatLogDateTime() }]) : '[]',
            partialPayment: row.partialPayment || 'No',
            tripType: row.tripType || 'One Way',
            currency: row.currency || 'CAD',
            pnr: row.pnr || '',
            pnrDetails: '[]',
            images: '',
            company: row.company || (activeCompany === 'LBT' ? 'Look Book Ticket' : activeCompany === 'travelo' ? 'Traveloboom' : 'Get Set Flight')
          };
          
          if (booking.firstName || booking.email) {
            await addBooking(booking);
            importCount++;
          }
        }
        
        addNotification({ title: 'Import Complete', message: `Successfully imported ${importCount} bookings from ${file.name}`, type: 'success' });
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetFilters = () => {
    setFilters({
      queryId: '', firstName: '', lastName: '', email: '', phone: '', countryCode: '+1',
      origin: '', destination: '', partialPayment: '',
      fromDate: '', toDate: '', querySource: '', pnr: ''
    });
    setSelectedStatuses([]);
    setSelectedAgents([]);
    setSelectedSupplier('');
    setCurrentPage(1);
    setOldCRMPage(1);
    // Also clear persisted filters
    clearPageFilters('bookings');
  };

  const openView = (b: any) => {
    setViewBooking(b);
    setVerificationData([]); // Reset, will auto-load
    // Auto-load verification data when viewing
    loadVerificationData(b.id);
    // Initialize QC PNR details when viewing a QC booking
    try {
      if (b.pnrDetails) {
        const parsed = JSON.parse(b.pnrDetails);
        setQcPnrDetails(parsed.map((p: any) => ({
          pnr: p.pnr || '', firstName: p.firstName || '', lastName: p.lastName || '',
          airline: p.airline || '', supplier: p.supplier || '', paymentMethod: p.paymentMethod || '', cost: p.cost || 0, sell: p.sell || 0,
          fee: p.fee || 0, mco: p.mco || 0, gpm: p.gpm || 0
        })));
      } else {
        setQcPnrDetails([{ pnr: '', firstName: '', lastName: '', airline: '', supplier: '', paymentMethod: '', cost: 0, sell: 0, fee: 0, mco: 0, gpm: 0 }]);
      }
    } catch {
      setQcPnrDetails([{ pnr: '', firstName: '', lastName: '', airline: '', supplier: '', cost: 0, sell: 0, fee: 0, mco: 0, gpm: 0 }]);
    }
  };

  // Client Verification Functions
  const generateVerificationLink = async () => {
    if (!viewBooking) return;
    setVerifyLoading(true);
    try {
      const res = await client.api.fetch('/api/public/verification/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: viewBooking.id,
          queryId: viewBooking.queryId,
          clientName: `${viewBooking.firstName || ''} ${viewBooking.lastName || ''}`.trim(),
          clientEmail: viewBooking.email || '',
          company: viewBooking.company || activeCompany || 'Get Set Flight',
        }),
      });
      const data = await res.json() as any;
      if (data.success) {
        const link = `${window.location.origin}/verify/${data.token}`;
        setVerifyLink(link);
        setVerifyModal(true);
        setVerifySendStatus('idle');
      } else {
        addNotification({ title: 'Error', message: data.error || 'Failed to generate link', type: 'error' });
      }
    } catch (err: any) {
      addNotification({ title: 'Error', message: 'Failed to generate verification link', type: 'error' });
    }
    setVerifyLoading(false);
  };

  const copyVerificationLink = () => {
    if (verifyLink) {
      navigator.clipboard.writeText(verifyLink);
      setVerifyCopied(true);
      setTimeout(() => setVerifyCopied(false), 2000);
    }
  };

  const loadVerificationData = async (bookingId: number) => {
    try {
      const res = await client.api.fetch(`/api/public/verification/booking/${bookingId}`);
      const data = await res.json() as any;
      if (data.success) {
        setVerificationData(data.data || []);
        // Show inline in view modal, not a separate modal
      }
    } catch {}
  };

  const handleVerificationReview = async (verificationId: number, status: 'approved' | 'rejected') => {
    try {
      let rejectionReason = '';
      if (status === 'rejected') {
        rejectionReason = prompt('Enter rejection reason (optional):') || '';
      }
      await client.api.fetch(`/api/public/verification/${verificationId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus: status,
          reviewedBy: currentUser?.name || 'Admin',
          rejectionReason,
        }),
      });
      addNotification({ title: `Verification ${status === 'approved' ? 'Approved ✓' : 'Rejected ✗'}`, message: `Client verification has been ${status}. Email notification sent to client.`, type: status === 'approved' ? 'success' : 'info' });
      if (viewBooking) loadVerificationData(viewBooking.id);
    } catch {
      addNotification({ title: 'Error', message: 'Failed to update verification', type: 'error' });
    }
  };


  const openAdd = () => {
    // Mark as internal navigation so filters restore when coming back
    sessionStorage.setItem('crm_bookings_internal_nav', 'true');
    navigate('/bookings/add');
  };

  const buildMailtoLink = (booking: any) => {
    const { activeCompany } = useAuthStore.getState();
    const companyId = activeCompany || 'GSF';
    const companyNames: Record<string, { name: string; website: string; email: string }> = {
      fdi: { name: 'Get Set Flight', website: 'www.getsetflight.com', email: 'info@getsetflight.com' },
      emt: { name: 'Look Book Ticket', website: 'www.lookbookticket.com', email: 'info@lookbookticket.com' },
      travelo: { name: 'Traveloboom', website: 'www.Traveloboom.com', email: 'info@Traveloboom.com' },
    };
    const c = companyNames[companyId] || companyNames.fdi;
    const name = `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
    const from = booking.origin || '';
    const to = booking.destination || '';
    const subject = `${c.name} — Your Flight ${from} → ${to} — Update`;
    const body = `Dear ${name},\n\nRegarding your booking (${booking.queryId || ''}) — ${from} → ${to}.\n\nStatus: ${booking.queryStatus || ''}\n\nBest Regards,\n${c.name} Team\n${c.website}\n${c.email}`;
    return `mailto:${booking.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const sendEmailForBooking = async (booking: any, toastMessage?: string) => {
    if (!booking?.email) {
      addNotification({ title: 'No Email', message: 'This booking has no email address', type: 'info' });
      return;
    }
    // Always compute mailto link
    const mLink = buildMailtoLink(booking);
    setMailtoLink(mLink);
    setEmailStatus('sending');
    setEmailErrorMsg('');
    try {
      const res = await client.api.fetch('/api/public/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: booking.email,
          bookingData: booking,
          status: booking.queryStatus || 'Sold',
          company: activeCompany || booking.company || 'Get Set Flight'
        })
      });
      let result: any = {};
      try { result = await res.json(); } catch {}
      if (result.success) {
        setEmailStatus('success');
        addNotification({ 
          title: '✅ Email Sent', 
          message: toastMessage || (booking.queryStatus === 'Hold' ? `Hold reservation email sent to ${booking.email}` : `Confirmed ticket details sent to ${booking.email}`), 
          type: 'success' 
        });
        setTimeout(() => setEmailStatus('idle'), 4000);
      } else {
        // API failed - show exact error + mailto option
        setEmailStatus('failed');
        const errMsg = result.resendError?.message || result.error || result.message || 'Auto-send failed';
        setEmailErrorMsg(errMsg);
        addNotification({ 
          title: '📧 Email send failed', 
          message: `Reason: ${errMsg}. Use "Open Email App" to send manually.`,
          type: 'warning' 
        });
      }
    } catch (err: any) {
      setEmailStatus('failed');
      setEmailErrorMsg('Network error — cannot reach mail server. Use "Open Email App" instead.');
      addNotification({ 
        title: '📧 Use Email Client', 
        message: 'Click "Open Email App" to send the email with your email client.', 
        type: 'info' 
      });
    }
  };

  const openEdit = (b: typeof bookings[0]) => {
    // Mark as internal navigation so filters restore when coming back
    sessionStorage.setItem('crm_bookings_internal_nav', 'true');
    navigate(`/bookings/edit/${b.id}`);
  };

  const handlePnrDetailChange = (index: number, field: keyof PnrDetail, value: any) => {
    const newDetails = [...pnrDetails];
    const updatedDetail = { ...newDetails[index], [field]: value };
    
    // Calculate GPM automatically: sell - cost - fee - mco
    if (['sell', 'cost', 'fee', 'mco'].includes(field as string)) {
      const sell = field === 'sell' ? Number(value) : (updatedDetail.sell || 0);
      const cost = field === 'cost' ? Number(value) : (updatedDetail.cost || 0);
      const fee = field === 'fee' ? Number(value) : (updatedDetail.fee || 0);
      const mco = field === 'mco' ? Number(value) : (updatedDetail.mco || 0);
      updatedDetail.gpm = parseFloat((sell - cost - fee - mco).toFixed(2));
    }
    
    newDetails[index] = updatedDetail;
    setPnrDetails(newDetails);
  };

  const addPnrRow = () => {
    setPnrDetails([...pnrDetails, { pnr: '', firstName: '', lastName: '', airline: '', cost: '' as any, sell: '' as any, fee: '' as any, mco: '' as any, gpm: '' as any }]);
  };

  const removePnrRow = (index: number) => {
    const newDetails = pnrDetails.filter((_, i) => i !== index);
    setPnrDetails(newDetails.length ? newDetails : [{ pnr: '', firstName: '', lastName: '', airline: '', cost: '' as any, sell: '' as any, fee: '' as any, mco: '' as any, gpm: '' as any }]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newImages = [...images];
      for (let i = 0; i < files.length; i++) {
        // Use uploadImage which compresses automatically
        const path = await uploadImage(files[i]);
        newImages.push(path);
      }
      setImages(newImages);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handlePreviewImage = async (imgPath: string) => {
    if (imgPath.startsWith('http')) {
      setPreviewImage(imgPath);
    } else if (resolvedImages[imgPath]) {
      setPreviewImage(resolvedImages[imgPath]);
    } else {
      const url = await getImageUrl(imgPath);
      if (url) {
        setResolvedImages(prev => ({ ...prev, [imgPath]: url }));
        setPreviewImage(url);
      }
    }
  };

  const addRemark = () => {
    if (!newRemark.trim()) return;
    const entry: RemarkEntry = {
      text: newRemark.trim(),
      addedBy: currentUser?.name || 'Admin',
      date: formatLogDateTime()
    };
    setRemarksList([...remarksList, entry]);
    setNewRemark('');
  };

  const handleSave = async () => {
    // Inline validation with red field highlighting
    const errors: Record<string, boolean> = {};
    if (!form.firstName) errors.firstName = true;
    // lastName is NOT mandatory
    if (!form.email) errors.email = true;
    if (!form.phone) errors.phone = true;
    if (!form.origin) errors.origin = true;
    if (!form.destination) errors.destination = true;
    if (!form.departureDate) errors.departureDate = true;
    if (!form.queryStatus) errors.queryStatus = true;
    if (!form.querySource) errors.querySource = true;
    if (!form.cabin) errors.cabin = true;
    if (remarksList.length === 0 && !newRemark.trim()) errors.remarks = true;
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error
      const firstErrorField = document.querySelector('.field-error');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFormErrors({});

    // Add pending remark if any
    let finalRemarks = [...remarksList];
    if (newRemark.trim()) {
      finalRemarks.push({ text: newRemark.trim(), addedBy: currentUser?.name || 'Admin', date: formatLogDateTime() });
    }

    const validPnrs = pnrDetails.filter(p => p.pnr.trim() !== '');
    const pnrRegex = /^[A-Z0-9]{6}$/;
    
    const currentStatus = form.queryStatus?.trim() || '';
    const needsPnr = ['Date Change', 'Send to QC', 'Cancellation', 'Sold', 'Hold'].some(s => currentStatus.includes(s));
    const needsImage = ['Date Change', 'Send to QC', 'Cancellation', 'Sold'].some(s => currentStatus.includes(s));

    if (needsPnr) {
      if (validPnrs.length === 0) {
        alert(`PNR is required for status: ${form.queryStatus}`);
        return;
      }
      for (const p of validPnrs) {
        if (!pnrRegex.test(p.pnr)) {
          alert(`Invalid PNR: ${p.pnr}. Must be exactly 6 uppercase alphanumeric characters.`);
          return;
        }
      }
    }

    if (needsImage && images.length === 0) {
      alert(`Image is required for status: ${form.queryStatus}`);
      return;
    }

    // Build booking data - ONLY include fields that exist in DB schema (no countryCode)
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
      partialPaymentAmount: (form as any).partialPaymentAmount || '',
      receivedAmount: (form as any).receivedAmount || '',
      partialPaymentDueDate: (form as any).partialPaymentDueDate || '',
      tripType: form.tripType,
      currency: form.currency,
      remarks: JSON.stringify(finalRemarks),
      pnr: validPnrs.map(p => p.pnr).join(','),
      pnrDetails: JSON.stringify(pnrDetails.map(p => ({
        ...p,
        cost: Number(p.cost) || 0,
        sell: Number(p.sell) || 0,
        fee: Number(p.fee) || 0,
        mco: Number(p.mco) || 0,
        gpm: parseFloat((Number(p.gpm) || 0).toFixed(2))
      }))),
      images: images.join(',')
    };

    // Add modification history entry for edits
    if (editId) {
      const existingBooking = bookings.find(b => b.id === editId);
      if (existingBooking) {
        let modHistory: any[] = [];
        try { modHistory = JSON.parse((existingBooking as any).modificationHistory || '[]'); } catch {}
        const changes: string[] = [];
        if (existingBooking.queryStatus !== form.queryStatus) changes.push(`Status: ${existingBooking.queryStatus} → ${form.queryStatus}`);
        if (existingBooking.firstName !== form.firstName) changes.push(`First Name: ${existingBooking.firstName} → ${form.firstName}`);
        if (existingBooking.lastName !== form.lastName) changes.push(`Last Name: ${existingBooking.lastName} → ${form.lastName}`);
        if ((existingBooking as any).receivedAmount !== (form as any).receivedAmount) changes.push(`Received Amount: ${(existingBooking as any).receivedAmount || '0'} → ${(form as any).receivedAmount || '0'}`);
        if ((existingBooking as any).partialPaymentAmount !== (form as any).partialPaymentAmount) changes.push(`Total Amount: ${(existingBooking as any).partialPaymentAmount || '0'} → ${(form as any).partialPaymentAmount || '0'}`);
        if (changes.length > 0) {
          modHistory.push({
            action: 'Booking Modified',
            modifiedBy: currentUser?.name || 'Unknown',
            modifiedAt: formatLogDateTime(),
            oldStatus: existingBooking.queryStatus,
            newStatus: form.queryStatus,
            changes: changes,
            note: changes.join('; ')
          });
          (bookingData as any).modificationHistory = JSON.stringify(modHistory);
        }
      }
    }

    try {
      if (editId) {
        await updateBooking(editId, bookingData);
      } else {
        await addBooking(bookingData);
      }
      
      // Refresh data from server to ensure dashboard + bookings list are up to date
      await fetchData();
      
      if (form.queryStatus === 'Send to QC') {
        addNotification({ title: 'Sent to QC', message: `Booking for ${form.firstName} ${form.lastName} sent to QC successfully`, type: 'info' });
      } else {
        addNotification({ title: editId ? 'Booking Updated' : 'Booking Created', message: `Booking for ${form.firstName} ${form.lastName} ${editId ? 'updated' : 'created'} successfully`, type: 'success' });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Failed to save booking:', err);
      alert(`Failed to save booking: ${err?.message || 'Unknown error. Please try again.'}`);
    }
  };

  const handleQCAction = async (action: 'Accept' | 'Reject') => {
    if (!viewBooking) return;
    const newStatus = action === 'Accept' ? 'Sold' : 'Follow Up';
    const reviewerName = currentUser?.name || 'Supervisor';
    const remarkText = action === 'Accept' ? `QC Accepted by ${reviewerName}` : `QC Rejected by ${reviewerName} - Please check and correct`;
    
    let currentRemarks = [];
    try {
      currentRemarks = JSON.parse(viewBooking.remarks || '[]');
    } catch {
      currentRemarks = viewBooking.remarks ? [{ text: viewBooking.remarks, addedBy: viewBooking.addedBy, date: viewBooking.created }] : [];
    }
    
    currentRemarks.push({
      text: remarkText,
      addedBy: reviewerName,
      date: formatLogDateTime()
    });

    // Build modification history entry
    let modHistory: any[] = [];
    try { modHistory = JSON.parse((viewBooking as any).modificationHistory || '[]'); } catch {}
    const oldPnrDetails = viewBooking.pnrDetails ? JSON.parse(viewBooking.pnrDetails) : [];
    modHistory.push({
      action: action === 'Accept' ? 'QC Accepted' : 'QC Rejected',
      modifiedBy: reviewerName,
      modifiedAt: formatLogDateTime(),
      oldStatus: viewBooking.queryStatus,
      newStatus: newStatus,
      oldPnrDetails: JSON.stringify(oldPnrDetails),
      newPnrDetails: JSON.stringify(qcPnrDetails),
      note: remarkText
    });

    await updateBooking(viewBooking.id, {
      queryStatus: newStatus,
      remarks: JSON.stringify(currentRemarks),
      qcReviewedBy: reviewerName,
      qcReviewedAt: formatLogDateTime(),
      modificationHistory: JSON.stringify(modHistory),
      pnrDetails: JSON.stringify(qcPnrDetails.map(p => ({
        ...p, cost: Number(p.cost) || 0, sell: Number(p.sell) || 0,
        fee: Number(p.fee) || 0, mco: Number(p.mco) || 0, gpm: Number(p.gpm) || 0
      })))
    });
    
    addNotification({ title: `QC ${action}ed`, message: `Booking ${viewBooking.queryId} has been ${action.toLowerCase()}ed by ${reviewerName}.`, type: action === 'Accept' ? 'success' : 'info' });
    setViewBooking(null);
    // Refresh all data so the list, dashboard, and status counts are up to date
    await fetchData();
  };

  // Only show agent-role users in the All Agents dropdown (exclude Admin, HR, IT, etc.)
  const AGENT_ONLY_ROLES = ['Agent', 'Supervisor'];
  // Filter agents by active company
  const baseAgentNames = [...new Set(
    users
      .filter(u => {
        if (!AGENT_ONLY_ROLES.includes(u.role)) return false;
        if (!u.company) return activeCompany === 'GSF';
        if (activeCompany === 'GSF') return u.company === 'Get Set Flight';
        if (activeCompany === 'LBT') return u.company === 'Look Book Ticket';
        if (activeCompany === 'travelo') return u.company === 'Traveloboom' || u.company === 'Traveloboom';
        return false;
      })
      .map(u => u.name)
  )];

  // When old CRM is shown, merge old CRM unique agents, statuses, and sources into dropdown options
  const oldCRMAgentNames = useMemo(() => {
    if (!showOldCRM || oldCRMData.length === 0) return [];
    return [...new Set(oldCRMData.map((b: any) => b.addedBy).filter(Boolean))];
  }, [showOldCRM, oldCRMData]);

  const oldCRMStatuses = useMemo(() => {
    if (!showOldCRM || oldCRMData.length === 0) return [];
    return [...new Set(oldCRMData.map((b: any) => b.queryStatus).filter(Boolean))];
  }, [showOldCRM, oldCRMData]);

  const oldCRMSources = useMemo(() => {
    if (!showOldCRM || oldCRMData.length === 0) return [];
    return [...new Set(oldCRMData.map((b: any) => b.querySource).filter(Boolean))];
  }, [showOldCRM, oldCRMData]);

  const agentNames = useMemo(() => {
    const merged = [...new Set([...baseAgentNames, ...oldCRMAgentNames])];
    return merged.sort((a, b) => a.localeCompare(b));
  }, [baseAgentNames, oldCRMAgentNames]);

  const statusOptions = useMemo(() => {
    const merged = [...new Set([...QUERY_STATUSES, ...oldCRMStatuses])];
    return merged;
  }, [oldCRMStatuses]);

  const sourceOptions = useMemo(() => {
    const merged = [...new Set([...QUERY_SOURCES, ...oldCRMSources])];
    return merged;
  }, [oldCRMSources]);

  const currentStatus = form.queryStatus?.trim() || '';
  const showPnrSection = ['Date Change', 'Send to QC', 'Cancellation', 'Sold', 'Hold', 'Variance'].some(s => currentStatus.includes(s));
  const showImageSection = ['Date Change', 'Send to QC', 'Cancellation', 'Sold'].some(s => currentStatus.includes(s));
  
  // Check if current user can edit this booking
  // Use originalQueryStatus (the saved DB status) so agents can still CHANGE TO locked statuses and save
  const isAgent = currentUser?.role === 'Agent';
  const isLockedForAgent = isAgent && ['Send to QC', 'Sold', 'Date Change', 'Schedule Change', 'Variance'].includes(originalQueryStatus);
  const canEditBooking = !isLockedForAgent;
  const isSupervisor = ['Supervisor', 'Manager', 'Admin', 'Operation Manager'].includes(userRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Go Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Bookings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage flight bookings and queries</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canExport && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex items-center gap-2">
                <Upload size={16} /> Import
              </button>
              <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
                <Download size={16} /> CSV
              </button>
              <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
                <Printer size={16} /> PDF
              </button>
            </>
          )}
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Booking
          </button>
        </div>
      </div>

      {/* Data Source Toggle: New CRM / Old CRM */}
      <div className="flex items-center gap-2">
        <button onClick={() => { setShowOldCRM(false); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!showOldCRM ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          CRM Data
        </button>
        <button onClick={() => { setShowOldCRM(true); loadOldCRMData(); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${showOldCRM ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Old CRM Data {oldCRMData.length > 0 ? `(${oldCRMData.length})` : ''}
        </button>
        {showOldCRM && oldCRMLoading && <span className="text-sm text-gray-500 animate-pulse">Loading...</span>}
        {/* Agent toggle: My Bookings vs All Bookings */}
        {/* Agents only see My Bookings - no All Bookings toggle */}
      </div>

      {/* Bulk Delete Bar - only Admin, HR, IT can see */}
      {selectedIds.size > 0 && (['Admin', 'HR (Human Resource)', 'IT', 'IT (Information Tech)'].includes(currentUser?.role || '')) && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-red-700">{selectedIds.size} booking{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Deselect All</button>
            <button onClick={() => { const allIds = new Set(filtered.map(b => b.id)); setSelectedIds(allIds); }} className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">Select All ({filtered.length})</button>
            <button onClick={() => setConfirmBulkDelete(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors">
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-[100] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Check size={18} />
          <span>Booking saved successfully!</span>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Filters</span>
            {(Object.entries(filters).filter(([k, v]) => v && k !== 'countryCode').length + selectedStatuses.length + selectedAgents.length) > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {Object.entries(filters).filter(([k, v]) => v && k !== 'countryCode').length + (selectedStatuses.length > 0 ? 1 : 0) + (selectedAgents.length > 0 ? 1 : 0) + (selectedSupplier ? 1 : 0)} active
              </span>
            )}
            <span className="text-xs text-gray-400">({showOldCRM ? filteredOldCRMData.length : filtered.length} results)</span>
          </div>
          <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded">
            <RotateCcw size={12} /> Clear All
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <input placeholder="Query ID" value={filters.queryId} onChange={(e) => setFilters(f => ({ ...f, queryId: e.target.value }))} className="input-field text-sm py-2" />
          <input placeholder="First Name" value={filters.firstName} onChange={(e) => setFilters(f => ({ ...f, firstName: e.target.value }))} className="input-field text-sm py-2" />
          <input placeholder="Last Name" value={filters.lastName} onChange={(e) => setFilters(f => ({ ...f, lastName: e.target.value }))} className="input-field text-sm py-2" />
          <input placeholder="Email" value={filters.email} onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))} className="input-field text-sm py-2" />
          <input placeholder="Phone" value={filters.phone} onChange={(e) => setFilters(f => ({ ...f, phone: e.target.value }))} className="input-field text-sm py-2" />
          <input placeholder="Origin (IATA/City)" value={filters.origin} onChange={(e) => setFilters(f => ({ ...f, origin: e.target.value }))} className="input-field text-sm py-2" />
          <input placeholder="Destination (IATA/City)" value={filters.destination} onChange={(e) => setFilters(f => ({ ...f, destination: e.target.value }))} className="input-field text-sm py-2" />
          <input placeholder="PNR" value={filters.pnr} onChange={(e) => setFilters(f => ({ ...f, pnr: e.target.value.toUpperCase() }))} className="input-field text-sm py-2 uppercase" />
          
          <MultiSelectDropdown label="All Statuses" options={statusOptions} selected={selectedStatuses} onChange={setSelectedStatuses} />

          <select value={filters.querySource} onChange={(e) => setFilters(f => ({ ...f, querySource: e.target.value }))} className="select-field text-sm py-2">
            <option value="">All Sources</option>
            {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <MultiSelectDropdown label="All Agents" options={agentNames} selected={selectedAgents} onChange={setSelectedAgents} />

          <select value={filters.partialPayment} onChange={(e) => setFilters(f => ({ ...f, partialPayment: e.target.value }))} className="select-field text-sm py-2">
            <option value="">Payment Status</option>
            <option value="Yes">Partial Payment: Yes</option>
            <option value="No">Partial Payment: No</option>
          </select>

          {isSupervisor && (
            <select value={selectedSupplier} onChange={(e) => { setSelectedSupplier(e.target.value); setCurrentPage(1); }} className="select-field text-sm py-2">
              <option value="">All Suppliers</option>
              {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-field text-sm py-2">
            <option value="id_desc">Newest First</option>
            <option value="id_asc">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>
        {/* Date range row */}
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs text-gray-500 font-medium">Date Range:</label>
          <input type="date" value={filters.fromDate} onChange={(e) => setFilters(f => ({ ...f, fromDate: e.target.value }))} className="input-field text-sm py-1.5 w-auto" />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={filters.toDate} onChange={(e) => setFilters(f => ({ ...f, toDate: e.target.value }))} className="input-field text-sm py-1.5 w-auto" />
          {(filters.fromDate || filters.toDate) && (
            <button onClick={() => setFilters(f => ({ ...f, fromDate: '', toDate: '' }))} className="text-xs text-red-500 hover:underline">Clear dates</button>
          )}
        </div>
        {/* Active filter tags */}
        {(Object.entries(filters).filter(([k, v]) => v && k !== 'countryCode' && k !== 'fromDate' && k !== 'toDate').length > 0 || selectedStatuses.length > 0 || selectedAgents.length > 0 || selectedSupplier) && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(filters).filter(([k, v]) => v && k !== 'countryCode' && k !== 'fromDate' && k !== 'toDate').map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-100">
                <span className="font-medium capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(v)}
                <button onClick={() => setFilters(f => ({ ...f, [k]: '' }))} className="ml-0.5 hover:text-red-600 font-bold">×</button>
              </span>
            ))}
            {selectedStatuses.map(s => (
              <span key={`status-${s}`} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full border border-green-100">
                <span className="font-medium">Status:</span> {s}
                <button onClick={() => setSelectedStatuses(prev => prev.filter(v => v !== s))} className="ml-0.5 hover:text-red-600 font-bold">×</button>
              </span>
            ))}
            {selectedAgents.map(a => (
              <span key={`agent-${a}`} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full border border-purple-100">
                <span className="font-medium">Agent:</span> {a}
                <button onClick={() => setSelectedAgents(prev => prev.filter(v => v !== a))} className="ml-0.5 hover:text-red-600 font-bold">×</button>
              </span>
            ))}
            {selectedSupplier && (
              <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-full border border-orange-100">
                <span className="font-medium">Supplier:</span> {selectedSupplier}
                <button onClick={() => setSelectedSupplier('')} className="ml-0.5 hover:text-red-600 font-bold">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Old CRM Data Table */}
      {showOldCRM && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <h3 className="font-bold text-gray-800">Old CRM Data ({filteredOldCRMData.length} records)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Imported historical booking data</p>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full whitespace-nowrap text-sm border-collapse border border-gray-200">
              <thead className="bg-gray-50 sticky top-0 border-b-2 border-gray-300">
                <tr>
                  <th className="table-header">#</th>
                  <th className="table-header">Agent</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Route</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Airlines</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">PNR</th>
                  <th className="table-header">Source</th>
                  <th className="table-header">Cost</th>
                  <th className="table-header">Sell</th>
                  <th className="table-header">MCO</th>
                  <th className="table-header">GPM</th>
                </tr>
              </thead>
              <tbody>
                {filteredOldCRMData.length === 0 ? (
                  <tr><td colSpan={15} className="p-8 text-center text-gray-400">{oldCRMLoading ? 'Loading old CRM data...' : 'No matching records found. Try adjusting your filters.'}</td></tr>
                ) : filteredOldCRMData.slice((oldCRMPage - 1) * oldCRMPerPage, oldCRMPage * oldCRMPerPage).map((b: any, idx: number) => {
                  let p: any = {};
                  try { const pnrs = JSON.parse(b.pnrDetails || '[]'); p = pnrs[0] || {}; } catch { p = {}; }
                  return (
                    <tr key={b.id || idx} className="hover:bg-amber-50/30 transition-colors">
                      <td className="table-cell text-xs text-gray-400">{(oldCRMPage - 1) * oldCRMPerPage + idx + 1}</td>
                      <td className="table-cell text-xs font-medium">{b.addedBy || '-'}</td>
                      <td className="table-cell text-xs">{b.firstName} {b.lastName}</td>
                      <td className="table-cell text-xs text-gray-600 max-w-[150px] truncate" title={b.email || ''}>{b.email || '-'}</td>
                      <td className="table-cell text-xs text-gray-600">{b.phone || '-'}</td>
                      <td className="table-cell text-xs font-semibold text-blue-700">{b.origin} → {b.destination}</td>
                      <td className="table-cell text-xs">{b.departureDate || '-'}</td>
                      <td className="table-cell text-xs">{b.airline || '-'}</td>
                      <td className="table-cell"><span className="badge bg-gray-100 text-gray-700 text-xs">{b.queryStatus || '-'}</span></td>
                      <td className="table-cell text-xs font-mono uppercase">{b.pnr || '-'}</td>
                      <td className="table-cell text-xs">{b.querySource || '-'}</td>
                      <td className="table-cell text-xs font-medium">{p.cost && p.cost !== '0' ? p.cost : '-'}</td>
                      <td className="table-cell text-xs font-medium text-blue-600">{p.sell && p.sell !== '0' ? p.sell : '-'}</td>
                      <td className="table-cell text-xs">{p.mco && p.mco !== '0' ? p.mco : '-'}</td>
                      <td className="table-cell text-xs font-semibold text-emerald-700">{p.gpm && p.gpm !== '0' ? p.gpm : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {oldCRMData.length > 0 && (
            <Pagination totalItems={filteredOldCRMData.length} currentPage={oldCRMPage} perPage={oldCRMPerPage} onPageChange={setOldCRMPage} onPerPageChange={(pp: number) => { setOldCRMPerPage(pp); setOldCRMPage(1); }} />
          )}
        </div>
      )}

      {/* Table */}
      {!showOldCRM && (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="table-header w-10">
                  <button
                    onClick={() => {
                      const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
                      const allSelected = pageItems.every(b => selectedIds.has(b.id));
                      const newSet = new Set(selectedIds);
                      if (allSelected) {
                        pageItems.forEach(b => newSet.delete(b.id));
                      } else {
                        pageItems.forEach(b => newSet.add(b.id));
                      }
                      setSelectedIds(newSet);
                    }}
                    className="p-0.5 hover:bg-blue-50 rounded transition-colors"
                    title={selectedIds.size > 0 ? 'Deselect all' : 'Select all'}
                  >
                    {(() => {
                      const pageItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
                      const allSelected = pageItems.length > 0 && pageItems.every(b => selectedIds.has(b.id));
                      const someSelected = pageItems.some(b => selectedIds.has(b.id));
                      if (allSelected) return <CheckSquare size={16} className="text-blue-600" />;
                      if (someSelected) return <MinusSquare size={16} className="text-blue-400" />;
                      return <Square size={16} className="text-gray-400" />;
                    })()}
                  </button>
                </th>
                <th className="table-header">Query ID</th>
                <th className="table-header">Added By</th>
                <th className="table-header">Name</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Route</th>
                <th className="table-header">Dates</th>
                <th className="table-header">Pax</th>
                <th className="table-header">Status</th>
                <th className="table-header">Source</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Received</th>
                <th className="table-header">Pending</th>
                <th className="table-header">PNR</th>
                <th className="table-header">Created</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={16} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={40} className="text-gray-300" />
                      <p className="text-gray-500 font-medium">No bookings found</p>
                      <p className="text-gray-400 text-sm">The data you searched for doesn't exist in the CRM. Try adjusting your search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.slice((currentPage - 1) * perPage, currentPage * perPage).map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50 group">
                  <td className="table-cell w-10">
                    <button
                      onClick={() => {
                        const newSet = new Set(selectedIds);
                        if (newSet.has(b.id)) newSet.delete(b.id);
                        else newSet.add(b.id);
                        setSelectedIds(newSet);
                      }}
                      className="p-0.5 hover:bg-blue-50 rounded transition-colors"
                    >
                      {selectedIds.has(b.id) ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-gray-300" />}
                    </button>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => openView(b)}>{b.queryId}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openView(b)} className="p-1 text-gray-400 hover:text-blue-600" title="View Details"><Eye size={14} /></button>
                        <button onClick={() => openEdit(b)} className="p-1 text-gray-400 hover:text-blue-600" title="Edit"><Edit2 size={14} /></button>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-xs">{b.addedBy}</td>
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{b.firstName} {b.lastName}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-xs">{b.email}</div>
                    <div className="text-xs text-gray-500">{b.phone}</div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-bold text-blue-700">{getIata(b.origin)}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-bold text-blue-700">{getIata(b.destination)}</span>
                    </div>
                    <div className="text-xs text-gray-500">{b.cabin}</div>
                  </td>
                  <td className="table-cell text-xs">
                    <div>Dep: {formatDateDMY(b.departureDate)}</div>
                    {b.returnDate && <div>Ret: {formatDateDMY(b.returnDate)}</div>}
                  </td>
                  <td className="table-cell text-xs">
                    {b.adults}A, {b.children}C, {b.infants}I
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${
                      b.queryStatus === 'Sold' ? 'bg-green-100 text-green-700' :
                      b.queryStatus === 'Hold' ? 'bg-yellow-100 text-yellow-700' :
                      b.queryStatus === 'Cancellation' ? 'bg-red-100 text-red-700' :
                      b.queryStatus === 'Variance' ? 'bg-indigo-100 text-indigo-700' :
                      b.queryStatus === 'Follow Up' ? 'bg-blue-100 text-blue-700' :
                      b.queryStatus === 'Send to QC' ? 'bg-cyan-100 text-cyan-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {b.queryStatus}
                    </span>
                  </td>
                  <td className="table-cell text-xs">{b.querySource}</td>
                  <td className="table-cell">
                    <span className={`badge ${b.partialPayment === 'Yes' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.partialPayment === 'Yes' ? 'Partial' : 'No'}
                    </span>
                    {b.partialPayment === 'Yes' && (b as any).partialPaymentDueDate && (
                      <span className="block text-[10px] text-orange-600 mt-0.5">Due: {(b as any).partialPaymentDueDate}</span>
                    )}
                    {b.partialPayment === 'Yes' && (b as any).partialPaymentCleared && (
                      <span className="block text-[10px] text-green-600 mt-0.5">✓ Cleared</span>
                    )}
                  </td>
                  <td className="table-cell text-xs">
                    {b.partialPayment === 'Yes' ? (
                      <span className="font-semibold text-green-700">{(b as any).receivedAmount || (b as any).partialPaymentReceived || '0'}</span>
                    ) : '-'}
                  </td>
                  <td className="table-cell text-xs">
                    {b.partialPayment === 'Yes' ? (
                      <span className="font-semibold text-red-600">{(() => { const total = Number((b as any).partialPaymentAmount) || 0; const received = Number((b as any).receivedAmount || (b as any).partialPaymentReceived) || 0; return total - received > 0 ? (total - received).toFixed(2) : '0'; })()}</span>
                    ) : '-'}
                  </td>
                  <td className="table-cell font-mono text-xs max-w-[100px] truncate uppercase" title={b.pnr}>{b.pnr || '-'}</td>
                  <td className="table-cell text-xs text-gray-500">{formatDateDMY(b.created)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openView(b)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      {(['Admin', 'HR (Human Resource)', 'IT', 'IT (Information Tech)'].includes(currentUser?.role || '')) && (
                      <button onClick={() => setConfirmDeleteId(b.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Delete">
                        <Trash2 size={16} />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Pagination */}
      {!showOldCRM && (
      <Pagination
        totalItems={filtered.length}
        currentPage={currentPage}
        perPage={perPage}
        onPageChange={setCurrentPage}
        onPerPageChange={(pp) => { setPerPage(pp); setCurrentPage(1); }}
      />
      )}

      {/* Bulk Delete Confirmation */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-600" /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete {selectedIds.size} Booking{selectedIds.size > 1 ? 's' : ''}?</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone. All selected bookings will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmBulkDelete(false)} className="flex-1 btn-secondary py-2.5">Cancel</button>
                <button onClick={async () => {
                  for (const id of selectedIds) { await deleteBooking(id); }
                  addNotification({ title: 'Bookings Deleted', message: `${selectedIds.size} booking(s) deleted successfully`, type: 'success' });
                  setSelectedIds(new Set());
                  setConfirmBulkDelete(false);
                }} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Yes, Delete All</button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Plus size={16} className="text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">{editId ? '✏️ Edit Booking' : '➕ Add New Booking'}</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Passenger Info */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  Passenger Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input value={form.firstName} onChange={(e) => { setForm({...form, firstName: e.target.value.toUpperCase()}); setFormErrors(p => ({...p, firstName: false})); }} className={`input-field py-2 text-sm uppercase ${formErrors.firstName ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`} style={{ textTransform: 'uppercase' }} placeholder="FIRST NAME" />
                    {formErrors.firstName && <p className="text-xs text-red-500 mt-0.5">First name is required</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input value={form.lastName} onChange={(e) => { setForm({...form, lastName: e.target.value.toUpperCase()}); }} className="input-field py-2 text-sm uppercase" style={{ textTransform: 'uppercase' }} placeholder="LAST NAME" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input type="email" value={form.email} onChange={(e) => { setForm({...form, email: e.target.value}); setFormErrors(p => ({...p, email: false})); }} className={`input-field py-2 text-sm ${formErrors.email ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`} placeholder="email@example.com" />
                    {formErrors.email && <p className="text-xs text-red-500 mt-0.5">Email is required</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <select 
                        value={form.countryCode} 
                        onChange={(e) => { setForm({...form, countryCode: e.target.value, phone: ''}); setFormErrors(p => ({...p, phone: false})); }}
                        className="bg-gray-50 border-0 border-r border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-0 min-w-[80px]"
                        title="Country Code"
                      >
                        {COUNTRY_CODES.map((c, i) => (
                          <option key={i} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <div className="flex items-center px-2 text-gray-400 font-bold text-xs bg-white border-r border-gray-200">|</div>
                      <input 
                        value={form.phone} 
                        onChange={(e) => {
                          const maxLen = getPhoneMaxLen(form.countryCode);
                          let val = e.target.value.replace(/\D/g, '').slice(0, maxLen);
                          setForm({...form, phone: val});
                          setFormErrors(p => ({...p, phone: false}));
                        }} 
                        maxLength={getPhoneMaxLen(form.countryCode)}
                        className="flex-1 border-0 px-2 py-2 text-sm focus:outline-none focus:ring-0" 
                        placeholder={`${getPhoneMaxLen(form.countryCode)} digits`}
                      />
                    </div>
                    {formErrors.phone && <p className="text-xs text-red-500 mt-0.5">Phone number is required</p>}
                    {!formErrors.phone && <p className="text-xs text-gray-400 mt-0.5">{form.countryCode} | {form.phone || Array(getPhoneMaxLen(form.countryCode)+1).join('x')}</p>}
                  </div>
                </div>
              </div>

              {/* Flight Info */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  Flight Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
                    <AirportInput
                      value={form.origin}
                      onChange={(val) => setForm({...form, origin: val})}
                      placeholder="Type IATA code or city..."
                      hasError={formErrors.origin}
                      filterAirportsFn={filterAirports}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                    <AirportInput
                      value={form.destination}
                      onChange={(val) => setForm({...form, destination: val})}
                      placeholder="Type IATA code or city..."
                      hasError={formErrors.destination}
                      filterAirportsFn={filterAirports}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type *</label>
                    <select value={form.tripType} onChange={(e) => setForm({...form, tripType: e.target.value})} className="select-field py-2.5">
                      {TRIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date *</label>
                    <input type="date" value={form.departureDate} onChange={(e) => setForm({...form, departureDate: e.target.value})} className="input-field py-2.5" />
                  </div>
                  {(form.tripType === 'Round Trip' || form.tripType === 'Multi City') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                      <input type="date" value={form.returnDate} onChange={(e) => setForm({...form, returnDate: e.target.value})} className="input-field py-2.5" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cabin *</label>
                    <select value={form.cabin} onChange={(e) => setForm({...form, cabin: e.target.value as any})} className="select-field py-2.5">
                      {CABINS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adult</label>
                      <input type="number" min="1" value={form.adults} onChange={(e) => setForm({...form, adults: e.target.value})} placeholder="0" className="input-field py-2.5 text-center" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Child</label>
                      <input type="number" min="0" value={form.children} onChange={(e) => setForm({...form, children: e.target.value})} placeholder="0" className="input-field py-2.5 text-center" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Infant</label>
                      <input type="number" min="0" value={form.infants} onChange={(e) => setForm({...form, infants: e.target.value})} placeholder="0" className="input-field py-2.5 text-center" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Remarks */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                  Status &amp; Remarks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Query Status <span className="text-red-500">*</span></label>
                    <select value={form.queryStatus} onChange={(e) => { setForm({...form, queryStatus: e.target.value}); setFormErrors(p => ({...p, queryStatus: false})); }} className={`select-field py-2 text-sm ${formErrors.queryStatus ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}>
                      <option value="">Select Status</option>
                      {QUERY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {formErrors.queryStatus && <p className="text-xs text-red-500 mt-0.5">Status is required</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Query Source <span className="text-red-500">*</span></label>
                    <select value={form.querySource} onChange={(e) => { setForm({...form, querySource: e.target.value}); setFormErrors(p => ({...p, querySource: false})); }} className={`select-field py-2 text-sm ${formErrors.querySource ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`}>
                      <option value="">Select Source</option>
                      {QUERY_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {formErrors.querySource && <p className="text-xs text-red-500 mt-0.5">Source is required</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Partial Payment</label>
                    <select value={form.partialPayment} onChange={(e) => setForm({...form, partialPayment: e.target.value as any})} className="select-field py-2 text-sm">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  {form.partialPayment === 'Yes' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total Amount</label>
                        <input type="number" value={(form as any).partialPaymentAmount || ''} onChange={(e) => setForm({...form, partialPaymentAmount: e.target.value} as any)} className="input-field py-2 text-sm" placeholder="Total amount due" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Received Amount</label>
                        <input type="number" value={(form as any).receivedAmount || ''} onChange={(e) => setForm({...form, receivedAmount: e.target.value} as any)} className="input-field py-2 text-sm" placeholder="Amount received so far" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Amount Pending</label>
                        <input type="text" readOnly value={(() => { const total = Number((form as any).partialPaymentAmount) || 0; const received = Number((form as any).receivedAmount) || 0; return total - received > 0 ? (total - received).toFixed(2) : '0'; })()} className="input-field py-2 text-sm bg-gray-100 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Payment Due Date</label>
                        <input type="date" value={(form as any).partialPaymentDueDate || ''} onChange={(e) => setForm({...form, partialPaymentDueDate: e.target.value} as any)} className="input-field py-2 text-sm" />
                      </div>
                    </>
                  )}
                  
                  {/* Remarks with history */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Remarks <span className="text-red-500">*</span></label>
                    {remarksList.length > 0 && (
                      <div className="mb-2 space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-2.5 bg-gray-50">
                        {remarksList.map((r, i) => (
                          <div key={i} className="text-xs border-b border-gray-200 pb-1.5 last:border-0 last:pb-0">
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
                        onChange={(e) => { setNewRemark(e.target.value); setFormErrors(p => ({...p, remarks: false})); }} 
                        className={`input-field h-14 resize-none flex-1 text-sm ${formErrors.remarks ? 'field-error border-red-500 ring-1 ring-red-400' : ''}`} 
                        placeholder="Add a remark..." 
                      />
                      <button onClick={addRemark} className="btn-secondary self-end px-3 py-2 text-sm">Add</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PNR Section */}
              {showPnrSection && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                      PNR Details *
                    </h3>
                    <div className="flex items-center gap-2">
                      <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})} className="select-field py-1 text-xs w-24">
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button onClick={addPnrRow} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                        <Plus size={14} /> Add Row
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full min-w-[700px] text-sm border-collapse border border-gray-200">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b-2 border-gray-300">
                        <tr>
                          <th className="px-3 py-2 text-left border border-gray-200">PNR</th>
                          <th className="px-3 py-2 text-left border border-gray-200">First Name</th>
                          <th className="px-3 py-2 text-left border border-gray-200">Last Name</th>
                          <th className="px-3 py-2 text-left border border-gray-200">Airline</th>
                          <th className="px-3 py-2 text-left border border-gray-200">Selling Cost ({form.currency})</th>
                          <th className="px-3 py-2 text-left border border-gray-200">Our Cost ({form.currency})</th>
                          <th className="px-3 py-2 text-left border border-gray-200">Service Fee ({form.currency})</th>
                          <th className="px-3 py-2 text-left border border-gray-200">MCO ({form.currency})</th>
                          <th className="px-3 py-2 text-left border border-gray-200">GPM ({form.currency})</th>
                          <th className="px-3 py-2 w-10 border border-gray-200"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pnrDetails.map((detail, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border border-gray-200">
                              <input 
                                value={detail.pnr} 
                                onChange={(e) => handlePnrDetailChange(idx, 'pnr', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} 
                                className="input-field py-1.5 text-sm uppercase font-mono" 
                                placeholder="PNR"
                                maxLength={6}
                                style={{ textTransform: 'uppercase' }}
                              />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input value={detail.firstName} onChange={(e) => handlePnrDetailChange(idx, 'firstName', e.target.value.toUpperCase())} className="input-field py-1.5 text-sm uppercase" placeholder="First Name" style={{ textTransform: 'uppercase' }} />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input value={detail.lastName} onChange={(e) => handlePnrDetailChange(idx, 'lastName', e.target.value.toUpperCase())} className="input-field py-1.5 text-sm uppercase" placeholder="Last Name" style={{ textTransform: 'uppercase' }} />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input value={detail.airline} onChange={(e) => handlePnrDetailChange(idx, 'airline', e.target.value.toUpperCase())} className="input-field py-1.5 text-sm uppercase" placeholder="Airline" style={{ textTransform: 'uppercase' }} />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input type="number" value={detail.sell} onChange={(e) => handlePnrDetailChange(idx, 'sell', Number(e.target.value))} className="input-field py-1.5 text-sm" />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input type="number" value={detail.cost} onChange={(e) => handlePnrDetailChange(idx, 'cost', Number(e.target.value))} className="input-field py-1.5 text-sm" />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input type="number" value={detail.fee} onChange={(e) => handlePnrDetailChange(idx, 'fee', Number(e.target.value))} className="input-field py-1.5 text-sm" />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input type="number" value={detail.mco} onChange={(e) => handlePnrDetailChange(idx, 'mco', Number(e.target.value))} className="input-field py-1.5 text-sm" />
                            </td>
                            <td className="p-2 border border-gray-200">
                              <input type="number" value={detail.gpm} readOnly className="input-field py-1.5 text-sm bg-gray-50 font-medium" />
                            </td>
                            <td className="p-2 border border-gray-200 text-center">
                              {pnrDetails.length > 1 && (
                                <button onClick={() => removePnrRow(idx)} className="text-red-500 hover:text-red-700">
                                  <Trash2 size={16} />
                                </button>
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

              {/* Image Upload Section with Preview */}
              {showImageSection && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Documents/Images</h3>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      {images.map((img, idx) => {
                        const displayUrl = resolvedImages[img] || (img.startsWith('http') ? img : '');
                        return (
                          <div key={idx} className="relative group w-28 h-28 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            {displayUrl ? (
                              <img src={displayUrl} alt="Doc" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={24} className="text-gray-300" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handlePreviewImage(img)}
                                className="bg-white text-gray-700 rounded-full p-1.5 hover:bg-blue-50 shadow-sm"
                                title="Preview"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                onClick={() => removeImage(idx)}
                                className="bg-white text-red-500 rounded-full p-1.5 hover:bg-red-50 shadow-sm"
                                title="Remove"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <label className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <Upload size={24} className="text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Upload</span>
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>
                    {uploading && <p className="text-sm text-blue-600 animate-pulse">Compressing & uploading...</p>}
                    {images.length > 0 && (
                      <p className="text-xs text-gray-400">Uploaded by: <span className="font-medium text-gray-600">{currentUser?.name || 'Admin'}</span></p>
                    )}
                  </div>
                </div>
              )}

            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              {formErrors.remarks && <p className="text-xs text-red-500 self-center">⚠ Please add at least one remark</p>}
              <button onClick={() => { setShowAddModal(false); setFormErrors({}); }} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              {canEditBooking ? (
                <button onClick={handleSave} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                  <Check size={14} /> Save Booking
                </button>
              ) : (
                <div className="text-sm text-amber-600 flex items-center px-4 py-2 bg-amber-50 rounded-lg">
                  Locked (Status: {currentStatus})
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Booking Modal */}
      {viewBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewBooking(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{viewBooking.queryStatus}</span>
                    <span className="text-white/70 text-xs">{viewBooking.company || 'Get Set Flight'}</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">{viewBooking.queryId}</h2>
                  <p className="text-white/80 text-sm mt-0.5">by {viewBooking.addedBy || '—'} • {viewBooking.created}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Verify Client Button */}
                  <button
                    onClick={generateVerificationLink}
                    disabled={verifyLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all bg-green-500 hover:bg-green-600 text-white"
                    title="Generate Verification Link"
                  >
                    {verifyLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    Verify
                  </button>
                  {/* View Verification Button - loads verification into the view details panel */}
                  <button
                    onClick={() => loadVerificationData(viewBooking.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${verificationData.length > 0 ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                    title="View Verification Records"
                  >
                    <ShieldCheck size={14} />
                    {verificationData.length > 0 ? `${verificationData.length}` : ''}
                  </button>
                  {viewBooking.email && (
                    <button
                      onClick={() => sendEmailForBooking(viewBooking)}
                      disabled={emailStatus === 'sending'}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        emailStatus === 'success' ? 'bg-green-500 text-white' :
                        emailStatus === 'failed' ? 'bg-orange-500 text-white' :
                        'bg-white/20 hover:bg-white/30 text-white'
                      }`}
                    >
                      {emailStatus === 'sending' ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      {emailStatus === 'sending' ? '...' : emailStatus === 'success' ? '✅' : emailStatus === 'failed' ? '↻' : 'Email'}
                    </button>
                  )}
                  <button onClick={() => setViewBooking(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"><X size={20} /></button>
                </div>
              </div>
              {emailStatus === 'failed' && emailErrorMsg && (
                <p className="text-xs text-red-200 mt-2 bg-red-900/30 px-3 py-1 rounded-lg">⚠ {emailErrorMsg}</p>
              )}
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-5 space-y-5">
              {/* QC Review */}
              {isSupervisor && viewBooking.queryStatus === 'Send to QC' && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-amber-900">🔍 QC Review Required</h3>
                      <p className="text-sm text-amber-700">Review PNR details, assign supplier, then approve or reject.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleQCAction('Reject')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">Reject</button>
                      <button onClick={() => handleQCAction('Accept')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">Accept</button>
                    </div>
                  </div>
                  {/* Editable QC PNR Table */}
                  <div className="overflow-x-auto bg-white rounded-lg border border-amber-100">
                    <table className="w-full min-w-[900px] text-sm border-collapse">
                      <thead className="bg-amber-50 text-xs text-amber-700 uppercase">
                        <tr>
                          <th className="px-2 py-2 text-left border border-amber-200">PNR</th>
                          <th className="px-2 py-2 text-left border border-amber-200">First Name</th>
                          <th className="px-2 py-2 text-left border border-amber-200">Last Name</th>
                          <th className="px-2 py-2 text-left border border-amber-200">Airline</th>
                          <th className="px-2 py-2 text-left border border-amber-200">Supplier</th>
                          <th className="px-2 py-2 text-left border border-amber-200">Payment Method</th>
                          <th className="px-2 py-2 text-left border border-amber-200">Sell</th>
                          <th className="px-2 py-2 text-left border border-amber-200">Cost</th>
                          <th className="px-2 py-2 text-left border border-amber-200">Fee</th>
                          <th className="px-2 py-2 text-left border border-amber-200">MCO</th>
                          <th className="px-2 py-2 text-left border border-amber-200">GPM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qcPnrDetails.map((detail, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5 border border-amber-100">
                              <input value={detail.pnr} onChange={(e) => { const nd = [...qcPnrDetails]; nd[idx] = { ...nd[idx], pnr: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm uppercase font-mono w-full" maxLength={6} />
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <input value={detail.firstName} onChange={(e) => { const nd = [...qcPnrDetails]; nd[idx] = { ...nd[idx], firstName: e.target.value.toUpperCase() }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm uppercase w-full" />
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <input value={detail.lastName} onChange={(e) => { const nd = [...qcPnrDetails]; nd[idx] = { ...nd[idx], lastName: e.target.value.toUpperCase() }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm uppercase w-full" />
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <input value={detail.airline} onChange={(e) => { const nd = [...qcPnrDetails]; nd[idx] = { ...nd[idx], airline: e.target.value.toUpperCase() }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm uppercase w-full" />
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <select value={detail.supplier} onChange={(e) => { const nd = [...qcPnrDetails]; nd[idx] = { ...nd[idx], supplier: e.target.value }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm w-full">
                                <option value="">Select</option>
                                {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <select value={detail.paymentMethod} onChange={(e) => { const nd = [...qcPnrDetails]; nd[idx] = { ...nd[idx], paymentMethod: e.target.value }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm w-full">
                                <option value="">Select</option>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <input type="number" value={detail.sell} onChange={(e) => { const nd = [...qcPnrDetails]; const val = Number(e.target.value); nd[idx] = { ...nd[idx], sell: val, gpm: val - (nd[idx].cost || 0) - (nd[idx].fee || 0) - (nd[idx].mco || 0) }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm w-20" />
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <input type="number" value={detail.cost} onChange={(e) => { const nd = [...qcPnrDetails]; const val = Number(e.target.value); nd[idx] = { ...nd[idx], cost: val, gpm: (nd[idx].sell || 0) - val - (nd[idx].fee || 0) - (nd[idx].mco || 0) }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm w-20" />
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <input type="number" value={detail.fee} onChange={(e) => { const nd = [...qcPnrDetails]; const val = Number(e.target.value); nd[idx] = { ...nd[idx], fee: val, gpm: (nd[idx].sell || 0) - (nd[idx].cost || 0) - val - (nd[idx].mco || 0) }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm w-20" />
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <input type="number" value={detail.mco} onChange={(e) => { const nd = [...qcPnrDetails]; const val = Number(e.target.value); nd[idx] = { ...nd[idx], mco: val, gpm: (nd[idx].sell || 0) - (nd[idx].cost || 0) - (nd[idx].fee || 0) - val }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm w-20" />
                            </td>
                            <td className="p-1.5 border border-amber-100">
                              <input type="number" value={typeof detail.gpm === 'number' ? parseFloat(detail.gpm.toFixed(2)) : detail.gpm} onChange={(e) => { const nd = [...qcPnrDetails]; nd[idx] = { ...nd[idx], gpm: Number(e.target.value) }; setQcPnrDetails(nd); }} className="input-field py-1 text-sm w-20 font-medium text-green-700" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Passenger & Flight in 2 columns */}
              {/* QC Reviewed By Section */}
              {viewBooking.qcReviewedBy && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-green-600 text-lg">✅</span>
                  <div>
                    <p className="text-sm font-bold text-green-800">QC Reviewed by: {viewBooking.qcReviewedBy}</p>
                    {viewBooking.qcReviewedAt && <p className="text-xs text-green-600">on {viewBooking.qcReviewedAt}</p>}
                  </div>
                </div>
              )}

              {/* Modification History Section */}
              {(() => {
                let modHistory: any[] = [];
                try { modHistory = JSON.parse((viewBooking as any).modificationHistory || '[]'); } catch {}
                if (modHistory.length === 0) return null;
                return (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                    <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">📋 Modification History</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {modHistory.map((entry: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-indigo-100 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold ${entry.action?.includes('Accept') ? 'text-green-700' : entry.action?.includes('Reject') ? 'text-red-700' : 'text-indigo-700'}`}>{entry.action}</span>
                            <span className="text-gray-400">{entry.modifiedAt}</span>
                          </div>
                          <p className="text-gray-700"><span className="font-medium">By:</span> {entry.modifiedBy}</p>
                          {entry.oldStatus && entry.newStatus && (
                            <p className="text-gray-600">Status: <span className="line-through text-red-500">{entry.oldStatus}</span> → <span className="text-green-600 font-medium">{entry.newStatus}</span></p>
                          )}
                          {entry.note && <p className="text-gray-500 mt-1 italic">{entry.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Passenger Card */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">👤 Passenger</h3>
                  <p className="text-xl font-black text-gray-900">{viewBooking.firstName} {viewBooking.lastName}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={13} className="text-gray-400" /><span className="truncate">{viewBooking.email || '—'}</span></div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><span className="text-gray-400">📞</span>{viewBooking.phone || '—'}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><span className="text-gray-400">🏷</span>Source: <span className="font-medium">{viewBooking.querySource || '—'}</span></div>
                  </div>
                </div>

                {/* Flight Card */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">✈ Flight</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-2xl font-black text-emerald-600">{getIata(viewBooking.origin) || '—'}</p>
                      <p className="text-[10px] text-gray-400">FROM</p>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-emerald-200 to-blue-200"></div>
                      <span className="mx-1 text-gray-300">✈</span>
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-200 to-indigo-200"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-blue-600">{getIata(viewBooking.destination) || '—'}</p>
                      <p className="text-[10px] text-gray-400">TO</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-400">Depart:</span> <span className="font-semibold">{viewBooking.departureDate || '—'}</span></div>
                    <div><span className="text-gray-400">Return:</span> <span className="font-semibold">{viewBooking.returnDate || '—'}</span></div>
                    <div><span className="text-gray-400">Trip:</span> <span className="font-semibold">{viewBooking.tripType || '—'}</span></div>
                    <div><span className="text-gray-400">Cabin:</span> <span className="font-semibold">{viewBooking.cabin || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Passengers Count */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-blue-700">{viewBooking.adults || 0}</p>
                  <p className="text-[10px] text-blue-500 font-bold">ADULTS</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-purple-700">{viewBooking.children || 0}</p>
                  <p className="text-[10px] text-purple-500 font-bold">CHILDREN</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-pink-700">{viewBooking.infants || 0}</p>
                  <p className="text-[10px] text-pink-500 font-bold">INFANTS</p>
                </div>
              </div>

              {/* Remarks History */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">💬 Action Logs & Remarks</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 max-h-60 overflow-y-auto">
                  {(() => {
                    try {
                      const remarks = JSON.parse(viewBooking.remarks || '[]');
                      if (remarks.length === 0) return <p className="text-sm text-gray-400 text-center py-3">No remarks yet</p>;
                      return remarks.map((r: any, i: number) => (
                        <div key={i} className={`bg-white p-3 rounded-xl border shadow-sm ${r.text?.includes('QC Accepted') ? 'border-green-200 bg-green-50' : r.text?.includes('QC Rejected') ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                          <p className={`text-sm ${r.text?.includes('QC Accepted') ? 'text-green-800 font-semibold' : r.text?.includes('QC Rejected') ? 'text-red-800 font-semibold' : 'text-gray-800'}`}>{r.text}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                            <span className="font-semibold text-blue-600">{r.addedBy}</span>
                            <span>•</span>
                            <span>{r.date}</span>
                          </div>
                        </div>
                      ));
                    } catch {
                      return <p className="text-sm text-gray-500">{viewBooking.remarks}</p>;
                    }
                  })()}
                </div>
              </div>

              {/* PNR Details */}
              {viewBooking.pnrDetails && viewBooking.pnrDetails !== '[]' && (
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">🎫 PNR Details</h3>
                  <div className="overflow-x-auto bg-gray-50 rounded-xl">
                    <table className="w-full text-sm border-collapse border border-gray-200">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase border border-gray-200">PNR</th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase border border-gray-200">Name</th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase border border-gray-200">Airline</th>
                          {isSupervisor && <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase border border-gray-200">Supplier</th>}
                          <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase border border-gray-200">Sell</th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase border border-gray-200">Cost</th>
                          <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase border border-gray-200">Fee</th>
                          {(() => {
                            try {
                              const pnrs = JSON.parse(viewBooking.pnrDetails);
                              return pnrs.some((p: any) => p.mco && p.mco > 0) ? <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase border border-gray-200">MCO</th> : null;
                            } catch { return null; }
                          })()}
                          <th className="p-3 text-left text-[10px] font-bold text-gray-400 uppercase border border-gray-200">GPM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          try {
                            const pnrs = JSON.parse(viewBooking.pnrDetails);
                            const hasMco = pnrs.some((p: any) => p.mco && p.mco > 0);
                            return pnrs.map((p: any, i: number) => (
                              <tr key={i} className="hover:bg-white transition-colors">
                                <td className="p-3 font-mono font-bold text-indigo-600 border border-gray-200">{p.pnr}</td>
                                <td className="p-3 border border-gray-200">{p.firstName} {p.lastName}</td>
                                <td className="p-3 border border-gray-200">{p.airline}</td>
                                {isSupervisor && <td className="p-3 border border-gray-200 font-medium text-orange-700">{p.supplier || '—'}</td>}
                                <td className="p-3 font-medium border border-gray-200">${p.sell}</td>
                                <td className="p-3 border border-gray-200">${p.cost}</td>
                                <td className="p-3 border border-gray-200">${p.fee || 0}</td>
                                {hasMco && <td className="p-3 border border-gray-200">${p.mco || 0}</td>}
                                <td className="p-3 font-bold text-green-600 border border-gray-200">${typeof p.gpm === 'number' ? parseFloat(p.gpm.toFixed(2)) : (p.gpm || 0)}</td>
                              </tr>
                            ));
                          } catch { return null; }
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Partial Payment Section - Clear Dues (Admin/Manager/Supervisor only) */}
              {viewBooking.partialPayment === 'Yes' && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3">💰 Partial Payment Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-gray-500">Due Date:</span> <span className="font-bold text-red-600">{(viewBooking as any).partialPaymentDueDate || 'Not set'}</span></div>
                    <div><span className="text-gray-500">Total Amount:</span> <span className="font-bold text-red-600">{(viewBooking as any).partialPaymentAmount || 'Pending'}</span></div>
                    <div><span className="text-gray-500">Received:</span> <span className="font-bold text-green-600">{(viewBooking as any).receivedAmount || (viewBooking as any).partialPaymentReceived || '0'}</span></div>
                    <div><span className="text-gray-500">Outstanding:</span> <span className="font-bold text-red-700">{(() => { const total = Number((viewBooking as any).partialPaymentAmount) || 0; const received = Number((viewBooking as any).receivedAmount || (viewBooking as any).partialPaymentReceived) || 0; return (total - received) > 0 ? `${(total - received).toFixed(2)}` : '0'; })()}</span></div>
                    <div><span className="text-gray-500">Status:</span> <span className={`font-bold ${(viewBooking as any).partialPaymentCleared ? 'text-green-600' : 'text-red-600'}`}>{(viewBooking as any).partialPaymentCleared ? '✓ Cleared' : '⚠ Outstanding'}</span></div>
                    {(viewBooking as any).partialPaymentClearedBy && (
                      <div><span className="text-gray-500">Cleared by:</span> <span className="font-semibold text-green-700">{(viewBooking as any).partialPaymentClearedBy} ({(viewBooking as any).partialPaymentClearedDate})</span></div>
                    )}
                  </div>
                  {/* Update received amount */}
                  {['Admin', 'Manager', 'Operation Manager', 'Supervisor', 'Super Admin', 'HR (Human Resource)', 'HR', 'IT (Information Tech)', 'IT'].includes(currentUser?.role || '') && (
                    <div className="flex gap-2 items-center mb-2">
                      <input
                        type="number"
                        placeholder="Enter received amount"
                        className="input-field py-1.5 text-sm flex-1"
                        defaultValue={(viewBooking as any).receivedAmount || (viewBooking as any).partialPaymentReceived || ''}
                        onBlur={async (e) => {
                          const val = e.target.value;
                          if (val !== ((viewBooking as any).receivedAmount || (viewBooking as any).partialPaymentReceived || '').toString()) {
                            await updateBooking(viewBooking.id, { receivedAmount: val } as any);
                            setViewBooking({ ...viewBooking, receivedAmount: val });
                            addNotification({ title: 'Payment Updated', message: `Received amount updated to ${val}`, type: 'success' });
                          }
                        }}
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap">Amount Received</span>
                    </div>
                  )}
                  {!((viewBooking as any).partialPaymentCleared) && ['Admin', 'Manager', 'Operation Manager', 'Supervisor', 'Super Admin'].includes(currentUser?.role || '') && (
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to mark this payment as cleared?')) return;
                        await updateBooking(viewBooking.id, {
                          partialPaymentCleared: true,
                          partialPaymentClearedBy: currentUser?.name || 'Admin',
                          partialPaymentClearedDate: new Date().toISOString().split('T')[0],
                        } as any);
                        setViewBooking({ ...viewBooking, partialPaymentCleared: true, partialPaymentClearedBy: currentUser?.name, partialPaymentClearedDate: new Date().toISOString().split('T')[0] });
                        addNotification({ title: '✅ Dues Cleared', message: `Payment dues for ${viewBooking.firstName} ${viewBooking.lastName} marked as cleared.`, type: 'success' });
                      }}
                      className="w-full mt-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-sm"
                    >
                      ✓ Mark Dues as Cleared
                    </button>
                  )}
                </div>
              )}

              {/* Uploaded Images */}
              {viewBooking.images && (
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">📎 Documents</h3>
                  <div className="flex flex-wrap gap-3">
                    {viewBooking.images.split(',').filter(Boolean).map((img: string, idx: number) => {
                      const displayUrl = resolvedImages[img] || (img.startsWith('http') ? img : '');
                      return (
                        <div key={idx} className="relative group w-24 h-24 border border-gray-200 rounded-xl overflow-hidden bg-gray-50 cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => handlePreviewImage(img)}>
                          {displayUrl ? (
                            <img src={displayUrl} alt="Doc" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-gray-300" /></div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <Eye size={18} className="text-white" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Client Verification Section - Inline in View Details */}
              {verificationData.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">🛡️ Client Verification</h3>
                  <div className="space-y-4">
                    {verificationData.map((v: any, idx: number) => (
                      <div key={v.id || idx} className={`border rounded-xl overflow-hidden ${
                        (v.reviewStatus || v.review_status) === 'approved' ? 'border-green-300 bg-green-50/50' : 
                        (v.reviewStatus || v.review_status) === 'rejected' ? 'border-red-300 bg-red-50/50' : 
                        'border-gray-200 bg-gray-50/50'
                      }`}>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                v.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                v.status === 'approved' ? 'bg-green-100 text-green-700' :
                                v.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                v.status === 'superseded' ? 'bg-gray-100 text-gray-500' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{(v.status || 'PENDING').toUpperCase()}</span>
                              {(v.documentType || v.document_type) && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{v.documentType || v.document_type}</span>}
                            </div>
                            <span className="text-xs text-gray-400">{v.created || v.submittedAt || v.submitted_at}</span>
                          </div>

                          {/* Submitted Images - Clickable One by One Preview */}
                          {(v.selfieImage || v.selfie_image || v.selfie_image_back || v.selfieImageBack || v.documentImage || v.document_image) ? (() => {
                            // Helper: normalize image source (handles base64 with/without prefix, and file paths)
                            const normalizeImgSrc = (raw: string): string => {
                              if (!raw) return '';
                              if (raw.startsWith('data:image/')) return raw; // Already has data URI prefix
                              if (raw.startsWith('http://') || raw.startsWith('https://')) return raw; // URL
                              if (raw.startsWith('uploads/') || raw.startsWith('/uploads/')) return `${API_BASE_URL}/${raw.replace(/^\//, '')}`; // File path
                              return `data:image/jpeg;base64,${raw}`; // Pure base64
                            };

                            // Collect all images for this verification
                            const allImages: {src: string; label: string}[] = [];
                            if (v.selfieImage || v.selfie_image) {
                              allImages.push({ src: normalizeImgSrc(v.selfieImage || v.selfie_image), label: 'Front Selfie' });
                            }
                            if (v.selfie_image_back || v.selfieImageBack) {
                              allImages.push({ src: normalizeImgSrc(v.selfie_image_back || v.selfieImageBack), label: 'Back Selfie' });
                            }
                            const docImg = v.documentImage || v.document_image;
                            if (docImg) {
                              try {
                                const photos = JSON.parse(docImg);
                                if (Array.isArray(photos)) {
                                  photos.forEach((photo: string, pi: number) => {
                                    allImages.push({ src: normalizeImgSrc(photo), label: `Document ${pi + 1}` });
                                  });
                                } else {
                                  allImages.push({ src: normalizeImgSrc(docImg), label: 'Document' });
                                }
                              } catch {
                                allImages.push({ src: normalizeImgSrc(docImg), label: 'Document' });
                              }
                            }

                            return (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-600 mb-2">📷 Submitted Images ({allImages.length})</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {allImages.map((img, imgIdx) => {
                                    const flipKey = `${v.id}-${imgIdx}`;
                                    const isFlipped = flippedImages[flipKey] || false;
                                    return (
                                    <div 
                                      key={imgIdx} 
                                      className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all"
                                      onClick={() => setVerifyImagePreview({ images: allImages, index: imgIdx })}
                                    >
                                      <img src={img.src} alt={img.label} className="w-full h-20 object-cover transition-transform duration-300" style={{ transform: isFlipped ? 'scaleX(-1)' : 'none' }} />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                        <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-black/60 text-white px-1 rounded">{img.label}</span>
                                      {/* Flip button */}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setFlippedImages(prev => ({ ...prev, [flipKey]: !prev[flipKey] })); }}
                                        className="absolute top-0.5 left-0.5 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                        title="Flip Image"
                                      >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 2v20M9 12l3-3 3 3" /></svg>
                                      </button>
                                      {/* Download button */}
                                      <button 
                                        className="absolute top-0.5 right-0.5 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const imgSrc = img.src;
                                          const filename = `${img.label.replace(/\s/g, '-').toLowerCase()}-${v.id}.jpg`;
                                          if (imgSrc.startsWith('data:')) {
                                            const a = document.createElement('a');
                                            a.href = imgSrc;
                                            a.download = filename;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                          } else {
                                            fetch(imgSrc)
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
                                              .catch(() => window.open(imgSrc, '_blank'));
                                          }
                                        }}
                                      >
                                        <Download size={10} />
                                      </button>
                                    </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })() : null}

                          {/* AI Results */}
                          {(v.selfieImage || v.selfie_image || v.documentImage || v.document_image) && (
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                                <p className="text-xs text-gray-400 font-medium mb-1">Selfie</p>
                                <div className="flex items-center gap-1.5">
                                  {(v.selfieVerified || v.selfie_verified) ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                                  <span className={`text-xs font-bold ${(v.selfieVerified || v.selfie_verified) ? 'text-green-700' : 'text-red-700'}`}>{(v.selfieVerified || v.selfie_verified) ? 'REAL' : 'FAILED'}</span>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                                <p className="text-xs text-gray-400 font-medium mb-1">Document</p>
                                <div className="flex items-center gap-1.5">
                                  {(v.documentVerified || v.document_verified) ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                                  <span className={`text-xs font-bold ${(v.documentVerified || v.document_verified) ? 'text-green-700' : 'text-red-700'}`}>{(v.documentVerified || v.document_verified) ? 'REAL' : 'FAILED'}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Device Info */}
                          {(v.ipAddress || v.ip_address) && (
                            <div className="bg-gray-50 rounded-lg p-2.5 mb-3 text-xs space-y-0.5">
                              <p><span className="text-gray-400">IP:</span> <span className="font-medium">{v.ipAddress || v.ip_address}</span></p>
                              {v.latitude && v.longitude && <p><span className="text-gray-400">Location:</span> <span className="font-medium">{v.latitude}, {v.longitude}</span></p>}
                              {(v.submittedAt || v.submitted_at) && <p><span className="text-gray-400">Submitted:</span> <span className="font-medium">{v.submittedAt || v.submitted_at}</span></p>}
                            </div>
                          )}

                          {/* Review Actions */}
                          {v.status === 'submitted' && ((v.reviewStatus || v.review_status) === 'pending' || !(v.reviewStatus || v.review_status)) && (
                            ['Admin', 'Super Admin', 'Manager', 'Operation Manager', 'Supervisor'].includes(currentUser?.role || '') ? (
                              <div className="flex gap-2 mb-2">
                                <button onClick={() => handleVerificationReview(v.id, 'approved')} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors">
                                  <CheckCircle size={14} /> Approve
                                </button>
                                <button onClick={() => handleVerificationReview(v.id, 'rejected')} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors">
                                  <XCircle size={14} /> Reject
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">⏳ Pending review</p>
                            )
                          )}

                          {/* Status display for pending (not submitted) */}
                          {v.status === 'pending' && (
                            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2">⏳ Verification link sent — waiting for client to submit</p>
                          )}

                          {(v.reviewStatus === 'approved' || v.review_status === 'approved') && <p className="text-xs text-green-700 font-medium">✓ Approved by {v.reviewedBy || v.reviewed_by} • {v.reviewedAt || v.reviewed_at}</p>}
                          {(v.reviewStatus === 'rejected' || v.review_status === 'rejected') && (
                            <div>
                              <p className="text-xs text-red-700 font-medium">✗ Rejected by {v.reviewedBy || v.reviewed_by} • {v.reviewedAt || v.reviewed_at}</p>
                              {(v.rejectionReason || v.rejection_reason) && <p className="text-xs text-red-600 mt-1">Reason: {v.rejectionReason || v.rejection_reason}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Link Modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={() => { setVerifyModal(false); setVerifySendStatus('idle'); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 rounded-t-2xl text-white text-center">
              <ShieldCheck size={36} className="mx-auto mb-2" />
              <h3 className="text-lg font-bold">Verification Link Generated</h3>
              <p className="text-white/80 text-sm mt-1">Send this link to the client for identity verification</p>
            </div>
            <div className="p-5 relative">
              {/* Success animation overlay */}
              {verifySendStatus === 'sent' && (
                <div className="absolute inset-0 bg-white/95 rounded-b-2xl flex flex-col items-center justify-center z-10 animate-[fadeIn_0.3s_ease-in-out]">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-[scaleIn_0.4s_ease-out] shadow-lg shadow-green-200">
                    <CheckCircle size={40} className="text-green-500 animate-bounce" />
                  </div>
                  <h4 className="text-lg font-bold text-green-700">Email Sent Successfully!</h4>
                  <p className="text-sm text-gray-500 mt-1">Verification link has been sent to the client</p>
                  <div className="mt-3 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">Auto-closing in 5s...</span>
                  </div>
                </div>
              )}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1 font-medium">Verification Link:</p>
                <p className="text-sm text-gray-800 break-all font-mono">{verifyLink}</p>
              </div>
              <button
                onClick={copyVerificationLink}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${verifyCopied ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {verifyCopied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
              </button>
              <button
                onClick={async () => {
                  if (!viewBooking?.email) {
                    addNotification({ title: 'No Email', message: 'This booking has no client email address', type: 'error' });
                    return;
                  }
                  setVerifySendStatus('sending');
                  try {
                    const res = await client.api.fetch('/api/public/verification/send-link-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        email: viewBooking.email, 
                        clientName: `${viewBooking.firstName || ''} ${viewBooking.lastName || ''}`.trim(),
                        verificationLink: verifyLink,
                        queryId: viewBooking.queryId 
                      }),
                    });
                    const data = await res.json() as any;
                    if (data.success) {
                      setVerifySendStatus('sent');
                      addNotification({ title: 'Email Sent ✓', message: `Verification link sent to ${viewBooking.email}`, type: 'success' });
                    } else {
                      setVerifySendStatus('idle');
                      addNotification({ title: 'Email Failed', message: data.error || 'Failed to send', type: 'error' });
                    }
                  } catch {
                    setVerifySendStatus('idle');
                    addNotification({ title: 'Error', message: 'Failed to send email', type: 'error' });
                  }
                }}
                disabled={verifySendStatus === 'sending'}
                className={`w-full py-3 rounded-xl font-bold text-sm mt-2 flex items-center justify-center gap-2 transition-all duration-300 ${
                  verifySendStatus === 'sent' ? 'bg-green-500 text-white scale-[1.02]' :
                  verifySendStatus === 'sending' ? 'bg-emerald-400 text-white opacity-80' :
                  'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {verifySendStatus === 'sending' ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending...</>
                ) : verifySendStatus === 'sent' ? (
                  <><CheckCircle size={16} className="animate-bounce" /> Sent Successfully ✓</>
                ) : (
                  <><Mail size={16} /> Send Link to Client Email</>
                )}
              </button>
              <button
                onClick={() => { setVerifyModal(false); generateVerificationLink(); }}
                className="w-full py-2.5 rounded-xl font-medium text-sm mt-2 border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Link2 size={14} /> Regenerate Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification View Modal - Removed, now inline in view details */}

      {/* Verification Image Preview Lightbox */}
      {verifyImagePreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[300] p-4" onClick={() => setVerifyImagePreview(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button onClick={() => setVerifyImagePreview(null)} className="absolute top-2 right-2 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
              <X size={20} />
            </button>
            
            {/* Image counter */}
            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
              {verifyImagePreview.index + 1} / {verifyImagePreview.images.length}
            </div>

            {/* Image label */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1 rounded-full text-sm font-medium">
              {verifyImagePreview.images[verifyImagePreview.index].label}
            </div>

            {/* Main image */}
            <img 
              src={verifyImagePreview.images[verifyImagePreview.index].src} 
              alt={verifyImagePreview.images[verifyImagePreview.index].label}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl transition-transform duration-300"
              style={{ transform: flippedImages[`preview-${verifyImagePreview.index}`] ? 'scaleX(-1)' : 'none' }}
            />

            {/* Navigation arrows */}
            {verifyImagePreview.images.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setVerifyImagePreview(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setVerifyImagePreview(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}

            {/* Bottom actions */}
            <div className="mt-4 flex items-center gap-3">
              {/* Flip button in lightbox */}
              <button
                onClick={(e) => { e.stopPropagation(); setFlippedImages(prev => ({ ...prev, [`preview-${verifyImagePreview.index}`]: !prev[`preview-${verifyImagePreview.index}`] })); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 2v20M9 12l3-3 3 3" /></svg>
                Flip
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const imgSrc = verifyImagePreview.images[verifyImagePreview.index].src;
                  const filename = `${verifyImagePreview.images[verifyImagePreview.index].label.replace(/\s/g, '-').toLowerCase()}.jpg`;
                  const isFlipped = flippedImages[`preview-${verifyImagePreview.index}`] || false;
                  
                  // If image is flipped, draw on canvas with flip transformation then download
                  if (isFlipped) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      canvas.width = img.naturalWidth;
                      canvas.height = img.naturalHeight;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.translate(canvas.width, 0);
                        ctx.scale(-1, 1);
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob((blob) => {
                          if (blob) {
                            const blobUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(blobUrl);
                          }
                        }, 'image/jpeg', 0.95);
                      }
                    };
                    img.onerror = () => window.open(imgSrc, '_blank');
                    img.src = imgSrc;
                  } else {
                    // Normal download with fetch+blob for cross-origin support
                    fetch(imgSrc)
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
                        const a = document.createElement('a');
                        a.href = imgSrc;
                        a.download = filename;
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Download size={14} /> Download
              </button>
              {/* Thumbnail strip */}
              {verifyImagePreview.images.length > 1 && (
                <div className="flex gap-1.5">
                  {verifyImagePreview.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setVerifyImagePreview(prev => prev ? { ...prev, index: i } : null); }}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === verifyImagePreview.index ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img.src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Booking?</h3>
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this booking? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { deleteBooking(confirmDeleteId); setConfirmDeleteId(null); }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
