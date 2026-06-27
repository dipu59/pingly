'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Camera, Loader2, Edit2, Check, X, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/services/authService';
import { updateUserProfile, getUserById } from '@/services/userService';
import { uploadAvatar } from '@/services/cloudinary';
import { getInitials, cn } from '@/lib/utils';
import type { User } from '@/types/user';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authUser) return;
    setLoading(true);
    getUserById(authUser.uid).then((profile) => {
      setUserProfile(profile);
      if (profile) {
        setDisplayName(profile.displayName);
        setBio(profile.bio || '');
      }
      setLoading(false);
    });
  }, [authUser]);

  const handleSave = async () => {
    if (!authUser) return;
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(authUser.uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      setUserProfile((prev) => prev ? { ...prev, displayName: displayName.trim(), bio: bio.trim() } : prev);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setBio(userProfile.bio || '');
    }
    setIsEditing(false);
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Image must be under 20MB');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadAvatar(file, (p) => setUploadProgress(p));
      await updateUserProfile(authUser.uid, { photoURL: url });
      setUserProfile((prev) => prev ? { ...prev, photoURL: url } : prev);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">
        Profile not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your account settings</p>
      </div>

      <div className="mx-auto w-full max-w-lg glass rounded-2xl p-8">
        {/* Avatar Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative group">
            <div
              className="h-28 w-28 rounded-full overflow-hidden flex items-center justify-center text-3xl font-semibold ring-4 ring-violet-500/20 transition-all duration-300"
              style={{ background: 'var(--color-violet-muted)', color: 'var(--color-violet-light)' }}
            >
              {userProfile.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userProfile.photoURL} alt={userProfile.displayName} className="h-full w-full object-cover" />
              ) : (
                getInitials(userProfile.displayName)
              )}
            </div>
            
            {/* Upload Overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <>
                  <Camera className="h-6 w-6 text-white mb-1" />
                  <span className="text-[10px] text-white/90 font-medium uppercase tracking-wider">Change</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          {uploadProgress !== null && (
            <div className="mt-3 w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Form Section */}
        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-400">Display Name</label>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl bg-zinc-800/50 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50 border border-white/5 transition-all"
                placeholder="Enter your name"
                disabled={saving}
              />
            ) : (
              <div className="text-lg font-medium text-white px-1">
                {userProfile.displayName}
              </div>
            )}
          </div>

          {/* Email (Read only) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">Email Address</label>
            <div className="text-sm text-zinc-300 px-1 opacity-80 cursor-not-allowed">
              {userProfile.email}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">Bio</label>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl bg-zinc-800/50 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/50 border border-white/5 transition-all"
                placeholder="Tell us about yourself..."
                disabled={saving}
              />
            ) : (
              <div className="text-sm text-zinc-300 px-1 min-h-[40px]">
                {userProfile.bio || <span className="italic opacity-50">No bio provided</span>}
              </div>
            )}
          </div>

          {/* Actions */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-3 pt-4 border-t border-white/10"
              >
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mx-auto w-full max-w-lg glass rounded-2xl p-8 mt-6">
        <h2 className="text-lg font-bold text-white mb-4">Notifications</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Push Notifications</p>
            <p className="text-xs text-zinc-400 mt-1">Receive alerts for new messages when the app is in the background.</p>
          </div>
          <button
            onClick={async () => {
              if (!authUser) return;
              try {
                const { requestNotificationPermission } = await import('@/lib/firebase/messaging');
                const token = await requestNotificationPermission();
                if (token) {
                  await import('@/services/userService').then(m => m.saveFcmToken(authUser.uid, token));
                  alert('Push notifications enabled successfully!');
                } else {
                  alert('Failed to enable push notifications. Please check browser permissions.');
                }
              } catch (err) {
                console.error(err);
                alert('Error enabling notifications.');
              }
            }}
            className="shrink-0 rounded-xl bg-violet-600/20 px-4 py-2 text-sm font-medium text-violet-300 hover:bg-violet-600/30 transition-colors border border-violet-500/20"
          >
            Enable
          </button>
        </div>
      </div>
      
      {/* Account Settings / Logout */}
      <div className="mx-auto w-full max-w-lg glass rounded-2xl p-8 mt-6 mb-12">
        <h2 className="text-lg font-bold text-red-400 mb-4">Account</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Sign Out</p>
            <p className="text-xs text-zinc-400 mt-1">Log out of your account on this device.</p>
          </div>
          <button
            onClick={async () => {
              try {
                await logout();
              } catch (err) {
                console.error('Logout failed:', err);
                alert('Failed to log out.');
              }
            }}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-red-600/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-600/20 transition-colors border border-red-500/20"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
