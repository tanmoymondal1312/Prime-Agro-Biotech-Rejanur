import React, { useState } from 'react';
import { Profile, Cow } from '../types';
import { Users, Plus, User, Trash2, Archive, ArchiveRestore, Beef, AlertCircle, Camera, Pencil, Save, X } from 'lucide-react';
import { storageService } from '../services/storageService';
import { ConfirmModal } from './ConfirmModal';

function UploadDialog({ phase, progress, message }: {
  phase: 'uploading' | 'success'; progress: number; message: string;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-[280px] text-center shadow-2xl">
        {phase === 'uploading' ? (
          <>
            <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <div className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-bold text-stone-700 mb-5 text-sm">
              {progress > 0 ? 'ছবি আপলোড হচ্ছে...' : 'সংরক্ষণ হচ্ছে...'}
            </p>
            {progress > 0 && (
              <>
                <div className="h-3 bg-stone-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-4xl font-black text-emerald-600">{progress}%</p>
              </>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-stone-800 text-base leading-snug">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

interface ProfileListProps {
  profiles: Profile[];
  cows?: Cow[];
  onSelectProfile: (p: Profile) => void;
  onRefresh?: () => void;
  onSuccess?: (msg: string) => void;
  hideHeader?: boolean;
  t: any;
}

// ── Small modal shared by Add and Edit ────────────────────────────────────────
function ProfileModal({
  title, initialName, initialPhotoUrl, onClose, onSave,
}: {
  title: string;
  initialName: string;
  initialPhotoUrl?: string | null;
  onClose: () => void;
  onSave: (name: string, photoFile: File | null, progress: (p: number) => void) => Promise<void>;
}) {
  const [name, setName]   = useState(initialName);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialPhotoUrl || null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<{
    open: boolean; phase: 'uploading' | 'success'; progress: number; message: string;
  }>({ open: false, phase: 'uploading', progress: 0, message: '' });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('নাম লিখুন'); return; }
    setError('');
    setDialog({ open: true, phase: 'uploading', progress: 0, message: '' });
    try {
      await onSave(name.trim(), photo, (p) => setDialog(d => ({ ...d, progress: p })));
      const msg = photo
        ? (initialName ? 'ছবি আপডেট হয়েছে!' : 'প্রোফাইল ও ছবি সফলভাবে যোগ হয়েছে!')
        : (initialName ? 'প্রোফাইল আপডেট হয়েছে!' : 'প্রোফাইল সফলভাবে যোগ হয়েছে!');
      setDialog({ open: true, phase: 'success', progress: 100, message: msg });
      setTimeout(() => { setDialog(d => ({ ...d, open: false })); onClose(); }, 2000);
    } catch {
      setDialog(d => ({ ...d, open: false }));
      setError('সংরক্ষণে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
      {dialog.open && <UploadDialog phase={dialog.phase} progress={dialog.progress} message={dialog.message} />}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-stone-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo + Name row */}
        <div className="flex items-center gap-4 mb-5">
          <label className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center cursor-pointer hover:border-emerald-400 active:border-emerald-500 transition-colors shrink-0 group">
            {preview
              ? <img src={preview} alt="" className="w-full h-full object-cover pointer-events-none" />
              : <Camera className="w-7 h-7 text-stone-300 group-hover:text-emerald-400 transition-colors" />
            }
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
            {preview && (
              <div className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1">
                <Camera className="w-3 h-3 text-white" />
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
          <div className="flex-1">
            <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">খামারির নাম *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="যেমন: রহিম সাহেব"
              autoFocus
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-stone-800 font-medium"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 text-stone-500 font-semibold hover:bg-stone-100 rounded-xl transition-colors">
            বাতিল
          </button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            সংরক্ষণ
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProfileList({ profiles, cows = [], onSelectProfile, onRefresh, onSuccess, hideHeader = false, t }: ProfileListProps) {
  const [showAddModal, setShowAddModal]     = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAddSave = async (name: string, photoFile: File | null, onProgress: (p: number) => void) => {
    await storageService.saveProfile(name, photoFile, onProgress);
    onRefresh?.();
    onSuccess?.('প্রোফাইল সফলভাবে যোগ হয়েছে!');
  };

  const handleEditSave = async (name: string, photoFile: File | null, onProgress: (p: number) => void) => {
    if (!editingProfile) return;
    await storageService.updateProfile(editingProfile.id, { name }, photoFile, onProgress);
    onRefresh?.();
    onSuccess?.('প্রোফাইল আপডেট হয়েছে!');
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    await storageService.deleteProfile(confirmDeleteId);
    setConfirmDeleteId(null);
    onRefresh?.();
  };

  const handleToggleArchive = async (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    await storageService.updateProfile(profile.id, {
      isArchived: !profile.isArchived,
      archivedAt: !profile.isArchived ? new Date().toISOString().split('T')[0] : undefined,
    });
    onRefresh?.();
  };

  const activeProfiles   = profiles.filter(p => !p.isArchived);
  const archivedProfiles = profiles.filter(p => p.isArchived);

  const COLORS = [
    { bg: 'bg-blue-50',    border: 'border-blue-100',    text: 'text-blue-600',    icon: 'bg-blue-100',    hover: 'hover:border-blue-300'    },
    { bg: 'bg-purple-50',  border: 'border-purple-100',  text: 'text-purple-600',  icon: 'bg-purple-100',  hover: 'hover:border-purple-300'  },
    { bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-600',   icon: 'bg-amber-100',   hover: 'hover:border-amber-300'   },
    { bg: 'bg-rose-50',    border: 'border-rose-100',    text: 'text-rose-600',    icon: 'bg-rose-100',    hover: 'hover:border-rose-300'    },
    { bg: 'bg-indigo-50',  border: 'border-indigo-100',  text: 'text-indigo-600',  icon: 'bg-indigo-100',  hover: 'hover:border-indigo-300'  },
    { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', icon: 'bg-emerald-100', hover: 'hover:border-emerald-300' },
  ];

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="প্রোফাইল মুছুন"
        message="এই প্রোফাইল ও সব পশুর তথ্য মুছে যাবে। নিশ্চিত?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {showAddModal && (
        <ProfileModal
          title="নতুন প্রোফাইল"
          initialName=""
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSave}
        />
      )}

      {editingProfile && (
        <ProfileModal
          title="প্রোফাইল সম্পাদনা"
          initialName={editingProfile.name}
          initialPhotoUrl={editingProfile.photoUrl}
          onClose={() => setEditingProfile(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-stone-900">{t.profiles}</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            নতুন
          </button>
        </div>
      )}

      {/* Active profiles grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {activeProfiles.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">{t.noData}</p>
            <button onClick={() => setShowAddModal(true)}
              className="mt-4 bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors">
              প্রথম প্রোফাইল তৈরি করুন
            </button>
          </div>
        ) : (
          activeProfiles.map((profile, idx) => {
            const liveCows = cows.filter(c => c.profileId === profile.id && !c.isSold);
            const isAging  = liveCows.some(c => {
              if (c.gender !== 'Bull' && c.gender !== 'Buck') return false;
              return Math.floor((Date.now() - new Date(c.entryDate).getTime()) / 86400000) >= 240;
            });
            const color = isAging
              ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', icon: 'bg-red-100', hover: 'hover:border-red-300' }
              : COLORS[idx % COLORS.length];

            return (
              <div
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className={`relative flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all text-center cursor-pointer active:scale-[0.97] shadow-sm hover:shadow-md ${color.bg} ${color.border} ${color.hover} ${isAging ? 'ring-2 ring-red-100' : ''}`}
              >
                {isAging && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-xl shadow-md z-10 animate-bounce">
                    <AlertCircle className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={(e) => { e.stopPropagation(); setEditingProfile(profile); }}
                    className={`p-1.5 ${color.text} hover:bg-white rounded-lg transition-all shadow-sm z-10`}
                    title="সম্পাদনা">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Photo or add-photo prompt */}
                <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-3 overflow-hidden ${color.icon} shrink-0`}>
                  {profile.photoUrl
                    ? <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" loading="lazy" />
                    : (
                      <>
                        <User className={`w-8 h-8 ${color.text}`} />
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingProfile(profile); }}
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity rounded-2xl gap-0.5"
                          title="ছবি যোগ করুন"
                        >
                          <Camera className="w-4 h-4 text-white" />
                          <span className="text-white text-[8px] font-bold">ছবি যোগ</span>
                        </button>
                      </>
                    )
                  }
                </div>

                <h4 className="font-black text-stone-900 leading-tight mb-0.5 text-sm w-full truncate">{profile.name}</h4>
                <p className={`text-[9px] font-bold uppercase tracking-wider opacity-60 ${color.text} mb-2`}>
                  {t.investor}
                </p>
                <div className={`px-3 py-1 bg-white/60 rounded-lg flex items-center gap-1.5 border border-white/30`}>
                  <Beef className={`w-3 h-3 ${color.text} shrink-0`} />
                  <span className={`text-[10px] font-black ${color.text}`}>
                    {liveCows.length}টি পশু
                  </span>
                </div>

                {/* Bottom action row */}
                <div className="absolute bottom-0 left-0 right-0 flex border-t border-white/30 rounded-b-[2rem] overflow-hidden">
                  <button onClick={(e) => { e.stopPropagation(); setEditingProfile(profile); }}
                    className="flex-1 py-2 text-[10px] font-bold text-stone-500 hover:bg-white/50 flex items-center justify-center gap-1 transition-colors">
                    <Pencil className="w-3 h-3" /> সম্পাদনা
                  </button>
                  <button onClick={(e) => handleToggleArchive(e, profile)}
                    className="flex-1 py-2 text-[10px] font-bold text-stone-500 hover:bg-white/50 flex items-center justify-center gap-1 transition-colors border-l border-white/30">
                    <Archive className="w-3 h-3" /> আর্কাইভ
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(profile.id); }}
                    className="flex-1 py-2 text-[10px] font-bold text-red-400 hover:bg-red-50 flex items-center justify-center gap-1 transition-colors border-l border-white/30">
                    <Trash2 className="w-3 h-3" /> মুছুন
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Archived profiles */}
      {archivedProfiles.length > 0 && (
        <div className="pt-6 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Archive className="w-4 h-4 text-stone-400" />
            <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">আর্কাইভ করা প্রোফাইল</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 opacity-60">
            {archivedProfiles.map((profile) => (
              <div key={profile.id} onClick={() => onSelectProfile(profile)}
                className="flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 border-stone-200 bg-stone-100 text-center group relative cursor-pointer active:scale-95 grayscale">
                <div className="absolute top-3 right-3">
                  <button onClick={(e) => handleToggleArchive(e, profile)}
                    className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10">
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-stone-200 overflow-hidden">
                  {profile.photoUrl
                    ? <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" loading="lazy" />
                    : <User className="w-7 h-7 text-stone-400" />
                  }
                </div>
                <h4 className="font-black text-stone-500 text-sm leading-tight mb-0.5">{profile.name}</h4>
                <p className="text-[9px] text-stone-400 font-bold uppercase">আর্কাইভ</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
