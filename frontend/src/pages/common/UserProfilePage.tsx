import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { usersApi } from '../../services/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/common/Avatar';
import {
  UserCheck,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  GraduationCap,
  MapPin,
  Camera,
  Trash2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  User,
  Briefcase,
  Layers,
  Sparkles,
  X,
  Upload,
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { authUser, role, addToast, updateAuthUser, activeStudent, activeParent } = useApp();

  // Profile Form States
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [relationship, setRelationship] = useState('');

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Loading & Feedback States
  const [profileLoading, setProfileLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Photo Preview & Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form fields from authUser or fallback personas
  useEffect(() => {
    if (authUser) {
      setFullName(authUser.fullName || '');
      setPhone(authUser.phone || '');
      setAddress(authUser.address || '');
      setRelationship(authUser.relationship || (role === 'PARENT' ? 'Guardian' : ''));
    } else if (role === 'STUDENT' && activeStudent) {
      setFullName(activeStudent.name || '');
      setPhone(activeStudent.studentPhone || '');
    } else if (role === 'PARENT' && activeParent) {
      setFullName(activeParent.name || '');
      setPhone(activeParent.phone || '');
      setRelationship(activeParent.relationship || 'Parent');
    }
  }, [authUser, role, activeStudent, activeParent]);

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    if (authUser) {
      setFullName(authUser.fullName || '');
      setPhone(authUser.phone || '');
      setAddress(authUser.address || '');
      setRelationship(authUser.relationship || '');
    }
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);
    setIsEditing(false);
  };

  // Handle Profile Update Submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileErrorMsg('Full name is required and must be at least 2 characters long.');
      return;
    }

    setProfileLoading(true);
    try {
      const payload: any = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };
      if (role === 'PARENT' && relationship.trim()) {
        payload.relationship = relationship.trim();
      }

      const res = await usersApi.updateProfile(payload);
      if (res && res.success && res.user) {
        updateAuthUser(res.user);
        setProfileSuccessMsg('Your profile information has been successfully updated.');
        addToast('Profile Updated', 'Your profile details have been saved to ALTS database.', 'success');
        setIsEditing(false);
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Photo File Selection & Open Preview Dialog
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMsg('Photo size exceeds 5 MB. Please select an image under 5 MB.');
      addToast('File Too Large', 'Maximum allowed profile photo size is 5 MB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file type & extension
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setProfileErrorMsg('Invalid image format. Only JPG, JPEG, PNG, and WebP images are allowed.');
      addToast('Invalid Format', 'Supported formats are JPG, JPEG, PNG, and WebP.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Clean up any existing preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setIsPreviewOpen(true);
    setProfileErrorMsg(null);
  };

  // Confirm and Upload Photo via Multipart Form Data
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setPhotoUploading(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      const res = await usersApi.uploadProfilePhoto(selectedFile);
      if (res && res.success && res.user) {
        updateAuthUser(res.user);
        setProfileSuccessMsg('Profile photo updated successfully across all portals.');
        addToast('Photo Uploaded', 'New profile avatar is active across all portals.', 'success');
        handleCancelUpload();
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to upload profile photo.');
      addToast('Upload Failed', err.message || 'Failed to upload profile photo.', 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Discard Photo Preview and Reset
  const handleCancelUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPreviewOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Photo Removal
  const handleRemovePhoto = async () => {
    setPhotoUploading(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      const res = await usersApi.removeProfilePhoto();
      if (res && res.success && res.user) {
        updateAuthUser(res.user);
        setProfileSuccessMsg('Profile photo removed. Default initials avatar restored.');
        addToast('Photo Removed', 'Profile photo has been reset.', 'info');
      }
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to remove profile photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordErrorMsg('New password cannot be the same as your current password.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await usersApi.changePassword({
        currentPassword,
        newPassword,
      });

      if (res && res.success) {
        setPasswordSuccessMsg('Password changed successfully. Your account is secured.');
        addToast('Password Changed', 'Account credentials updated successfully.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Compute Display Initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name[0] || 'U').toUpperCase();
  };

  // Avatar URL resolution
  const photoUrl = authUser?.avatarUrl || (role === 'STUDENT' ? activeStudent?.photoUrl : null);
  const displayName = authUser?.fullName || (role === 'STUDENT' ? activeStudent?.name : 'ALTS Resident');
  const displayEmail = authUser?.email || 'authenticated@alts.edu.in';
  const displayRole = authUser?.role || role?.toLowerCase() || 'student';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Photo Preview & Confirmation Modal */}
      {isPreviewOpen && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Preview Profile Photo
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancelUpload}
                disabled={photoUploading}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Preview Box */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt="Selected preview"
                  className="w-36 h-36 rounded-2xl object-cover ring-4 ring-blue-500/30 shadow-xl"
                />
                <span className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-md text-xs">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>

              {selectedFile && (
                <div className="mt-4 text-center">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'image'}
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              This photo will be displayed across your profile, dashboard, top navigation, and gate verification records.
            </p>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelUpload}
                disabled={photoUploading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={photoUploading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {photoUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Photo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Identity Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar with Upload Hover Button */}
            <div className="relative group shrink-0">
              <Avatar
                src={photoUrl}
                name={displayName}
                alt={displayName}
                size="2xl"
                shape="rounded"
                className="ring-2 ring-blue-500/30 shadow-md"
              />

              {/* Upload Overlay Action */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                title="Upload or Change Photo"
                className="absolute inset-0 bg-black/50 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold"
              >
                {photoUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-1" />
                    <span>Change</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {displayName}
                </h2>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {displayRole.replace('_', ' ')}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{displayEmail}</span>
              </p>
              {authUser?.rollNumber && (
                <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                  Roll Number: <span className="font-semibold text-blue-600 dark:text-blue-400">{authUser.rollNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Photo Management Actions */}
          <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {photoUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <span>{photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={photoUploading}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {profileSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}
        {profileErrorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileErrorMsg}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Profile Form + Institutional Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Editable Personal Details */}
        <Card>
          <CardHeader
            title="Personal Details"
            subtitle="Manage your contact and communication information"
            action={
              !isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
              ) : null
            }
          />
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditing}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full legal name"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email Address
                </label>
                <input
                  type="email"
                  value={displayEmail}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Institutional email is locked for audit compliance.
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mobile / Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              {role === 'PARENT' && (
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Relationship with Student
                  </label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Father / Mother / Guardian"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Permanent / Residential Address
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter postal address with city, state & PIN code"
                />
              </div>

              {isEditing && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {profileLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={profileLoading}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Read-Only Institutional Record (Role Specific) */}
        <Card>
          <CardHeader
            title="Institutional Allocation"
            subtitle="Verified official credentials and campus assignments"
          />
          <CardContent className="space-y-3.5 text-xs">
            {/* Student Specific Fields */}
            {role === 'STUDENT' && (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Roll Number</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {authUser?.rollNumber || activeStudent?.rollNumber || '21CS042'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Academic Department</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {authUser?.department || activeStudent?.branch || 'Computer Science & Engineering'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Academic Year</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {authUser?.academicYear || activeStudent?.year || '4th Year (B.Tech)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Hostel Complex</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {authUser?.hostelName || activeStudent?.hostelName || 'Chakrika Girls Hostel'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Allocated Room</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    Room {authUser?.roomNumber || activeStudent?.roomNumber || 'B-204'}
                  </span>
                </div>
              </>
            )}

            {/* Warden Specific Fields (Girls & Boys) */}
            {(role === 'GIRLS_WARDEN' || role === 'BOYS_WARDEN') && (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Employee ID</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {authUser?.employeeId || (role === 'GIRLS_WARDEN' ? 'EMP-GW-2026' : 'EMP-BW-2026')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Assigned Hostel Complex</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {authUser?.assignedHostel || (role === 'GIRLS_WARDEN' ? 'Chakrika Girls Hostel' : 'ALTS Boys Hostel')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Jurisdiction Authority</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Chief Resident Warden
                  </span>
                </div>
              </>
            )}

            {/* Gate Security Specific Fields */}
            {role === 'GATE_SECURITY' && (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Security Badge ID</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {authUser?.employeeId || 'SEC-OFF-004'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Duty Assignment</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {authUser?.dutyAssignment || 'Main Campus Gate Turnstile Station 01'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Biometric Clearance Level</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Level 3 Turnstile Authorization
                  </span>
                </div>
              </>
            )}

            {/* Parent Specific Fields */}
            {role === 'PARENT' && (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Linked Resident Student</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {authUser?.linkedStudentName || activeStudent?.name || 'Priya Sharma'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Student Roll Number</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {authUser?.linkedStudentRoll || activeStudent?.rollNumber || '21CS042'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Student Accommodation</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeStudent?.hostelName || 'Chakrika Girls Hostel'} • Room {activeStudent?.roomNumber || 'B-204'}
                  </span>
                </div>
              </>
            )}

            {/* Mess Incharge Specific Fields */}
            {role === 'MESS_INCHARGE' && (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Staff ID</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {authUser?.employeeId || 'MESS-STAFF-01'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Mess Facility</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {authUser?.messAssignment || 'Central Institutional Dining Hall'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Catering Management</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Head Chef & Kitchen Operations
                  </span>
                </div>
              </>
            )}

            {/* Maintenance Incharge Specific Fields */}
            {role === 'MAINTENANCE_INCHARGE' && (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Staff ID</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {authUser?.employeeId || 'MNT-ENG-001'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Assigned Responsibilities</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {authUser?.assignedResponsibilities || 'Campus Electrical, Plumbing & Civil Infrastructure'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-slate-500 font-medium">Work Order Jurisdiction</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Hostel Blocks A, B, C & Mess
                  </span>
                </div>
              </>
            )}

            {/* Common System Verification Invariant */}
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                Official institutional assignments are provisioned by the ALTS Registrar & Administration. To request changes to assigned rooms or blocks, submit a ticket to the administration office.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Password Change Section */}
      <Card>
        <CardHeader
          title="Account Security & Password"
          subtitle="Update your password to keep your ALTS portal account protected"
        />
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg text-xs">
            {passwordSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}
            {passwordErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Password (Minimum 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Enter new strong password"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {passwordLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>Update Password</span>
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
