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
    <div className="min-h-screen bg-bg-base font-sans text-ig-black flex flex-col lg:flex-row h-screen overflow-hidden">
      
      <AnimatePresence mode="popLayout">
        {role === null ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg-base">
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-[350px] flex flex-col items-center"
            >
              <div className="mb-12 flex flex-col items-center">
                <h1 className="text-4xl font-light tracking-tight mb-2 italic">Logistics</h1>
                <p className="text-ig-grey text-[10px] font-bold uppercase tracking-[0.3em] text-center opacity-40">System Access Matrix</p>
              </div>

              <div className="w-full space-y-3">
                <h2 className="text-[11px] font-bold text-ig-grey uppercase ml-1 mb-4 opacity-50 tracking-wider">Saved Accounts</h2>
                
                <RoleAccount 
                  name="Operation SM" 
                  role="Site Manager"
                  icon={<HardHat size={22} className="text-white" />}
                  onClick={() => setRole('SM')}
                  gradient="bg-gradient-to-br from-blue-400 to-blue-600"
                />
                <RoleAccount 
                  name="Logistics SCM" 
                  role="Supply Chain"
                  icon={<Truck size={22} className="text-white" />}
                  onClick={() => setRole('SCM')}
                  gradient="bg-gradient-to-br from-green-400 to-green-600"
                />
                <RoleAccount 
                  name="Consul Finance" 
                  role="Financial Ledger"
                  icon={<Wallet size={22} className="text-white" />}
                  onClick={() => setRole('FINANCE')}
                  gradient="bg-gradient-to-br from-yellow-400 to-orange-500"
                />
              </div>

              <div className="mt-12 text-center">
                <button 
                  onClick={handleGoogleLogin} 
                  className="text-ig-blue text-[13px] font-bold hover:text-black transition-colors"
                >
                  Configure Cloud Sheets Synchronization
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div 
            key="main-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col lg:flex-row h-screen overflow-hidden"
          >
            {/* Desktop Sidebar (Instagram Web Style) */}
            <nav className="hidden lg:flex w-[240px] border-r border-border-ig flex-col p-6 h-full shrink-0">
              <div className="mb-10 px-3 flex flex-col">
                <h1 className="text-2xl font-light tracking-tight italic leading-tight">Logistics</h1>
                <p className="text-[10px] font-bold text-ig-blue uppercase tracking-[0.2em]">
                  {role === 'SM' ? 'Site Manager' : role === 'SCM' ? 'Supply Chain' : 'Finance'}
                </p>
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

            <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-bg-base">
              {/* Mobile Mobile Header */}
              <header className="lg:hidden h-[60px] border-b border-border-ig flex items-center justify-between px-4 shrink-0 sticky top-0 bg-bg-base z-30">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setRole(null); setShowNotifications(false); }}
                    className="p-1 hover:bg-bg-alt rounded-full transition-colors"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <span className="font-bold text-lg tracking-tight">
                    {role === 'SM' ? 'Site Terminal' : role === 'SCM' ? 'Supply Core' : 'Finance Portal'}
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

              <main className="flex-1 overflow-y-auto custom-scrollbar p-0 lg:max-w-4xl lg:mx-auto lg:w-full">
                <div className="min-h-full">
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

              {/* Mobile Bottom Navigation (Instagram Style) */}
              <footer className="lg:hidden h-[50px] border-t border-border-ig flex items-center justify-around bg-bg-base shrink-0">
                <button onClick={() => setShowNotifications(false)} className="p-2">
                   <Globe size={24} className={!showNotifications ? 'text-ig-black' : 'text-ig-grey'} />
                </button>
                <button onClick={() => setShowNotifications(true)} className="p-2 relative">
                   <Bell size={24} className={showNotifications ? 'text-ig-black' : 'text-ig-grey'} />
                   {unreadCount > 0 && <span className="absolute top-2 right-2 w-[8px] h-[8px] bg-red-500 rounded-full border border-bg-base" />}
                </button>
              </footer>
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
                    className="fixed lg:absolute top-0 right-0 w-full lg:w-[400px] h-full bg-bg-base z-[50] flex flex-col border-l border-border-ig shadow-2xl"
                  >
                    <div className="h-[60px] lg:h-[80px] border-b border-border-ig px-6 flex items-center justify-between shrink-0">
                      <h3 className="text-xl font-bold">Activity</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-ig-grey">
                        <X size={24} />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4 pt-4">
                      {filteredNotifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-ig-grey">
                          <Bell size={48} strokeWidth={1} className="mb-4 opacity-30" />
                          <p className="text-sm">No new activity</p>
                        </div>
                      ) : (
                        filteredNotifications.map(notif => (
                          <div key={notif.id} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0 grow">
                            <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center border shadow-sm ${
                              notif.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 
                              notif.type === 'update' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-red-50 border-red-100 text-red-600'
                            }`}>
                              <Globe size={20} />
                            </div>
                            <div className="flex-1 text-[13px] leading-tight pt-1">
                              <span className="font-bold mr-1">{notif.locationName || 'System'}</span>
                              <span className="text-ig-black">{notif.message}</span>
                              <p className="text-[11px] text-ig-grey mt-1.5 font-medium">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <button onClick={() => dismissNotification(notif.id)} className="text-ig-grey p-1 opacity-40 hover:opacity-100">
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
      className="w-full flex items-center justify-between p-4 bg-bg-base border border-border-ig rounded-lg hover:bg-bg-alt transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center border border-white/20 shadow-inner ${gradient}`}>
           {icon}
        </div>
        <div className="text-left">
          <p className="font-bold text-[14px]">{name}</p>
          <p className="text-ig-grey text-[13px] font-medium">{role}</p>
        </div>
      </div>
      <div className="px-5 py-1.5 bg-ig-blue text-white rounded-md text-[12px] font-bold opacity-0 group-hover:opacity-100 transition-all">
        Switch
      </div>
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
