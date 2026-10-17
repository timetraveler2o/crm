import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { client, uploadImage, uploadFile, getImageUrl } from '../lib/api';
import { 
  Plus, Edit2, Trash2, X, Image as ImageIcon, Save, 
  Bell, Megaphone, Star, AlertTriangle, Info, Calendar,
  ChevronDown, Eye, Gift, Search, Filter, Upload, CheckCircle, AlertCircle,
  Sparkles, Zap, TrendingUp, Award, FileText, Download, File,
  RotateCcw, History, Archive
} from 'lucide-react';

interface UpdateMedia {
  type: 'image' | 'document';
  path: string;
  name?: string;
}

interface Update {
  id: number;
  title: string;
  content: string;
  image: string;
  category: string;
  priority: string;
  createdBy: string;
  targetRoles: string;
  isActive: number;
  created: string;
  modified: string;
  company?: string;
}

const CATEGORIES = [
  { value: 'General', label: 'General', icon: Info, color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-600' },
  { value: 'Airline Update', label: 'Airline Update', icon: Megaphone, color: 'bg-indigo-100 text-indigo-700', gradient: 'from-indigo-500 to-indigo-600' },
  { value: 'Birthday', label: 'Birthday', icon: Gift, color: 'bg-pink-100 text-pink-700', gradient: 'from-pink-500 to-rose-500' },
  { value: 'Rules', label: 'Rules & Regulations', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-orange-500' },
  { value: 'Important', label: 'Important Notice', icon: Star, color: 'bg-red-100 text-red-700', gradient: 'from-red-500 to-red-600' },
  { value: 'Event', label: 'Event', icon: Calendar, color: 'bg-green-100 text-green-700', gradient: 'from-green-500 to-emerald-500' },
];

const PRIORITIES = ['Normal', 'High', 'Urgent'];

const COMPANY_MAP: Record<string, string> = {
  fdi: 'Get Set Flight',
  emt: 'Look Book Ticket',
  travelo: 'Traveloboom',
};

// Helper to parse media from the image field (backward compatible)
function parseMedia(imageField: string): UpdateMedia[] {
  if (!imageField) return [];
  try {
    const parsed = JSON.parse(imageField);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  // Legacy single image path
  return [{ type: 'image', path: imageField }];
}

// Helper to serialize media to the image field
function serializeMedia(media: UpdateMedia[]): string {
  if (media.length === 0) return '';
  return JSON.stringify(media);
}

export default function Updates() {
  const { currentUser, activeCompany, isMultiCompanyAdmin, getUserCompany } = useAuthStore();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewUpdate, setViewUpdate] = useState<Update | null>(null);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [showDeletedHistory, setShowDeletedHistory] = useState(false);
  const [deletedUpdates, setDeletedUpdates] = useState<Update[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    media: [] as UpdateMedia[],
    category: 'General',
    priority: 'Normal',
    targetRoles: 'All FDI',
  });

  const isMultiAdmin = isMultiCompanyAdmin();
  const userCompany = getUserCompany();
  const displayCompany = isMultiAdmin ? activeCompany : userCompany;
  const companyName = COMPANY_MAP[displayCompany] || 'Get Set Flight';

  const canManage = ['Admin', 'Manager', 'Operation Manager', 'HR (Human Resource)', 'IT (Information Tech)', 'Supervisor'].includes(currentUser?.role || '') || (currentUser?.permissions || []).includes('Updates Management');

  const fetchUpdates = async () => {
    try {
      const res = await client.api.fetch('/api/public/updates');
      const data = await res.json();
      setUpdates((data.data || []).sort((a: Update, b: Update) => b.id - a.id));
    } catch (err) {
      console.error('Failed to fetch updates:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  // Resolve image URLs
  useEffect(() => {
    const resolveUrls = async () => {
      const newResolved: Record<string, string> = {};
      for (const u of updates) {
        const media = parseMedia(u.image);
        for (const m of media) {
          if (m.path && !resolvedImages[m.path]) {
            if (m.path.startsWith('http')) {
              newResolved[m.path] = m.path;
            } else {
              const url = await getImageUrl(m.path);
              if (url) newResolved[m.path] = url;
            }
          }
        }
      }
      if (Object.keys(newResolved).length > 0) {
        setResolvedImages(prev => ({ ...prev, ...newResolved }));
      }
    };
    if (updates.length > 0) resolveUrls();
  }, [updates]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      setToast({ type: 'error', message: 'Title is required' });
      return;
    }
    setSaving(true);
    try {
      const targets = (form.targetRoles || '').split(',').map(s => s.trim()).filter(Boolean);
      const companyTargets = targets.filter(t => t.startsWith('All '));
      let targetCompany = 'All';
      if (companyTargets.length === 1) {
        if (companyTargets[0] === 'All FDI') targetCompany = 'Get Set Flight';
        else if (companyTargets[0] === 'All EMT') targetCompany = 'Look Book Ticket';
        else if (companyTargets[0] === 'All Travelo') targetCompany = 'Traveloboom';
      } else if (companyTargets.length > 1) {
        targetCompany = 'All';
      } else {
        targetCompany = 'All';
      }
      const payload = {
        title: form.title,
        content: form.content,
        image: serializeMedia(form.media),
        category: form.category,
        priority: form.priority,
        targetRoles: form.targetRoles,
        company: targetCompany,
        createdBy: currentUser?.name || 'Admin',
      };
      
      let res;
      if (editId) {
        res = await client.api.fetch(`/api/public/updates/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await client.api.fetch('/api/public/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${res.status}`);
      }
      
      setToast({ type: 'success', message: editId ? 'Update saved successfully!' : 'Update published successfully!' });
      
      if (!editId) {
        const { addNotification } = useAuthStore.getState();
        addNotification({
          title: 'New Update Published',
          message: `"${form.title}" was published by ${currentUser?.name || 'Admin'}`,
          type: 'info',
        });
      }
      
      setShowForm(false);
      setEditId(null);
      setForm({ title: '', content: '', media: [], category: 'General', priority: 'Normal', targetRoles: 'All FDI' });
      fetchUpdates();
    } catch (err: any) {
      console.error('Failed to save update:', err);
      setToast({ type: 'error', message: err.message || 'Failed to save update. Please try again.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await client.api.fetch(`/api/public/updates/${id}`, { method: 'DELETE' });
      setUpdates(prev => prev.filter(u => u.id !== id));
      setConfirmDelete(null);
      setToast({ type: 'success', message: 'Update moved to deleted history' });
    } catch (err) {
      console.error('Failed to delete update:', err);
      setToast({ type: 'error', message: 'Failed to delete update' });
    }
  };

  const fetchDeletedUpdates = async () => {
    setLoadingDeleted(true);
    try {
      const res = await client.api.fetch('/api/public/updates/deleted');
      const data = await res.json();
      setDeletedUpdates((data.data || []).sort((a: Update, b: Update) => b.id - a.id));
    } catch (err) {
      console.error('Failed to fetch deleted updates:', err);
      setDeletedUpdates([]);
    }
    setLoadingDeleted(false);
  };

  const handleRestore = async (id: number) => {
    setRestoringId(id);
    try {
      await client.api.fetch(`/api/public/updates/${id}/restore`, { method: 'PUT' });
      setDeletedUpdates(prev => prev.filter(u => u.id !== id));
      setToast({ type: 'success', message: 'Update restored successfully!' });
      fetchUpdates(); // Refresh main list
    } catch (err) {
      console.error('Failed to restore update:', err);
      setToast({ type: 'error', message: 'Failed to restore update' });
    }
    setRestoringId(null);
  };

  const handlePermanentDelete = async (id: number) => {
    try {
      await client.api.fetch(`/api/public/updates/${id}/permanent`, { method: 'DELETE' });
      setDeletedUpdates(prev => prev.filter(u => u.id !== id));
      setPermanentDeleteId(null);
      setToast({ type: 'success', message: 'Update permanently deleted' });
    } catch (err) {
      console.error('Failed to permanently delete update:', err);
      setToast({ type: 'error', message: 'Failed to permanently delete' });
    }
  };

  const handleEdit = (update: Update) => {
    setForm({
      title: update.title,
      content: update.content || '',
      media: parseMedia(update.image),
      category: update.category || 'General',
      priority: update.priority || 'Normal',
      targetRoles: update.targetRoles || 'All',
    });
    setEditId(update.id);
    setShowForm(true);
  };

  const handleMultiImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    try {
      const newMedia: UpdateMedia[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const path = await uploadImage(file);
          if (path) {
            newMedia.push({ type: 'image', path, name: file.name });
            // Resolve URL immediately for preview
            const url = await getImageUrl(path);
            if (url) setResolvedImages(prev => ({ ...prev, [path]: url }));
          }
        }
      }
      setForm(f => ({ ...f, media: [...f.media, ...newMedia] }));
      if (newMedia.length > 0) {
        setToast({ type: 'success', message: `${newMedia.length} image${newMedia.length > 1 ? 's' : ''} uploaded` });
      }
    } catch (err) {
      console.error('Multi image upload failed:', err);
      setToast({ type: 'error', message: 'Image upload failed' });
    }
    setUploadingImages(false);
  };

  const handleDocUpload = async (files: FileList) => {
    setUploadingDocs(true);
    try {
      const newMedia: UpdateMedia[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = await uploadFile(file);
        if (path) {
          newMedia.push({ type: 'document', path, name: file.name });
          // Resolve URL for download
          const url = await getImageUrl(path);
          if (url) setResolvedImages(prev => ({ ...prev, [path]: url }));
        }
      }
      setForm(f => ({ ...f, media: [...f.media, ...newMedia] }));
      if (newMedia.length > 0) {
        setToast({ type: 'success', message: `${newMedia.length} document${newMedia.length > 1 ? 's' : ''} uploaded` });
      }
    } catch (err) {
      console.error('Document upload failed:', err);
      setToast({ type: 'error', message: 'Document upload failed' });
    }
    setUploadingDocs(false);
  };

  const removeMedia = (index: number) => {
    setForm(f => ({ ...f, media: f.media.filter((_, i) => i !== index) }));
  };

  const getCategoryConfig = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat) || CATEGORIES[0];
  };

  const getPriorityColor = (p: string) => {
    if (p === 'Urgent') return 'bg-red-500 text-white';
    if (p === 'High') return 'bg-orange-500 text-white';
    return 'bg-gray-100 text-gray-600';
  };

  // Filter by company/role targeting + category + search
  const userRole = currentUser?.role || '';
  const activeUpdates = updates.filter(u => {
    if (u.isActive === 0) return false;
    const targets = (u.targetRoles || '').split(',').map(s => s.trim()).filter(Boolean);
    if (targets.length > 0 && !targets.includes('All')) {
      const companyTargets = targets.filter(t => t.startsWith('All '));
      const roleTargets = targets.filter(t => !t.startsWith('All '));
      let companyMatch = companyTargets.length === 0;
      if (companyTargets.includes('All FDI') && displayCompany === 'GSF') companyMatch = true;
      if (companyTargets.includes('All EMT') && displayCompany === 'LBT') companyMatch = true;
      if (companyTargets.includes('All Travelo') && displayCompany === 'travelo') companyMatch = true;
      let roleMatch = roleTargets.length === 0;
      if ((roleTargets.includes('Agent') || roleTargets.includes('Travel Consultant')) && ['Agent', 'Travel Consultant', 'Senior Travel Consultant'].includes(userRole)) roleMatch = true;
      if (roleTargets.includes('Supervisor') && userRole === 'Supervisor') roleMatch = true;
      if (roleTargets.includes('Manager') && (userRole === 'Manager' || userRole === 'Operation Manager')) roleMatch = true;
      if (roleTargets.includes('Admin') && (userRole === 'Admin' || userRole === 'Super Admin')) roleMatch = true;
      if (companyTargets.length > 0 && roleTargets.length > 0) {
        if (!companyMatch || !roleMatch) return false;
      } else if (companyTargets.length > 0) {
        if (!companyMatch) return false;
      } else if (roleTargets.length > 0) {
        if (!roleMatch) return false;
      }
    }
    if (u.company && u.company !== 'All') {
      if (displayCompany === 'GSF' && u.company !== 'Get Set Flight') return false;
      if (displayCompany === 'LBT' && u.company !== 'Look Book Ticket') return false;
      if (displayCompany === 'travelo' && u.company !== 'Traveloboom' && u.company !== 'Traveloboom') return false;
    }
    if (filterCategory !== 'All' && u.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!u.title.toLowerCase().includes(q) && !(u.content || '').toLowerCase().includes(q) && !(u.createdBy || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Get first image from update media for card thumbnail
  const getFirstImage = (update: Update): string | null => {
    const media = parseMedia(update.image);
    const img = media.find(m => m.type === 'image');
    if (!img) return null;
    return resolvedImages[img.path] || (img.path.startsWith('http') ? img.path : null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Bell size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Notice Board & Updates
                <Sparkles size={18} className="text-yellow-300" />
              </h1>
              <p className="text-purple-200 text-sm mt-0.5">Important announcements, airline updates & more • {activeUpdates.length} active notices</p>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowDeletedHistory(true); fetchDeletedUpdates(); }}
                className="flex items-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/30 transition-all text-sm border border-white/30"
              >
                <History size={16} /> Deleted Logs
              </button>
              <button
                onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', content: '', media: [], category: 'General', priority: 'Normal', targetRoles: 'All FDI' }); }}
                className="flex items-center gap-2 px-5 py-3 bg-white text-purple-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
              >
                <Plus size={16} /> New Update
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Filters - Colorful Pill Style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterCategory === 'All' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/25' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >All</button>
          {CATEGORIES.map(cat => {
            const CI = cat.icon;
            const isActive = filterCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive 
                    ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg` 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <CI size={12} /> {cat.label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search updates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-9 !py-2.5 text-sm w-full rounded-xl"
          />
        </div>
      </div>

      {/* Updates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      ) : activeUpdates.length === 0 ? (
        <div className="card p-16 text-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-0">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Megaphone size={40} className="text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-600">No Updates Yet</h3>
          <p className="text-gray-400 text-sm mt-2">Important updates will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeUpdates.map(update => {
            const catConfig = getCategoryConfig(update.category);
            const CatIcon = catConfig.icon;
            const imageUrl = getFirstImage(update);
            const media = parseMedia(update.image);
            const docCount = media.filter(m => m.type === 'document').length;
            const imgCount = media.filter(m => m.type === 'image').length;
            return (
              <div
                key={update.id}
                className="bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border border-gray-100 hover:border-purple-200 hover:-translate-y-1 duration-300 shadow-sm"
                onClick={() => setViewUpdate(update)}
              >
                {imageUrl && (
                  <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden relative">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold backdrop-blur-sm bg-gradient-to-r ${catConfig.gradient} text-white shadow-md flex items-center gap-1`}>
                        <CatIcon size={10} /> {catConfig.label}
                      </span>
                    </div>
                    {(imgCount > 1 || docCount > 0) && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {imgCount > 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white font-medium flex items-center gap-0.5">
                            <ImageIcon size={9} /> {imgCount}
                          </span>
                        )}
                        {docCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white font-medium flex items-center gap-0.5">
                            <FileText size={9} /> {docCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-5">
                  {!imageUrl && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${catConfig.color}`}>
                        <CatIcon size={11} /> {catConfig.label}
                      </span>
                      {update.priority !== 'Normal' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getPriorityColor(update.priority)}`}>
                          <Zap size={8} className="inline mr-0.5" />{update.priority}
                        </span>
                      )}
                      {docCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 flex items-center gap-0.5">
                          <FileText size={9} /> {docCount} doc{docCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 mb-2 text-base group-hover:text-purple-700 transition-colors">{update.title}</h3>
                  {update.content && (
                    <p className="text-gray-500 text-sm mb-3 leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ __html: update.content.replace(/\n/g, '<br/>') }} />
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 mt-3 border-t border-gray-50">
                    <span className="flex items-center gap-1"><Award size={10} /> {update.createdBy}</span>
                    <span>{update.created}</span>
                  </div>
                  {canManage && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(update); }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-medium transition-all"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(update.id); }}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium transition-all"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Update Modal */}
      {viewUpdate && (() => {
        const media = parseMedia(viewUpdate.image);
        const images = media.filter(m => m.type === 'image');
        const documents = media.filter(m => m.type === 'document');
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewUpdate(null)}>
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Images gallery */}
              {images.length > 0 && (
                <div className="w-full bg-gray-100 overflow-hidden rounded-t-2xl relative">
                  {images.length === 1 ? (
                    <img src={resolvedImages[images[0].path] || images[0].path} alt="" className="w-full max-h-[50vh] object-contain" />
                  ) : (
                    <div className="grid grid-cols-2 gap-1 p-1">
                      {images.map((img, i) => (
                        <img key={i} src={resolvedImages[img.path] || img.path} alt="" className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(resolvedImages[img.path] || img.path, '_blank')} />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  {(() => { const c = getCategoryConfig(viewUpdate.category); const CI = c.icon; return <span className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 bg-gradient-to-r ${c.gradient} text-white`}><CI size={12}/> {c.label}</span>; })()}
                  {viewUpdate.priority !== 'Normal' && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${getPriorityColor(viewUpdate.priority)}`}>{viewUpdate.priority}</span>
                  )}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{viewUpdate.title}</h2>
                {viewUpdate.content && (
                  <div className="prose prose-lg max-w-none text-gray-700 mb-6 leading-relaxed whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: viewUpdate.content.replace(/\n/g, '<br/>') }} />
                )}
                {/* Documents section */}
                {documents.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><FileText size={14} /> Attached Documents</h4>
                    <div className="space-y-2">
                      {documents.map((doc, i) => {
                        const docUrl = resolvedImages[doc.path] || '';
                        return (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-200 hover:bg-purple-50/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <File size={18} className="text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{doc.name || 'Document'}</p>
                                <p className="text-xs text-gray-400">{doc.path.split('.').pop()?.toUpperCase() || 'FILE'}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {docUrl && (
                                <>
                                  <a href={docUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" title="Preview">
                                    <Eye size={16} />
                                  </a>
                                  <a href={docUrl} download={doc.name || 'document'} className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors" title="Download">
                                    <Download size={16} />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-100 mt-6">
                  <span className="flex items-center gap-1"><Award size={14} /> Posted by {viewUpdate.createdBy}</span>
                  <span>{viewUpdate.created}</span>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button onClick={() => setViewUpdate(null)} className="btn-secondary w-full py-3 rounded-xl font-semibold">Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  {editId ? <Edit2 size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
                </div>
                {editId ? 'Edit Update' : 'Create New Update'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="input-field"
                  placeholder="Enter update title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                  className="input-field min-h-[120px]"
                  placeholder="Enter update content..."
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="select-field"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="select-field"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multiple Images Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images (Multiple)</label>
                <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  {uploadingImages ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" /> Uploading...</>
                  ) : (
                    <><ImageIcon size={18} className="text-blue-500" /> <span className="font-medium">Click to upload images</span> <span className="text-xs text-gray-400 ml-auto">Select multiple</span></>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleMultiImageUpload(e.target.files);
                      }
                      e.target.value = '';
                    }}
                    disabled={uploadingImages}
                  />
                </label>
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documents (PDF, DOC, Excel, etc.)</label>
                <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors">
                  {uploadingDocs ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" /> Uploading...</>
                  ) : (
                    <><FileText size={18} className="text-purple-500" /> <span className="font-medium">Click to upload documents</span> <span className="text-xs text-gray-400 ml-auto">PDF, DOC, Excel</span></>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleDocUpload(e.target.files);
                      }
                      e.target.value = '';
                    }}
                    disabled={uploadingDocs}
                  />
                </label>
              </div>

              {/* Preview uploaded media */}
              {form.media.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded Files ({form.media.length})</label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {form.media.map((m, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border ${m.type === 'image' ? 'bg-blue-50/50 border-blue-100' : 'bg-purple-50/50 border-purple-100'}`}>
                        {m.type === 'image' ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <img src={resolvedImages[m.path] || ''} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <File size={16} className="text-purple-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{m.name || m.path.split('/').pop()}</p>
                          <p className="text-[10px] text-gray-400">{m.type === 'image' ? 'Image' : 'Document'}</p>
                        </div>
                        <button onClick={() => removeMedia(i)} className="p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience *</label>
                <p className="text-xs text-gray-400 mb-2">Select one or more audiences to send this update to</p>
                <div className="space-y-2">
                  {[
                    { value: 'All FDI', label: 'All Staff — Get Set Flight (FDI)', color: 'text-teal-700 bg-teal-50' },
                    { value: 'All EMT', label: 'All Staff — Look Book Ticket (EMT)', color: 'text-red-700 bg-red-50' },
                    { value: 'All Travelo', label: 'All Staff — Traveloboom (Travelo)', color: 'text-indigo-700 bg-indigo-50' },
                    { value: 'Agent', label: 'Agents Only', color: 'text-blue-700 bg-blue-50' },
                    { value: 'Supervisor', label: 'Supervisors Only', color: 'text-amber-700 bg-amber-50' },
                    { value: 'Manager', label: 'Managers Only', color: 'text-purple-700 bg-purple-50' },
                    { value: 'Admin', label: 'Admins Only', color: 'text-gray-700 bg-gray-50' },
                  ].map(opt => {
                    const selected = (form.targetRoles || '').split(',').map(s => s.trim()).filter(Boolean).filter(v => v !== 'All');
                    const isChecked = selected.includes(opt.value);
                    return (
                      <label key={opt.value} className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border transition-all ${isChecked ? `${opt.color} border-current/20 ring-1 ring-current/10` : 'hover:bg-gray-50 border-transparent'}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let newSelected: string[];
                            if (e.target.checked) {
                              newSelected = [...selected, opt.value];
                            } else {
                              newSelected = selected.filter(v => v !== opt.value);
                            }
                            if (newSelected.length === 0) newSelected = ['All FDI'];
                            setForm(f => ({ ...f, targetRoles: newSelected.join(',') }));
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className={`text-sm font-medium ${isChecked ? '' : 'text-gray-700'}`}>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary flex-1">Cancel</button>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg"
              >
                {saving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Saving...</>
                ) : (
                  <><Save size={16} /> {editId ? 'Update' : 'Publish'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Update?</h3>
              <p className="text-gray-500 text-sm mb-6">This update will be moved to Deleted Logs History. You can restore it later.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deleted Logs History Modal */}
      {showDeletedHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeletedHistory(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Archive size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Deleted Logs History</h2>
                  <p className="text-xs text-gray-500">{deletedUpdates.length} deleted update{deletedUpdates.length !== 1 ? 's' : ''} found</p>
                </div>
              </div>
              <button onClick={() => setShowDeletedHistory(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><X size={20} /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingDeleted ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
                </div>
              ) : deletedUpdates.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Archive size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-600">No Deleted Logs</h3>
                  <p className="text-gray-400 text-sm mt-1">Deleted updates will appear here for recovery</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletedUpdates.map(update => {
                    const catConfig = getCategoryConfig(update.category);
                    const CatIcon = catConfig.icon;
                    return (
                      <div key={update.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${catConfig.color}`}>
                                <CatIcon size={9} /> {catConfig.label}
                              </span>
                              {update.priority !== 'Normal' && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getPriorityColor(update.priority)}`}>
                                  {update.priority}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm truncate">{update.title}</h4>
                            {update.content && (
                              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{update.content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ')}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                              <span className="flex items-center gap-1"><Award size={10} /> {update.createdBy}</span>
                              <span>Created: {update.created}</span>
                              <span>Deleted: {update.modified}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleRestore(update.id)}
                              disabled={restoringId === update.id}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold text-xs rounded-lg transition-all disabled:opacity-50"
                            >
                              {restoringId === update.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-500 border-t-transparent" />
                              ) : (
                                <RotateCcw size={12} />
                              )}
                              Restore
                            </button>
                            <button
                              onClick={() => setPermanentDeleteId(update.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-semibold text-xs rounded-lg transition-all"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setShowDeletedHistory(false)} className="btn-secondary w-full py-2.5 rounded-xl font-semibold text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation */}
      {permanentDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Permanently Delete?</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone. The update will be permanently removed from the system.</p>
              <div className="flex gap-3">
                <button onClick={() => setPermanentDeleteId(null)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">Cancel</button>
                <button onClick={() => handlePermanentDelete(permanentDeleteId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Delete Forever</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
