import React, { useState, useEffect } from 'react';
import { storage } from './lib/storage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProfileDetail from './components/ProfileDetail';
import Analytics from './components/Analytics';
import SalesManager from './components/SalesManager';
import StockManager from './components/StockManager';
import Settings from './components/Settings';
import WeatherManager from './components/WeatherManager';
import PlanManager from './components/PlanManager';
import { AddProfileModal, AddExpenseModal, HarvestModal } from './components/Modals';
import { CropProfile, CategoryType, Expense, SaleEntry, StockEntry, StockSaleEntry, WeatherLog, FarmPlan } from './types';
import {
  AlertCircle, Trash2,
  LayoutDashboard, Zap, Wallet, Package, BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Bottom nav items (mobile) ─────────────────────────────────────────────────
const BOTTOM_NAV = [
  { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'live',      label: 'সচল',        icon: Zap             },
  { id: 'sales',     label: 'বিক্রি',     icon: Wallet          },
  { id: 'stocks',    label: 'স্টক',       icon: Package         },
  { id: 'analytics', label: 'বিশ্লেষণ',  icon: BarChart3       },
] as const;

type View = 'dashboard' | 'profile-detail' | 'analytics' | 'fields' | 'harvesting' | 'sales' | 'stocks' | 'weather' | 'plans' | 'settings' | 'live' | 'archived';

export default function App() {
  const [profiles, setProfiles] = useState<CropProfile[]>([]);
  const [weatherLogs, setWeatherLogs] = useState<WeatherLog[]>([]);
  const [farmPlans, setFarmPlans] = useState<FarmPlan[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Custom dialog state
  const [dialog, setDialog] = useState<{ 
    isOpen: boolean; 
    type: 'alert' | 'confirm'; 
    message: string; 
    onConfirm: () => void;
  }>({ isOpen: false, type: 'alert', message: '', onConfirm: () => {} });

  // Modal states
  const [showAddProfile, setShowAddProfile] = useState<{ editData?: CropProfile, defaultType?: 'cultivation' | 'stock' } | null>(null);
  const [showAddExpense, setShowAddExpense] = useState<{ category: CategoryType, editData?: Expense } | null>(null);
  const [showHarvestModal, setShowHarvestModal] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const loadedProfiles = await storage.getProfiles();
      const migrated = loadedProfiles.map(p => ({
        ...p,
        status: p.status || 'live',
        active: p.active ?? true
      }));
      setProfiles(migrated);

      const loadedWeatherLogs = await storage.getWeatherLogs();
      setWeatherLogs(loadedWeatherLogs);

      const loadedPlans = await storage.getPlans();
      setFarmPlans(loadedPlans);

      // Apply Saved Settings (UI prefs stay in localStorage)
      const themeColor = localStorage.getItem('app-theme-color') || '#d9f35c';
      const fontSize = localStorage.getItem('app-font-size') || '1rem';
      const darkMode = localStorage.getItem('app-dark-mode') === 'true';
      document.documentElement.style.setProperty('--primary-theme', themeColor);
      document.documentElement.style.fontSize = fontSize;
      if (darkMode) document.documentElement.classList.add('dark');
    })();
  }, []);

  const handleCreateProfile = (name: string, startDate: string, landSize: string, expectedSale: number, type: 'cultivation' | 'stock') => {
    const newProfile: CropProfile = {
      id: Date.now().toString(),
      name,
      startDate,
      landSize,
      expenses: [],
      active: true,
      status: 'live',
      type,
      expectedSale
    };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    storage.createProfile(newProfile);
    setShowAddProfile(null);
  };

  const handleUpdateProfile = (name: string, startDate: string, landSize: string, expectedSale: number, type: 'cultivation' | 'stock') => {
    if (!activeProfileId) return;
    const updated = profiles.map(p =>
      p.id === activeProfileId ? { ...p, name, startDate, landSize, expectedSale, type } : p
    );
    setProfiles(updated);
    const changed = updated.find(p => p.id === activeProfileId);
    if (changed) storage.updateProfile(changed);
    setShowAddProfile(null);
  };

  const handleSaveSale = (profileId: string, sale: SaleEntry) => {
    const updated = profiles.map(p => {
      if (p.id === profileId) {
        const sales = [...(p.sales || []), sale];
        const actualSale = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        
        // If it's a live cultivation project, archive it upon sale
        const isLive = (p.status || 'live') === 'live';
        const isCultivation = (p.type || 'cultivation') === 'cultivation';
        
        return {
          ...p,
          sales,
          actualSale,
          status: isLive && isCultivation ? 'archived' : p.status,
          archivedDate: isLive && isCultivation ? new Date().toISOString() : p.archivedDate
        };
      }
      return p;
    });
    setProfiles(updated);
    const changed = updated.find(p => p.id === profileId);
    if (changed) storage.updateProfile(changed);
  };

  const handleDeleteSale = (profileId: string, saleId: string) => {
    const updated = profiles.map(p => {
      if (p.id === profileId) {
        const sales = (p.sales || []).filter(s => s.id !== saleId);
        const actualSale = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        return { ...p, sales, actualSale };
      }
      return p;
    });
    setProfiles(updated);
    const changed = updated.find(p => p.id === profileId);
    if (changed) storage.updateProfile(changed);
  };

  const handleDeleteProfile = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;
    
    // Check if it's a cultivation project that is currently live
    const isCultivation = (profile.type === 'cultivation' || !profile.type);
    const isLive = (profile.status || 'live') === 'live';
    
    // Only restrict deletion if it's a live cultivation project
    // Stock-only products should be deletable even if status is live
    if (isLive && isCultivation && (profile.expenses.length > 0) && profile.type !== 'stock') {
      setDialog({
        isOpen: true,
        type: 'alert',
        message: 'দুঃখিত! এই পণ্যটি বর্তমানে একটি সচল প্রজেক্ট (Live) এবং এটি ডিলিট করা যাবে না। ডিলিট করতে চাইলে প্রথমে এটিকে আর্কাইভ করতে হবে।',
        onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setDialog({
      isOpen: true,
      type: 'confirm',
      message: `${profile.name} ডিলিট করতে চান?`,
      onConfirm: () => {
        const updated = profiles.filter(p => p.id !== id);
        setProfiles(updated);
        storage.deleteProfile(id);
        if (activeProfileId === id) {
          setActiveProfileId(null);
          setCurrentView('dashboard');
        }
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveStock = (profileId: string, stock: StockEntry) => {
    const updated = profiles.map(p => {
      if (p.id === profileId) {
        const isLive = (p.status || 'live') === 'live';
        const shouldArchive = isLive && (p.type === 'cultivation' || !p.type);
        return { 
          ...p, 
          stocks: [...(p.stocks || []), stock],
          status: shouldArchive ? 'archived' : p.status,
          archivedDate: shouldArchive ? new Date().toISOString() : p.archivedDate
        };
      }
      return p;
    });
    setProfiles(updated);
    const changed = updated.find(p => p.id === profileId);
    if (changed) storage.updateProfile(changed);
  };

  const handleDeleteStock = (profileId: string, stockId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    const isCultivation = (profile.type || 'cultivation') === 'cultivation';
    const isLive = (profile.status || 'live') === 'live';
    
    if (isLive && isCultivation) {
      setDialog({
        isOpen: true,
        type: 'alert',
        message: 'দুঃখিত! এই সচল প্রজেক্টটি বর্তমানে লাইভ আছে এবং এর স্টক এন্ট্রি ডিলিট করা যাবে না।',
        onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setDialog({
      isOpen: true,
      type: 'confirm',
      message: 'এই স্টক এন্ট্রিটি ডিলিট করতে চান?',
      onConfirm: () => {
        const updated = profiles.map(p => {
          if (p.id === profileId) {
            return { ...p, stocks: (p.stocks || []).filter(s => s.id !== stockId) };
          }
          return p;
        });
        setProfiles(updated);
        const changed = updated.find(p => p.id === profileId);
        if (changed) storage.updateProfile(changed);
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveStockSale = (profileId: string, sale: StockSaleEntry) => {
    const updated = profiles.map(p => {
      if (p.id === profileId) {
        const stockSales = [...(p.stockSales || []), sale];
        return { ...p, stockSales };
      }
      return p;
    });
    setProfiles(updated);
    const changed = updated.find(p => p.id === profileId);
    if (changed) storage.updateProfile(changed);
  };

  const handleDeleteStockSale = (profileId: string, saleId: string) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      message: 'এই সেলস রেকর্ডটি ডিলিট করতে চান?',
      onConfirm: () => {
        const updated = profiles.map(p => {
          if (p.id === profileId) {
            return { ...p, stockSales: (p.stockSales || []).filter(s => s.id !== saleId) };
          }
          return p;
        });
        setProfiles(updated);
        const changed = updated.find(p => p.id === profileId);
        if (changed) storage.updateProfile(changed);
        setDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleArchiveProfile = (id: string) => {
    const updated = profiles.map(p => {
      if (p.id === id) {
        const currentStatus = p.status || 'live';
        const newStatus: 'live' | 'archived' = currentStatus === 'live' ? 'archived' : 'live';
        return {
          ...p,
          status: newStatus,
          archivedDate: newStatus === 'archived' ? new Date().toISOString() : undefined,
        };
      }
      return p;
    });
    setProfiles(updated);
    const changed = updated.find(p => p.id === id);
    if (changed) storage.updateProfile(changed);
  };

  const handleSaveWeatherLog = (log: WeatherLog) => {
    setWeatherLogs(prev => [...prev, log]);
    storage.addWeatherLog(log);
  };

  const handleDeleteWeatherLog = (id: string) => {
    setWeatherLogs(prev => prev.filter(l => l.id !== id));
    storage.deleteWeatherLog(id);
  };

  const handleSavePlan = (plan: FarmPlan) => {
    setFarmPlans(prev => [...prev, plan]);
    storage.addPlan(plan);
  };

  const handleDeletePlan = (id: string) => {
    setFarmPlans(prev => prev.filter(p => p.id !== id));
    storage.deletePlan(id);
  };

  const handleTogglePlanStatus = (id: string) => {
    const newStatus = farmPlans.find(p => p.id === id)?.status === 'pending' ? 'completed' : 'pending' as const;
    setFarmPlans(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    storage.updatePlanStatus(id, newStatus);
  };

  const handleSaveExpense = (data: { category: string, amount: number, advance: number, due: number, date: string, note: string, image: string }) => {
    if (!activeProfileId || !showAddExpense) return;
    const { editData } = showAddExpense;
    const updated = profiles.map(p => {
      if (p.id === activeProfileId) {
        let updatedExpenses;
        if (editData) {
          updatedExpenses = p.expenses.map(e => e.id === editData.id ? { ...e, ...data } : e);
        } else {
          const newExpense: Expense = {
            id: Date.now().toString(),
            ...data
          };
          updatedExpenses = [...p.expenses, newExpense];
        }
        return { ...p, expenses: updatedExpenses };
      }
      return p;
    });
    setProfiles(updated);
    const changed = updated.find(p => p.id === activeProfileId);
    if (changed) storage.updateProfile(changed);
    setShowAddExpense(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!activeProfileId) return;
    const updated = profiles.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, expenses: p.expenses.filter(e => e.id !== expenseId) };
      }
      return p;
    });
    setProfiles(updated);
    const changed = updated.find(p => p.id === activeProfileId);
    if (changed) storage.updateProfile(changed);
  };

  const handleSaveHarvest = () => {
    // Basic harvest handler - can be expanded if needed
    setShowHarvestModal(false);
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  
  const renderContent = () => {
    if (currentView === 'profile-detail' && activeProfile) {
      return (
        <ProfileDetail 
          profile={activeProfile}
          onBack={() => {
            setCurrentView('dashboard');
            setActiveProfileId(null);
          }}
          onEditProfile={() => setShowAddProfile({ editData: activeProfile })}
          onHarvest={() => setShowHarvestModal(true)}
          onAddExpense={(cat) => setShowAddExpense({ category: cat })}
          onEditExpense={(exp) => setShowAddExpense({ category: exp.category, editData: exp })}
          onDeleteExpense={handleDeleteExpense}
          onArchive={() => handleArchiveProfile(activeProfile.id)}
          onDelete={() => handleDeleteProfile(activeProfile.id)}
        />
      );
    }

    const filteredProfiles = currentView === 'archived' || currentView === 'live'
      ? profiles.filter(p => (p.status || 'live') === currentView)
      : profiles.filter(p => (p.status || 'live') === 'live');

    // Filter by type if in 'live' or 'dashboard' view to separate cultivations from external products
    const displayProfiles = (currentView === 'dashboard' || currentView === 'live')
      ? filteredProfiles.filter(p => (p.type || 'cultivation') === 'cultivation')
      : filteredProfiles;

    switch (currentView) {
      case 'dashboard':
      case 'live':
      case 'archived':
        return (
          <Dashboard 
            view={currentView}
            profiles={displayProfiles}
            allProfiles={profiles}
            weatherLogs={weatherLogs}
            farmPlans={farmPlans}
            onAddProfile={() => setShowAddProfile({})}
            onSelectProfile={(id) => {
              setActiveProfileId(id);
              setCurrentView('profile-detail');
            }}
            onViewWeather={() => setCurrentView('weather')}
            onViewPlans={() => setCurrentView('plans')}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        );
      case 'analytics':
        return (
          <Analytics 
            profiles={profiles}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        );
      case 'weather':
        return (
          <WeatherManager 
            logs={weatherLogs}
            onAddLog={handleSaveWeatherLog}
            onDeleteLog={handleDeleteWeatherLog}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        );
      case 'plans':
        return (
          <PlanManager 
            plans={farmPlans}
            onAddPlan={handleSavePlan}
            onDeletePlan={handleDeletePlan}
            onToggleStatus={handleTogglePlanStatus}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        );
      case 'sales':
        return (
          <SalesManager 
            profiles={profiles}
            onAddSale={handleSaveSale}
            onDeleteSale={handleDeleteSale}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        );
          case 'stocks':
        return (
          <StockManager 
            profiles={profiles}
            onAddStock={handleSaveStock}
            onAddStockSale={handleSaveStockSale}
            onDeleteStock={handleDeleteStock}
            onDeleteStockSale={handleDeleteStockSale}
            onDeleteProfile={handleDeleteProfile}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onAddProfile={() => setShowAddProfile({ defaultType: 'stock' })}
          />
        );
      case 'settings':
        return (
          <Settings 
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onResetData={handleResetData}
          />
        );
      case 'fields':
        return (
           <div className="p-8 text-center bg-white rounded-3xl shadow-premium border border-border-subtle mt-20">
              <h2 className="text-xl font-bold">Manage Fields</h2>
              <p className="text-text-main/40 mt-2">All your agricultural projects will be listed here.</p>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="mt-6 px-6 py-3 bg-secondary text-primary font-bold rounded-xl"
              >
                Go to Dashboard
              </button>
           </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-text-main/20">
            <h2 className="text-2xl font-black uppercase tracking-widest">{currentView} Coming Soon</h2>
            <button onClick={() => setCurrentView('dashboard')} className="mt-4 text-xs font-black text-primary underline underline-offset-4">Back to Dashboard</button>
          </div>
        );
    }
  };

  const handleResetData = async () => {
    // Delete all profiles from server
    for (const p of profiles) storage.deleteProfile(p.id);
    for (const l of weatherLogs) storage.deleteWeatherLog(l.id);
    for (const pl of farmPlans) storage.deletePlan(pl.id);
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-bg-page selection:bg-secondary selection:text-primary overflow-x-hidden">
      {/* Sidebar - Desktop and Mobile Drawer */}
      <Sidebar 
        activeTab={currentView} 
        setActiveTab={(tab) => setCurrentView(tab as View)} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area — extra bottom padding on mobile for bottom nav */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto overflow-x-hidden pb-20 lg:pb-0">
        {renderContent()}
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-primary border-t border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
      >
        <div className="flex items-center justify-around py-1.5 px-1">
          {BOTTOM_NAV.map(({ id, label, icon: Icon }) => {
            const isActive = currentView === id || (id === 'live' && currentView === 'profile-detail');
            return (
              <button
                key={id}
                onClick={() => setCurrentView(id as View)}
                className={`flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-all active:scale-95 ${
                  isActive ? '' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-secondary' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                </div>
                <span className={`text-[9px] font-bold ${isActive ? 'text-secondary' : ''}`}>{label}</span>
              </button>
            );
          })}
          {/* "More" opens the sidebar drawer for the remaining items */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl text-white/40 hover:text-white/70 active:scale-95 transition-all"
          >
            <div className="p-1.5 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <span className="text-[9px] font-bold">আরও</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {showAddProfile && (
        <AddProfileModal 
          editData={showAddProfile.editData}
          defaultType={showAddProfile.defaultType}
          onClose={() => setShowAddProfile(null)}
          onSave={showAddProfile.editData ? handleUpdateProfile : handleCreateProfile}
        />
      )}

      {showHarvestModal && (
        <HarvestModal 
          onClose={() => setShowHarvestModal(false)}
          onSave={handleSaveHarvest}
        />
      )}

      {showAddExpense && (activeProfileId || showAddExpense) && (
        <AddExpenseModal 
          category={showAddExpense.category}
          editData={showAddExpense.editData}
          onClose={() => setShowAddExpense(null)}
          onSave={handleSaveExpense}
        />
      )}

      {/* Global Dialog Modal */}
      <AnimatePresence>
        {dialog.isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden border border-border-subtle"
            >
              <div className="p-8 text-center space-y-6">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${dialog.type === 'alert' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                  {dialog.type === 'alert' ? (
                    <AlertCircle className="w-8 h-8" strokeWidth={3} />
                  ) : (
                    <Trash2 className="w-8 h-8" strokeWidth={3} />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-primary">সতর্কবার্তা</h3>
                  <p className="text-sm font-bold text-text-main/60 leading-relaxed">
                    {dialog.message}
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  {dialog.type === 'confirm' && (
                    <button 
                      onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                      className="flex-1 py-4 bg-bg-page border border-border-subtle text-primary font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-sm"
                    >
                      না, ফিরে যান
                    </button>
                  )}
                  <button 
                    onClick={dialog.onConfirm}
                    className="flex-1 py-4 bg-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                  >
                    {dialog.type === 'confirm' ? 'হ্যাঁ, ডিলিট করুন' : 'ঠিক আছে'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
