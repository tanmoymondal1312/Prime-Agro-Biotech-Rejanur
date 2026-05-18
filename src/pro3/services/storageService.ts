import { Profile, Cow } from '../types';



const API = {
  profiles: '/api/profiles.php',
  profile:  '/api/profile.php',
  cows:     '/api/cows.php',
  cow:      '/api/cow.php',
};

// XHR helper with upload progress support
function xhrRequest(
  method: string,
  url: string,
  body: FormData | string | null,
  onProgress?: (pct: number) => void,
  contentType?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (contentType) xhr.setRequestHeader('Content-Type', contentType);

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { resolve({}); }
      } else {
        try { reject(new Error(JSON.parse(xhr.responseText)?.error || 'Request failed')); }
        catch { reject(new Error('Request failed')); }
      }
    });
    xhr.addEventListener('error', () => reject(new Error('নেটওয়ার্ক সমস্যা হয়েছে')));
    xhr.send(body);
  });
}

export const storageService = {
  // ── Profiles ──────────────────────────────────────────────────────────────
  getProfiles: async (): Promise<Profile[]> => {
    try {
      const res = await fetch(API.profiles);
      if (!res.ok) throw new Error('Failed to fetch profiles');
      return res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  saveProfile: async (
    name: string,
    photoFile?: File | null,
    onProgress?: (pct: number) => void
  ): Promise<Profile> => {
    const newProfile: Profile = {
      id:        Math.random().toString(36).substr(2, 9),
      name,
      ownerUid:  'local-user',
      createdAt: new Date().toISOString(),
    };

    const fd = new FormData();
    fd.append('id',        newProfile.id);
    fd.append('name',      newProfile.name);
    fd.append('ownerUid',  newProfile.ownerUid);
    fd.append('createdAt', newProfile.createdAt);

    if (photoFile) {
      fd.append('photo', photoFile);
    }

    const res = await xhrRequest('POST', API.profiles, fd, onProgress);
    if (res?.photoUrl) newProfile.photoUrl = res.photoUrl;
    return newProfile;
  },

  updateProfile: async (
    id: string,
    updates: Partial<Profile>,
    photoFile?: File | null,
    onProgress?: (pct: number) => void
  ): Promise<void> => {
    if (photoFile) {
      const fd = new FormData();
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      fd.append('photo', photoFile);
      await xhrRequest('POST', `${API.profile}?id=${id}`, fd, onProgress);
    } else {
      await fetch(`${API.profile}?id=${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(updates),
      });
    }
  },

  deleteProfile: async (id: string): Promise<void> => {
    await fetch(`${API.profile}?id=${id}`, { method: 'DELETE' });
  },

  // ── Cows ──────────────────────────────────────────────────────────────────
  getCows: async (): Promise<Cow[]> => {
    try {
      const res = await fetch(API.cows);
      if (!res.ok) throw new Error('Failed to fetch animals');
      return res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  saveCow: async (
    cowData: any,
    category: 'Cow' | 'Goat',
    cowImageFile?: File | null,
    receiptImageFile?: File | null,
    onProgress?: (pct: number) => void
  ): Promise<Cow> => {
    const newCow: Cow = {
      ...cowData,
      category,
      id:        Math.random().toString(36).substr(2, 9),
      ownerUid:  'local-user',
      createdAt: new Date().toISOString(),
    };

    if (cowImageFile || receiptImageFile) {
      const fd = new FormData();
      fd.append('data', JSON.stringify(newCow));
      if (cowImageFile)     fd.append('cowImage',     cowImageFile);
      if (receiptImageFile) fd.append('receiptImage', receiptImageFile);
      await xhrRequest('POST', API.cows, fd, onProgress);
    } else {
      const res = await fetch(API.cows, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(newCow),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(err.message || 'Failed to save animal');
      }
    }

    return newCow;
  },

  updateCow: async (id: string, updates: Partial<Cow>): Promise<void> => {
    // Callers must pass the full cow object (or at minimum all required fields).
    // Do NOT re-fetch from server here — that returns stale data and loses
    // in-memory state (e.g. history accumulated before this call).
    await fetch(`${API.cow}?id=${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates),
    });
  },

  deleteCow: async (id: string): Promise<void> => {
    await fetch(`${API.cow}?id=${id}`, { method: 'DELETE' });
  },
};
