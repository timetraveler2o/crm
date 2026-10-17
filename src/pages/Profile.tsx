import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCrmStore } from '../store/crmStore';
import { uploadImage, uploadFile, getImageUrl, client } from '../lib/api';
import type { AmadeusCredential } from '../types';
import { User as UserIcon, Mail, Phone, Shield, Save, Camera, Loader2, FileText, Lock, Upload, Eye, EyeOff, Globe, Plus, Trash2, Edit2, MapPin } from 'lucide-react';

export default function Profile() {
  const { currentUser, updateProfile } = useAuthStore();
  const { users, updateUser } = useCrmStore();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [emergencyNumber, setEmergencyNumber] = useState(currentUser?.emergencyNumber || '');
  const [currentAddress, setCurrentAddress] = useState(currentUser?.currentAddress || '');
  const [permanentAddress, setPermanentAddress] = useState(currentUser?.permanentAddress || '');
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
      if (currentUser.image.startsWith('http') || currentUser.image.startsWith('data:')) {
        setAvatarUrl(currentUser.image);
      } else {
        getImageUrl(currentUser.image).then((url) => {
          if (url) setAvatarUrl(url);
        });
      }
    }
  }, [currentUser?.image]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setEmergencyNumber(currentUser.emergencyNumber || '');
      setCurrentAddress(currentUser.currentAddress || '');
      setPermanentAddress(currentUser.permanentAddress || '');
    }
  }, [currentUser]);

  const handleSave = async () => {
    await updateProfile({
      name,
      email,
      phone,
      emergencyNumber,
      currentAddress,
      permanentAddress
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const path = await uploadImage(file);
      if (path) {
        setAvatarUrl(path);
        await updateProfile({ image: path });
      }
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
      if (path) {
        if (type === 'aadharCard') setAadharFile(path);
        if (type === 'panCard') setPanFile(path);
        if (type === 'resume') setResumeFile(path);
        await updateProfile({ [type]: path });
      }
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-sm">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={currentUser?.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    (currentUser?.name || 'User')[0]?.toUpperCase()
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
                <h2 className="text-lg font-bold text-gray-900">{currentUser?.name || 'User'}</h2>
                <p className="text-sm text-gray-500">{currentUser?.role || 'Staff'}</p>
                <span className="badge badge-active mt-1">{currentUser?.status || 'Active'}</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone size={14} className="text-red-500" /> Emergency Number</label>
                  <input value={emergencyNumber} onChange={(e) => setEmergencyNumber(e.target.value)} className="input-field" placeholder="Emergency contact number" disabled={!canEditProfile} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14} /> Current Address</label>
                  <textarea rows={2} value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} className="input-field" placeholder="Current residential address" disabled={!canEditProfile} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14} /> Permanent Address</label>
                  <textarea rows={2} value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} className="input-field" placeholder="Permanent home address" disabled={!canEditProfile} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Shield size={14} /> Role</label>
                  <input value={currentUser?.role || ''} className="input-field bg-gray-50" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Globe size={14} /> Company</label>
                  <input value={currentUser?.company || 'Get Set Flight'} className="input-field bg-gray-50" disabled />
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
            </div>
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
