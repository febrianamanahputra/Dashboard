import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { Bell, X, HardHat, Truck, Wallet, Globe, LogOut, User } from 'lucide-react';
import SMDashboard from './SM/SMDashboard';
import SCMDashboard from './SCM/SCMDashboard';
import FinanceDashboard from './Finance/FinanceDashboard';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

declare const google: any;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
].join(' ');

type Role = 'SM' | 'SCM' | 'FINANCE' | null;

export default function Layout() {
  const [role, setRole] = useState<Role>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, dismissNotification, markNotificationsAsRead, setAccessToken } = useApp();

  const handleGoogleLogin = async () => {
    // Google OAuth for Sheets ONLY (Firebase Auth removed)
    if (!google?.accounts?.oauth2) {
      console.warn('Google identity script not loaded yet');
      return;
    }
    if (!CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not configured in .env');
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            await GoogleSheetsService.initializeSheet(response.access_token);
          }
        },
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (error) {
      console.error('Google OAuth Error:', error);
    }
  };

  const handleLogout = async () => {
    setAccessToken(null);
    setRole(null);
  };

  const filteredNotifications = notifications.filter(n => 
    role && (n.targetRole === role || n.targetRole === 'ALL')
  );

  const unreadCount = filteredNotifications.filter(n => role && !n.readBy.includes(role)).length;

  useEffect(() => {
    if (showNotifications && role) {
      markNotificationsAsRead(role);
    }
  }, [showNotifications, role, notifications.length]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-slate-200">
      {/* Watermark */}
      <div className="fixed bottom-8 right-8 opacity-[0.03] pointer-events-none select-none z-0">
        <h1 className="text-4xl font-light tracking-[0.2em] text-slate-900 uppercase">FLOW SYSTEM v1.1</h1>
      </div>

      <AnimatePresence mode="popLayout">
        {role === null ? (
          <motion.div
            key="role-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-4"
          >
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl font-semibold text-slate-900 tracking-tight mb-4">Project Dashboard</h1>
              <p className="text-slate-400 text-base font-normal">Pilih divisi untuk mengakses dashboard operasional</p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-8 w-full max-w-7xl px-4">
              <RoleCard 
                title="Team Konstruksi" 
                subtitle="Dashboard WBS, Bobot Progress & Material"
                icon={<HardHat size={24} strokeWidth={2} />}
                onClick={() => setRole('SM')}
                delay={0.3}
                theme="blue"
              />
              <RoleCard 
                title="Team SCM" 
                subtitle="Request Material & Stock Material"
                icon={<Truck size={24} strokeWidth={2} />}
                onClick={() => setRole('SCM')}
                delay={0.4}
                theme="green"
              />
              <RoleCard 
                title="Team Finance" 
                subtitle="Dana Lapangan & Keuangan Proyek"
                icon={<Wallet size={24} strokeWidth={2} />}
                onClick={() => setRole('FINANCE')}
                delay={0.5}
                theme="orange"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10"
          >
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 z-50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setRole(null); setShowNotifications(false); }}
                  className="text-xs uppercase tracking-widest font-bold hover:text-slate-500 transition-colors"
                >
                  ← Keluar
                </button>
                <div className="w-[1px] h-4 bg-slate-200 mx-2" />
                <span className="text-sm font-medium tracking-tight">
                  {role === 'SM' ? 'Dashboard Site Manager' : role === 'SCM' ? 'Dashboard Logistik & SCM' : 'Dashboard Finance'}
                </span>
              </div>
              
              <div className="flex items-center gap-6">
                 {/* Real-time indicator */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-tighter text-slate-400 font-bold">
                      Live Sync
                    </span>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                    title="Reset Session"
                  >
                    <LogOut size={16} />
                  </button>
                  
                  {/* Notification Center Trigger */}
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 hover:bg-slate-50 rounded-full transition-colors group"
                  >
                    <Bell size={20} className="text-slate-400 group-hover:text-slate-900" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </header>

            <main className="pt-20 pb-12 px-6 max-w-7xl mx-auto">
              {role === 'SM' ? <SMDashboard /> : role === 'SCM' ? <SCMDashboard /> : <FinanceDashboard />}
            </main>

            {/* Notification Sidebar Overlay */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[60]"
                  />
                  <motion.div 
                    initial={{ x: 400 }}
                    animate={{ x: 0 }}
                    exit={{ x: 400 }}
                    className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col"
                  >
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Notifikasi</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-900">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {filteredNotifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                          <Bell size={40} className="mb-4" />
                          <p className="text-sm">Belum ada aktifitas</p>
                        </div>
                      ) : (
                        filteredNotifications.map(notif => (
                          <div 
                            key={notif.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              role && !notif.readBy.includes(role) 
                                ? 'bg-slate-50 border-slate-200 shadow-sm' 
                                : 'bg-white border-slate-100 opacity-60'
                            }`}
                          >
                             <div className="flex items-start gap-4">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                  notif.type === 'success' ? 'bg-emerald-500' : 
                                  notif.type === 'update' ? 'bg-blue-500' : 'bg-amber-500'
                                }`} />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-slate-800 leading-relaxed mb-1">{notif.message}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </p>
                                    {notif.locationName && (
                                      <>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                          {notif.locationName}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                                  className="text-slate-300 hover:text-slate-600 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                             </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleCard({ title, subtitle, icon, onClick, delay, theme }: { 
  title: string; 
  subtitle: string; 
  icon: React.ReactElement; 
  onClick: () => void; 
  delay: number;
  theme: 'blue' | 'green' | 'orange';
}) {
  const themes = {
    blue: {
      bg: 'bg-[#3b59df]',
      iconBg: 'bg-white/20',
      shadow: 'shadow-blue-500/20'
    },
    green: {
      bg: 'bg-[#129a73]',
      iconBg: 'bg-white/20',
      shadow: 'shadow-emerald-500/20'
    },
    orange: {
      bg: 'bg-[#f78117]',
      iconBg: 'bg-white/20',
      shadow: 'shadow-orange-500/20'
    }
  };

  const currentTheme = themes[theme];

  return (
    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-80 h-[400px] ${currentTheme.bg} rounded-3xl p-8 text-left group overflow-hidden shadow-2xl ${currentTheme.shadow} transition-all duration-300`}
    >
      {/* Icon Box */}
      <div className={`w-14 h-14 ${currentTheme.iconBg} backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-8 shadow-inner overflow-hidden relative`}>
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 0.95, 1]
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut"
          }}
        >
          {React.cloneElement(icon, { size: 28, strokeWidth: 2 })}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:translate-x-1 transition-transform">{title}</h3>
        <p className="text-white/80 text-sm font-normal leading-relaxed max-w-[220px]">
          {subtitle}
        </p>
        
        <div className="mt-auto pb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white group-hover:gap-4 transition-all">
          Buka Dashboard <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
        </div>
      </div>

      {/* Watermark Logo Bottom Right */}
      <motion.div 
        className="absolute -bottom-16 -right-12 opacity-10 pointer-events-none select-none overflow-hidden mix-blend-overlay group-hover:scale-110 group-hover:rotate-6 transition-all duration-700"
      >
        {React.cloneElement(icon, { size: 280, strokeWidth: 1.5 })}
      </motion.div>
    </motion.button>
  );
}
