import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { clearToken } from '../auth';

const apps = [
  {
    id: 'khamar',
    path: '/khamar',
    title: 'রেজার খামার',
    subtitle: 'গরু ও ছাগলের খামার ব্যবস্থাপনা',
    emoji: '🐄',
    color: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-200',
  },
  {
    id: 'krishi',
    path: '/krishi',
    title: 'সমন্বিত কৃষি ট্রেড',
    subtitle: 'ফসল ব্যবস্থাপনা ও বিক্রয় হিসাব',
    emoji: '🌾',
    color: 'from-lime-500 to-green-600',
    shadow: 'shadow-lime-200',
  },
  {
    id: 'hisab',
    path: '/hisab',
    title: 'দেনা পাওনার হিসাব',
    subtitle: 'ধার ও পাওনা ট্র্যাক করুন',
    emoji: '💰',
    color: 'from-indigo-500 to-purple-600',
    shadow: 'shadow-indigo-200',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    // Also clear pro2 user from localStorage
    localStorage.removeItem('takatrack_user');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-stone-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden shadow-lg border-2 border-emerald-100">
          <img
            src="/portal-logo.png"
            alt="Prime Agro Biotech"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">Prime Agro Biotech</h1>
        <p className="text-stone-400 text-sm mt-1 font-medium">একটি অ্যাপ থেকে সব কিছু পরিচালনা করুন</p>
      </motion.div>

      {/* App Cards */}
      <div className="w-full max-w-sm space-y-4">
        {apps.map((app, i) => (
          <motion.button
            key={app.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(app.path)}
            className={`w-full bg-gradient-to-r ${app.color} p-5 rounded-3xl shadow-lg ${app.shadow} flex items-center gap-5 text-left`}
          >
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">
              {app.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-black text-lg leading-tight">{app.title}</div>
              <div className="text-white/70 text-xs font-medium mt-0.5">{app.subtitle}</div>
            </div>
            <div className="text-white/60 text-2xl font-light">›</div>
          </motion.button>
        ))}
      </div>

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        onClick={handleLogout}
        className="mt-10 flex items-center gap-2 px-6 py-3 text-stone-400 hover:text-red-500 transition-colors text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        লগআউট
      </motion.button>
    </div>
  );
}
