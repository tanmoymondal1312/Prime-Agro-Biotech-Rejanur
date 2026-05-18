import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  FileText, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 p-2 transition-all duration-300 ${
      active ? 'text-indigo-500' : 'text-gray-400 hover:opacity-100'
    }`}
  >
    <motion.div
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -2 }}
    >
      <Icon size={24} className={active ? 'drop-shadow-[0_0_8px_rgba(96,239,255,0.8)]' : ''} />
    </motion.div>
    <span className="text-[10px] font-medium font-bengali uppercase tracking-wider">{label}</span>
  </button>
);

export const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 glass backdrop-blur-2xl flex items-center justify-around px-6 pb-2 border-t border-white/5">
      <NavItem icon={LayoutDashboard} label="ড্যাশবোর্ড" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
      <NavItem icon={Users} label="গ্রাহক" active={activeTab === 'borrowers'} onClick={() => setActiveTab('borrowers')} />
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab('add')}
        className="w-14 h-14 accent-gradient rounded-full flex items-center justify-center shadow-lg -mt-10"
      >
        <PlusCircle size={28} className="text-white" />
      </motion.button>
      
      <NavItem icon={FileText} label="রিপোর্ট" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
      <NavItem icon={Settings} label="সেটিংস" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
    </div>
  );
};
