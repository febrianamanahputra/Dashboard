import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { Bell, X, HardHat, Truck, Wallet, Globe, LogOut, User, ArrowLeft } from 'lucide-react';
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
    if (!google?.accounts?.oauth2) return;
    if (!CLIENT_ID) return;

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
    <div className="min-h-screen bg-black font-sans text-white flex flex-col lg:flex-row h-[100dvh] overflow-hidden">
      
      <AnimatePresence mode="popLayout">
        {role === null ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden bg-ig-black">
            {/* Background Image with Overlay */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url("https://4kwallpapers.com/images/walls/thumbs_3t/26286.jpg")' }}
            />
            <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-[2px]" />
            
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-[380px] flex flex-col items-center relative z-10"
            >
              <div className="mb-12 flex flex-col items-center text-center">
                <h1 className="text-4xl font-light tracking-tight mb-2 italic text-white drop-shadow-lg">Renovki Dashboard</h1>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Smart Construction Management</p>
              </div>

              <div className="w-full space-y-4 bg-white/5 backdrop-blur-3xl p-6 rounded-[32px] border border-white/10 shadow-2xl">
                <h2 className="text-[10px] font-black text-white/40 uppercase ml-1 mb-2 tracking-[0.3em] leading-none">Pilih Divisi</h2>
                
                <RoleAccount 
                  name="Divisi Konstruksi" 
                  role=""
                  icon={<HardHat size={64} className="text-white/10 absolute -right-4 -bottom-4 -rotate-12" />}
                  onClick={() => setRole('SM')}
                  gradient="bg-white/5 hover:bg-white/10"
                />
                <RoleAccount 
                  name="Divisi SCM" 
                  role=""
                  icon={<Truck size={64} className="text-white/10 absolute -right-4 -bottom-4 -rotate-12" />}
                  onClick={() => setRole('SCM')}
                  gradient="bg-white/5 hover:bg-white/10"
                />
                <RoleAccount 
                  name="Divisi Finance" 
                  role=""
                  icon={<Wallet size={64} className="text-white/10 absolute -right-4 -bottom-4 -rotate-12" />}
                  onClick={() => setRole('FINANCE')}
                  gradient="bg-white/5 hover:bg-white/10"
                />
              </div>

              <div className="mt-12 text-center text-white/30 text-[10px] font-bold uppercase tracking-widest">
                v2.0 • Proyek Management App
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div 
            key="main-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col lg:flex-row h-[100dvh] overflow-hidden"
          >
            {/* Desktop Sidebar (Instagram Web Style) */}
            <nav className="hidden lg:flex w-[240px] border-r border-border-ig flex-col p-6 h-full shrink-0">
              <div className="mb-10 px-3 flex flex-col">
                <h1 className="text-2xl font-light tracking-tight italic leading-tight">Renovki</h1>
                <p className="text-[10px] font-bold text-ig-blue uppercase tracking-[0.2em]">Dashboard</p>
              </div>

              <div className="flex-1 space-y-2">
                <SidebarLink 
                  icon={<Globe size={24} />} 
                  label="Dashboard" 
                  active={!showNotifications}
                  onClick={() => setShowNotifications(false)}
                />
                <SidebarLink 
                  icon={<Bell size={24} />} 
                  label="Activity" 
                  badge={unreadCount > 0}
                  active={showNotifications}
                  onClick={() => setShowNotifications(!showNotifications)}
                />
              </div>

              <div className="mt-auto pt-6 border-t border-border-ig">
                <SidebarLink 
                  icon={<LogOut size={24} />} 
                  label="Logout" 
                  onClick={handleLogout}
                />
              </div>
            </nav>

            <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-ig-black">
              {/* Global Background Image with Overlay */}
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("https://4kwallpapers.com/images/walls/thumbs_3t/26286.jpg")' }}
              />
              <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />
              
              <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-transparent z-10">
              {/* Mobile Mobile Header */}
              <header className="lg:hidden h-[60px] border-b border-white/10 flex items-center justify-between px-4 shrink-0 sticky top-0 bg-white/10 backdrop-blur-md z-30">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setRole(null); setShowNotifications(false); }}
                    className="p-1 hover:bg-bg-alt rounded-full transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <span className="font-bold text-lg tracking-tight">
                    {role === 'SM' ? 'Divisi Konstruksi' : role === 'SCM' ? 'Divisi SCM' : 'Divisi Finance'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-1 hover:opacity-70 transition-opacity"
                  >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-[10px] h-[10px] bg-red-500 rounded-full border-2 border-bg-base" />
                    )}
                  </button>
                  <button onClick={handleLogout} className="p-1 hover:opacity-70 transition-opacity">
                    <LogOut size={24} />
                  </button>
                </div>
              </header>

              <main className="flex-1 overflow-hidden p-0 lg:max-w-4xl lg:mx-auto lg:w-full relative">
                <div className="h-full">
                  <motion.div
                    key={role}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full"
                  >
                    {role === 'SM' ? <SMDashboard /> : role === 'SCM' ? <SCMDashboard /> : <FinanceDashboard />}
                  </motion.div>
                </div>
              </main>

              {/* Mobile Bottom Navigation (Instagram Style) - Only for SCM as others have their own */}
              {(role === 'SCM') && (
                <footer className="lg:hidden h-[50px] border-t border-white/10 flex items-center justify-around bg-white/10 backdrop-blur-md shrink-0">
                  <button onClick={() => setShowNotifications(false)} className="p-2">
                    <Globe size={24} className={!showNotifications ? 'text-white' : 'text-white/40'} />
                  </button>
                  <button onClick={() => setShowNotifications(true)} className="p-2 relative">
                    <Bell size={24} className={showNotifications ? 'text-white' : 'text-white/40'} />
                    {unreadCount > 0 && <span className="absolute top-2 right-2 w-[8px] h-[8px] bg-red-500 rounded-full border border-white/20" />}
                  </button>
                </footer>
              )}
            </div>
          </div>

            {/* Notification Sidebar as Modal Overlay for Mobile Feel */}
            <AnimatePresence>
              {showNotifications && [
                  <motion.div 
                    key="notification-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowNotifications(false)}
                    className="absolute inset-0 bg-black/40 z-[40]"
                  />,
                  <motion.div 
                    key="notification-sidebar"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed lg:absolute top-0 right-0 w-full lg:w-[400px] h-full bg-white/10 backdrop-blur-3xl z-[50] flex flex-col border-l border-white/10 shadow-2xl"
                  >
                    <div className="h-[60px] lg:h-[80px] border-b border-white/10 px-6 flex items-center justify-between shrink-0">
                      <h3 className="text-xl font-bold text-white">Activity</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4 pt-4">
                      {filteredNotifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/30">
                          <Bell size={48} strokeWidth={1} className="mb-4 opacity-30 text-white" />
                          <p className="text-sm">No new activity</p>
                        </div>
                      ) : (
                        filteredNotifications.map(notif => (
                          <div key={notif.id} className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0 grow">
                            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center border shadow-sm backdrop-blur-md ${
                              notif.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 
                              notif.type === 'update' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
                            }`}>
                              <Globe size={20} />
                            </div>
                            <div className="flex-1 text-[13px] leading-tight pt-1">
                              <span className="font-bold mr-1 text-white">{notif.locationName || 'System'}</span>
                              <span className="text-white/80">{notif.message}</span>
                              <p className="text-[11px] text-white/40 mt-1.5 font-medium">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <button onClick={() => dismissNotification(notif.id)} className="text-white/30 p-1 opacity-40 hover:opacity-100">
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                ]
              }
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleAccount({ name, role, gradient, icon, onClick }: { 
  name: string; 
  role: string; 
  gradient: string;
  icon: React.ReactElement; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/20 transition-all group backdrop-blur-md relative overflow-hidden ${gradient}`}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className="text-left">
          <p className="font-black text-[16px] text-white tracking-tight uppercase">{name}</p>
          {role && <p className="text-white/40 text-[11px] font-black uppercase tracking-widest mt-1">{role}</p>}
        </div>
      </div>
      <div className="relative z-10">
        <div className="px-5 py-2 bg-white/10 text-white border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-xl">
          Masuk
        </div>
      </div>
      {icon}
    </button>
  );
}

function SidebarLink({ icon, label, active, badge, onClick }: { 
  icon: React.ReactElement; 
  label: string; 
  active?: boolean; 
  badge?: boolean;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all hover:bg-bg-alt group ${active ? 'font-bold' : 'font-medium'}`}
    >
      <div className="relative">
        <span className={`transition-transform duration-200 group-hover:scale-110 block ${active ? 'scale-110' : ''}`}>
          {icon}
        </span>
        {badge && <span className="absolute -top-0.5 -right-0.5 w-[8px] h-[8px] bg-red-500 rounded-full border-2 border-bg-base" />}
      </div>
      <span className="text-[16px]">{label}</span>
    </button>
  );
}
