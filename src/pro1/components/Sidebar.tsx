import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Map as Fields, 
  Zap, 
  Wallet, 
  CloudSun, 
  Settings, 
  LogOut,
  X,
  Archive,
  Package,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'live', label: 'সচল প্রজেক্ট', icon: Zap },
  { id: 'sales', label: 'পণ্য বিক্রি', icon: Wallet },
  { id: 'stocks', label: 'পণ্য স্টক', icon: Package },
  { id: 'weather', label: 'আবহাওয়া', icon: CloudSun },
  { id: 'plans', label: 'পরিকল্পনা', icon: Sparkles },
  { id: 'archived', label: 'আর্কাইভ প্রজেক্ট', icon: Archive },
  { id: 'analytics', label: 'সার্বিক বিশ্লেষণ', icon: BarChart3 },
  { id: 'settings', label: 'সেটিংস', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }: SidebarProps) {
  const content = (
    <div className="flex flex-col h-full bg-primary text-white p-6 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center justify-between mb-12 px-2">
        <div className="flex flex-col gap-4">
          <div className="w-20 h-20 bg-white rounded-full overflow-hidden shadow-2xl border-4 border-secondary/20 group hover:scale-105 transition-transform duration-500">
            <img
              src="/portal-logo.png"
              alt="Prime Agro Biotech"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl tracking-tighter text-secondary leading-none">Prime Agro</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">Biotech Limited</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Back to Portal */}
      <div className="mt-auto pt-6 border-t border-white/10">
        <button
          className="w-full sidebar-link group"
          onClick={() => { window.location.href = '/home'; }}
        >
          <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
          <span className="text-sm font-medium">পোর্টালে ফিরুন</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-[101] lg:hidden shadow-2xl"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
