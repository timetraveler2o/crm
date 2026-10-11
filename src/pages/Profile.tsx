import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCrmStore } from '../store/crmStore';
import { uploadImage, uploadFile, getImageUrl, client } from '../lib/api';
import type { AmadeusCredential } from '../types';
import { User as UserIcon, Mail, Phone, Shield, Save, Camera, Loader2, FileText, Lock, Upload, Eye, EyeOff, Globe, Plus, Trash2, Edit2 } from 'lucide-react';

export default function Profile() {
  const { currentUser, updateProfile } = useAuthStore();
  const { users, updateUser } = useCrmStore();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Documents state
  const [aadharFile, setAadharFile] = useState<string>(currentUser?.aadharCard || '');
  const [panFile, setPanFile] = useState<string>(currentUser?.panCard || '');
  const [resumeFile, setResumeFile] = useState<string>(currentUser?.resume || '');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Amadeus Credentials state
  const userFromStore = users.find(u => u.id === currentUser?.id || String(u.id) === String(currentUser?.id));
  const [amadeusCreds, setAmadeusCreds] = useState<AmadeusCredential[]>(userFromStore?.amadeusCreds || []);
  const [editingAmadeus, setEditingAmadeus] = useState(false);
  const [savingAmadeus, setSavingAmadeus] = useState(false);
  const [amadeusSuccess, setAmadeusSuccess] = useState('');
  const [amadeusError, setAmadeusError] = useState('');

  // All users can manage their OWN Amadeus credentials on Profile page (including Agents)
  const canManageAmadeus = true;

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const isAgent = currentUser?.role === 'Agent';
  const canEditProfile = !isAgent || currentUser?.permissions?.includes('Profile Edit');

  // Keep amadeusCreds in sync with store — but ONLY when NOT editing
  useEffect(() => {
    if (userFromStore?.amadeusCreds && !editingAmadeus) {
      setAmadeusCreds(userFromStore.amadeusCreds);
    }
  }, [userFromStore?.amadeusCreds, editingAmadeus]);

  useEffect(() => {
    if (currentUser?.image) {
      if (currentUser.image.startsWith('http')) {
        setAvatarUrl(currentUser.image);
      } else {
        getImageUrl(currentUser.image).then(setAvatarUrl);
      }
    }
  }, [currentUser?.image]);

  const handleSave = async () => {
    await updateProfile({ name, email, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const path = await uploadImage(file);
      await updateProfile({ image: path });
      // URL will be updated by useEffect
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'aadharCard' | 'panCard' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(type);
    try {
      const path = await uploadFile(file);
      await updateProfile({ [type]: path });
      
      if (type === 'aadharCard') setAadharFile(path);
      if (type === 'panCard') setPanFile(path);
      if (type === 'resume') setResumeFile(path);
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      // Verify current password first by checking against stored user data
      const verifyRes = await client.api.fetch('/api/public/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser?.email, password: currentPassword })
      });
      const verifyData = await verifyRes.json();
      
      if (!verifyRes.ok || !verifyData.success) {
        setPasswordError('Current password is incorrect');
        setChangingPassword(false);
        return;
      }

      // Update password via backend API
      const res = await client.api.fetch(`/api/public/users/${currentUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      if (!res.ok) {
        throw new Error('Failed to update password');
      }

      setPasswordSuccess("Password updated successfully");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error("Failed to update password:", err);
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const getFileDisplayUrl = async (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return await getImageUrl(path);
  };

  const DocumentField = ({ label, type, value, icon: Icon }: { label: string, type: 'aadharCard' | 'panCard' | 'resume', value: string, icon: any }) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
      if (value) {
        getFileDisplayUrl(value).then(setUrl);
      }
    }, [value]);

    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Icon size={16} /> {label}
          </label>
          {value && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
              View File
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={value ? "File uploaded" : "No file chosen"} 
            disabled 
            className="input-field text-sm bg-white" 
          />
          {canEditProfile && (
            <label className="btn-secondary whitespace-nowrap cursor-pointer">
              {uploadingDoc === type ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span className="hidden sm:inline ml-2">Upload</span>
              <input 
                type="file" 
                className="hidden" 
                accept={type === 'resume' ? ".pdf,.doc,.docx" : "image/*,.pdf"} 
                onChange={(e) => handleFileUpload(e, type)} 
                disabled={!!uploadingDoc} 
              />
            </label>
          )}
        </div>
      </div>
    );
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information and documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon size={20} /> Personal Information
            </h2>
            
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name[0]
                  )}
                </div>
                {canEditProfile && (
                  <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors">
                    {uploading ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <Camera size={14} className="text-gray-500" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{currentUser.name}</h2>
                <p className="text-sm text-gray-500">{currentUser.role}</p>
                <span className="badge badge-active mt-1">{currentUser.status}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><UserIcon size={14} /> Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" disabled={!canEditProfile} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Mail size={14} /> Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" disabled={!canEditProfile} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone size={14} /> Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" disabled={!canEditProfile} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Shield size={14} /> Role</label>
                  <input value={currentUser.role} className="input-field bg-gray-50" disabled />
                </div>
              </div>

              {canEditProfile && (
                <div className="mt-6 flex items-center gap-3">
                  <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                    <Save size={16} /> Save Changes
                  </button>
                  {saved && <span className="text-sm text-emerald-600 font-medium animate-pulse">✓ Saved successfully!</span>}
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} /> Documents
            </h2>
            <div className="space-y-4">
              <DocumentField label="Aadhar Card" type="aadharCard" value={aadharFile} icon={FileText} />
              <DocumentField label="PAN Card" type="panCard" value={panFile} icon={FileText} />
              <DocumentField label="Resume" type="resume" value={resumeFile} icon={FileText} />
            </div>
          </div>

          {/* Amadeus Login Credentials Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Globe size={20} className="text-indigo-600" /> Amadeus Login Credentials
              </h2>
              {canManageAmadeus && !editingAmadeus && (
                <button
                  onClick={() => setEditingAmadeus(true)}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  <Edit2 size={13} /> Edit
                </button>
              )}
            </div>

            {amadeusSuccess && (
              <div className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded mb-3">{amadeusSuccess}</div>
            )}

            {amadeusError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-3">{amadeusError}</div>
            )}

            {amadeusCreds.length === 0 && !editingAmadeus && (
              <p className="text-sm text-gray-400 italic">No Amadeus credentials assigned yet.</p>
            )}

            {!editingAmadeus ? (
              /* View Mode */
              <div className="space-y-3">
                {amadeusCreds.map((cred, idx) => (
                  <div key={cred.id} className="border border-indigo-100 rounded-lg p-3 bg-indigo-50/30">
                    <p className="text-xs font-semibold text-indigo-700 mb-2">Credential #{idx + 1}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Amadeus ID</p>
                        <p className="text-sm font-medium text-gray-900">{cred.amadousId || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Username</p>
                        <p className="text-sm font-medium text-gray-900">{cred.username || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Office ID</p>
                        <p className="text-sm font-medium text-gray-900">{cred.officeId || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-3">
                {amadeusCreds.map((cred, idx) => (
                  <div key={cred.id} className="border border-indigo-200 rounded-lg p-3 bg-indigo-50/50 relative">
                    <button
                      type="button"
                      onClick={() => setAmadeusCreds(prev => prev.filter(c => c.id !== cred.id))}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                    <p className="text-xs font-medium text-indigo-700 mb-2">Credential #{idx + 1}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-0.5">Amadeus ID</label>
                        <input
                          value={cred.amadousId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAmadeusCreds(prev => prev.map(c => c.id === cred.id ? { ...c, amadousId: val } : c));
                          }}
                          className="input-field text-sm"
                          placeholder="e.g. HDQRM2100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-0.5">Username</label>
                        <input
                          value={cred.username}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAmadeusCreds(prev => prev.map(c => c.id === cred.id ? { ...c, username: val } : c));
                          }}
                          className="input-field text-sm"
                          placeholder="e.g. AGENT01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-0.5">Office ID</label>
                        <input
                          value={cred.officeId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAmadeusCreds(prev => prev.map(c => c.id === cred.id ? { ...c, officeId: val } : c));
                          }}
                          className="input-field text-sm"
                          placeholder="e.g. DELB228AA"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newCred: AmadeusCredential = { id: Date.now().toString(), amadousId: '', username: '', officeId: '' };
                    setAmadeusCreds(prev => [...prev, newCred]);
                  }}
                  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1 font-medium"
                >
                  <Plus size={12} /> Add Credential
                </button>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={async () => {
                      if (!currentUser) return;
                      setSavingAmadeus(true);
                      setAmadeusError('');
                      setAmadeusSuccess('');
                      try {
                        await updateUser(currentUser.id, { amadeusCreds: amadeusCreds });
                        setAmadeusSuccess('Amadeus credentials saved successfully!');
                        setEditingAmadeus(false);
                        setTimeout(() => setAmadeusSuccess(''), 3000);
                      } catch (err: any) {
                        console.error('Failed to save Amadeus creds:', err);
                        setAmadeusError('Failed to save: ' + (err?.message || 'Please try again.'));
                        setTimeout(() => setAmadeusError(''), 5000);
                      } finally {
                        setSavingAmadeus(false);
                      }
                    }}
                    className="btn-primary text-sm flex items-center gap-1"
                    disabled={savingAmadeus}
                  >
                    {savingAmadeus ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Credentials
                  </button>
                  <button
                    onClick={() => { setAmadeusCreds(userFromStore?.amadeusCreds || []); setEditingAmadeus(false); }}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Password */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lock size={20} /> Change Password
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    className="input-field pr-10" 
                    placeholder="Enter current password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="input-field pr-10" 
                    placeholder="Enter new password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="input-field pr-10" 
                    placeholder="Confirm new password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded">
                  {passwordSuccess}
                </div>
              )}

              <button 
                onClick={handlePasswordChange} 
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
