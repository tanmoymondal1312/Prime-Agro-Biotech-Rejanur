import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { translations, Language } from './translations';
import { Dashboard } from './components/Dashboard';
import { ProfileList } from './components/ProfileList';
import { CowList } from './components/CowList';
import { CowForm } from './components/CowForm';
import { CowDetail } from './components/CowDetail';
import { Report } from './components/Report';
import { CowGallery } from './components/CowGallery';
import { Profile, Cow, Category } from './types';
import { storageService } from './services/storageService';
import { LogOut, LayoutDashboard, Users, ChevronLeft, Languages, Activity, Archive, FileBarChart, Images, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'profiles' | 'live' | 'archive' | 'add-cow' | 'cow-detail' | 'cows' | 'report' | 'gallery';

// ── URL helpers ───────────────────────────────────────────────────────────────
function catToDb(cat: string): Category {
  return cat === 'goat' ? 'Goat' : 'Cow';
}
function dbToCat(cat: Category | null): string {
  return cat === 'Goat' ? 'goat' : 'cow';
}
function urlToView(urlView?: string): View {
  const map: Record<string, View> = {
    profiles: 'profiles', live: 'live', archive: 'archive',
    report: 'report', gallery: 'gallery',
  };
  return map[urlView || ''] ?? 'dashboard';
}

// ── Toast component ───────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: -20 }}
      animate={{ opacity: 1, scale: 1,    y: 0 }}
      exit={{    opacity: 0, scale: 0.85, y: -20 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-200 font-bold text-sm whitespace-nowrap"
    >
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </motion.div>
  );
}

// ── Fullscreen image overlay ──────────────────────────────────────────────────
function Fullscreen({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{    opacity: 0 }}
      className="fixed inset-0 z-[998] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{    scale: 0.8 }}
        src={src}
        alt=""
        className="max-w-full max-h-full object-contain select-none"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

// ── Top navigation progress bar ───────────────────────────────────────────────
function NavProgress({ view }: { view: string }) {
  const [phase, setPhase] = useState<'idle' | 'run' | 'done'>('idle');
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    setPhase('run');
    const t1 = setTimeout(() => setPhase('done'), 280);
    const t2 = setTimeout(() => setPhase('idle'), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [view]);

  if (phase === 'idle') return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div style={{
        height: '100%',
        background: 'linear-gradient(90deg, #10b981, #34d399)',
        boxShadow: '0 0 10px rgba(16,185,129,0.6)',
        transition: phase === 'run'
          ? 'width 260ms cubic-bezier(0.4,0,0.2,1)'
          : 'width 80ms ease-in, opacity 200ms',
        width: phase === 'run' ? '92%' : '100%',
        opacity: phase === 'done' ? 0 : 1,
      }} />
    </div>
  );
}

export default function App() {
  const { '*': wildcard } = useParams();
  const navigate           = useNavigate();

  // Parse URL parts: /khamar/{cat}/{view}/{id}
  const parts = (wildcard || '').split('/').filter(Boolean);
  const urlCat  = parts[0]; // 'cow' | 'goat' | ''
  const urlView = parts[1]; // 'live' | 'profiles' | 'profile' | 'animal' | ...
  const urlId   = parts[2]; // profile id or animal id

  // ── State ────────────────────────────────────────────────────────────────
  const [lang, setLang]               = useState<Language>('bn');
  const [profiles, setProfiles]       = useState<Profile[]>([]);
  const [cows, setCows]               = useState<Cow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    urlCat ? catToDb(urlCat) : null
  );
  const [view, setView]               = useState<View>(() => {
    if (!urlCat) return 'dashboard';
    if (urlView === 'profile') return 'cows';
    if (urlView === 'animal')  return 'cow-detail';
    return urlToView(urlView);
  });
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedCow, setSelectedCow]         = useState<Cow | null>(null);
  const [genderFilter, setGenderFilter]       = useState<string | null>(null);
  const [toast, setToast]                     = useState<string | null>(null);
  const [fullscreenImg, setFullscreenImg]     = useState<string | null>(null);

  const t            = translations[lang];
  const filteredCows = selectedCategory ? cows.filter(c => c.category === selectedCategory) : [];

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [p, c] = await Promise.all([
      storageService.getProfiles(),
      storageService.getCows(),
    ]);
    setProfiles(p);
    setCows(c);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Restore selected profile/cow from URL after data loads
  useEffect(() => {
    if (!profiles.length && !cows.length) return;
    if (urlView === 'profile' && urlId) {
      const p = profiles.find(pr => pr.id === urlId);
      if (p) setSelectedProfile(p);
    } else if (urlView === 'animal' && urlId) {
      const c = cows.find(co => co.id === urlId);
      if (c) {
        setSelectedCow(c);
        const p = profiles.find(pr => pr.id === c.profileId);
        if (p) setSelectedProfile(p);
      }
    }
  }, [profiles, cows]); // eslint-disable-line

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goTo = useCallback((newView: View, opts?: { profileId?: string; cowId?: string; cat?: Category }) => {
    const cat = dbToCat(opts?.cat ?? selectedCategory ?? 'Cow');
    let path = `/khamar/${cat}`;

    switch (newView) {
      case 'profiles': path += '/profiles';                        break;
      case 'live':     path += '/live';                            break;
      case 'archive':  path += '/archive';                         break;
      case 'report':   path += '/report';                          break;
      case 'gallery':  path += '/gallery';                         break;
      case 'cows':     path += `/profile/${opts?.profileId ?? ''}`;break;
      case 'cow-detail': path += `/animal/${opts?.cowId ?? ''}`;   break;
      case 'add-cow':  /* no URL change, form is in-page */        break;
      default:         /* dashboard = just /khamar/{cat} */        break;
    }

    navigate(path);
    setView(newView);
  }, [selectedCategory, navigate]);

  const selectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    navigate(`/khamar/${dbToCat(cat)}`);
    setView('dashboard');
  };

  const handleLogout = () => { window.location.href = '/home'; };

  const handleHeaderBack = () => {
    setGenderFilter(null);
    if (view === 'dashboard') { setSelectedCategory(null); navigate('/khamar'); }
    else if (view === 'cows') goTo('live');
    else if (view === 'cow-detail') {
      if (selectedCow?.isSold) goTo('archive');
      else if (selectedProfile) goTo('cows', { profileId: selectedProfile.id });
      else goTo('live');
    }
    else if (view === 'add-cow') {
      if (selectedProfile) goTo('cows', { profileId: selectedProfile.id });
      else goTo('live');
    }
    else goTo('dashboard');
  };

  const showToast = (msg: string) => {
    setToast(null);
    setTimeout(() => setToast(msg), 10);
  };

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // ── Category selection screen ─────────────────────────────────────────────
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 overflow-x-hidden">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-stone-900">{t.appName}</h1>
            <p className="text-stone-500 font-medium">{t.selectCategory}</p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => selectCategory('Cow')}
              className="group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border-2 border-stone-100 shadow-xl shadow-stone-200/50 text-left transition-all hover:border-emerald-500"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-[1.5rem] flex items-center justify-center overflow-hidden">
                  <img src="https://img.icons8.com/color/96/cow.png" alt="Cow" className="w-14 h-14" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-stone-900">{t.cowSection}</h3>
                  <p className="text-sm text-stone-500">গরুর খামার পরিচালনা করুন</p>
                </div>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => selectCategory('Goat')}
              className="group relative overflow-hidden bg-white p-8 rounded-[2.5rem] border-2 border-stone-100 shadow-xl shadow-stone-200/50 text-left transition-all hover:border-amber-500"
            >
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-amber-100 rounded-[1.5rem] flex items-center justify-center overflow-hidden">
                  <img src="https://img.icons8.com/color/96/goat.png" alt="Goat" className="w-14 h-14" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-stone-900">{t.goatSection}</h3>
                  <p className="text-sm text-stone-500">ছাগল খামার পরিচালনা করুন</p>
                </div>
              </div>
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => { window.location.href = '/home'; }}
            className="mx-auto flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
            }}
          >
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            হোমে ফিরুন
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  const navItems: { view: View; icon: React.ReactNode; label: string }[] = [
    { view: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: t.dashboard },
    { view: 'profiles',  icon: <Users className="w-5 h-5" />,           label: t.profiles  },
    { view: 'live',      icon: <Activity className="w-5 h-5" />,        label: t.live      },
    { view: 'archive',   icon: <Archive className="w-5 h-5" />,         label: t.archive   },
    { view: 'report',    icon: <FileBarChart className="w-5 h-5" />,    label: 'রিপোর্ট'  },
    { view: 'gallery',   icon: <Images className="w-5 h-5" />,          label: 'গরুর ছবি' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-24 overflow-x-hidden">
      <NavProgress view={view} />
      {/* Global overlays */}
      <AnimatePresence>
        {toast    && <Toast key="toast" message={toast} onDone={() => setToast(null)} />}
        {fullscreenImg && <Fullscreen key="fs" src={fullscreenImg} onClose={() => setFullscreenImg(null)} />}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleHeaderBack} className="p-2 hover:bg-stone-100 rounded-full transition-colors shrink-0">
              <ChevronLeft className="w-6 h-6 text-stone-600" />
            </button>
            <img src="/logo.png" alt="Prime Agro Biotech" className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm" />
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-stone-900 leading-tight">{t.appName}</h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                {selectedCategory === 'Cow' ? t.cowSection : t.goatSection}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-xs font-bold text-stone-600 transition-all"
            >
              <Languages className="w-3.5 h-3.5" />
              {t.switchLanguage}
            </button>
            <button
              onClick={() => { window.location.href = '/home'; }}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              title="হোম পেজ"
            >
              <Home className="w-5 h-5 text-stone-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4">
        <AnimatePresence mode="sync">
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.06 }}>
              <Dashboard
                cows={filteredCows}
                profiles={profiles}
                category={selectedCategory}
                onAddCow={() => setView('add-cow')}
                onFilterCows={(gender) => { setGenderFilter(gender); goTo('live'); }}
                t={t}
              />
            </motion.div>
          )}

          {view === 'profiles' && (
            <motion.div key="profiles" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.06 }}>
              <ProfileList
                profiles={profiles}
                cows={cows}
                onSelectProfile={(p) => {
                  setSelectedProfile(p);
                  goTo('cows', { profileId: p.id });
                }}
                onRefresh={refreshData}
                onSuccess={(msg) => showToast(msg)}
                t={t}
              />
            </motion.div>
          )}

          {view === 'report' && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.06 }}>
              <Report cows={filteredCows} profiles={profiles} t={t} />
            </motion.div>
          )}

          {view === 'live' && (
            <motion.div key="live" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.06 }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-black text-stone-900 uppercase tracking-widest">{t.live}</h2>
                  <div className="text-stone-400 font-bold text-xs uppercase tabular-nums">
                    মোট {profiles.filter(p => cows.some(c => c.profileId === p.id && !c.isSold && c.category === selectedCategory)).length} মালিক
                  </div>
                </div>
                <ProfileList
                  profiles={profiles.filter(p => cows.some(c => c.profileId === p.id && !c.isSold && c.category === selectedCategory))}
                  cows={cows}
                  hideHeader
                  onSelectProfile={(p) => {
                    setSelectedProfile(p);
                    goTo('cows', { profileId: p.id });
                  }}
                  onRefresh={refreshData}
                  onSuccess={(msg) => showToast(msg)}
                  t={t}
                />
              </div>
            </motion.div>
          )}

          {view === 'archive' && (
            <motion.div key="archive" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.06 }}>
              <CowList
                profile={null}
                profiles={profiles}
                category={selectedCategory}
                title={t.archive}
                cows={filteredCows.filter(c => c.isSold)}
                onSelectCow={(c) => { setSelectedCow(c); goTo('cow-detail', { cowId: c.id }); }}
                onAddCow={() => setView('add-cow')}
                onRefresh={refreshData}
                t={t}
              />
            </motion.div>
          )}

          {view === 'gallery' && (
            <motion.div key="gallery" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.06 }}>
              <CowGallery
                cows={filteredCows}
                profiles={profiles}
                category={selectedCategory}
                onSelectCow={(c) => { setSelectedCow(c); goTo('cow-detail', { cowId: c.id }); }}
                onOpenFullscreen={(src) => setFullscreenImg(src)}
              />
            </motion.div>
          )}

          {view === 'cows' && selectedProfile && (
            <motion.div key="cows" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.06 }}>
              <CowList
                profile={selectedProfile}
                profiles={profiles}
                category={selectedCategory}
                cows={filteredCows.filter(c => c.profileId === selectedProfile.id)}
                onSelectCow={(c) => { setSelectedCow(c); goTo('cow-detail', { cowId: c.id }); }}
                onAddCow={() => setView('add-cow')}
                onRefresh={refreshData}
                onBack={() => goTo('live')}
                t={t}
              />
            </motion.div>
          )}

          {view === 'add-cow' && (
            <motion.div key="add-cow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.06 }}>
              <CowForm
                profiles={profiles}
                category={selectedCategory}
                initialProfileName={selectedProfile?.name}
                onCancel={() => {
                  if (selectedProfile) goTo('cows', { profileId: selectedProfile.id });
                  else goTo('live');
                }}
                onSuccess={() => {
                  showToast('পশু সফলভাবে যোগ হয়েছে!');
                  if (selectedProfile) goTo('cows', { profileId: selectedProfile.id });
                  else goTo('live');
                }}
                onRefresh={refreshData}
                t={t}
              />
            </motion.div>
          )}

          {view === 'cow-detail' && selectedCow && (
            <motion.div key="cow-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.06 }}>
              <CowDetail
                cow={selectedCow}
                profiles={profiles}
                onBack={() => {
                  if (selectedCow.isSold) goTo('archive');
                  else if (selectedProfile) goTo('cows', { profileId: selectedProfile.id });
                  else goTo('live');
                }}
                onRefresh={async () => {
                  await refreshData();
                  // Re-sync selectedCow with fresh data
                  const fresh = (await storageService.getCows()).find(c => c.id === selectedCow.id);
                  if (fresh) setSelectedCow(fresh);
                }}
                onAddCowToProfile={(name) => {
                  const p = profiles.find(pr => pr.name === name);
                  if (p) setSelectedProfile(p);
                  setView('add-cow');
                }}
                onSuccess={(msg) => showToast(msg)}
                onOpenFullscreen={(src) => setFullscreenImg(src)}
                t={t}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
        <div className="flex items-center justify-around max-w-2xl mx-auto py-2 px-2">
          {navItems.map(({ view: v, icon, label }) => {
            const isActive = view === v || (v === 'live' && view === 'cows');
            return (
              <button
                key={v}
                onClick={() => { goTo(v); setGenderFilter(null); }}
                className={`flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all active:scale-95 ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {icon}
                <span className="text-[9px] font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
