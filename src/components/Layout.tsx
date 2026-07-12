import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { Bell, Heart, X, HardHat, Truck, Wallet, Globe, LogOut, User, ArrowLeft, Send, Trash2 } from 'lucide-react';
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

interface NoteItem {
  id: string;
  text: string;
  color?: 'green' | 'purple' | 'red';
}

export default function Layout() {
  const [role, setRole] = useState<Role>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, dismissNotification, markNotificationsAsRead, setAccessToken } = useApp();
  const [showNotebook, setShowNotebook] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('renovki_notes_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to legacy structure
        const legacy = localStorage.getItem('renovki_notes_v2');
        return legacy ? JSON.parse(legacy) : [];
      }
    }
    const legacy = localStorage.getItem('renovki_notes_v2');
    return legacy ? JSON.parse(legacy) : [];
  });
  const [currentNote, setCurrentNote] = useState('');
  const [selectedNoteColor, setSelectedNoteColor] = useState<'green' | 'purple' | 'red'>('green');

  useEffect(() => {
    localStorage.setItem('renovki_notes_v3', JSON.stringify(notes));
  }, [notes]);

  const saveNote = () => {
    if (!currentNote.trim()) return;
    const newNote: NoteItem = {
      id: Date.now().toString(),
      text: currentNote.trim(),
      color: selectedNoteColor
    };
    setNotes([newNote, ...notes]);
    setCurrentNote('');
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const toggleNoteColor = (id: string) => {
    setNotes(notes.map(n => {
      if (n.id === id) {
        const current = n.color || 'green';
        const next: 'green' | 'purple' | 'red' = 
          current === 'green' ? 'purple' : current === 'purple' ? 'red' : 'green';
        return { ...n, color: next };
      }
      return n;
    }));
  };

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

  useEffect(() => {
    // Initialize history state on mount
    if (!window.history.state) {
      window.history.replaceState({ entry: true, role: null }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      // Priority 1: If notebook or notifications are open, close them first
      if (showNotebook) {
        setShowNotebook(false);
        // Push state back so we stay in the same view context
        window.history.pushState({ role, isSubNav: true }, '');
        return;
      }

      if (showNotifications) {
        setShowNotifications(false);
        // Push state back so we stay in the same view context
        window.history.pushState({ role, isSubNav: true }, '');
        return;
      }

      // Priority 2: If the state says it's a sub-navigation (internal dashboard view/modal)
      // we let the dashboards handle it via their own listeners.
      if (e.state?.isSubNav) {
        return;
      }

      const targetRole = e.state?.role ?? null;

      if (role !== null && targetRole === null) {
        // Going back from dashboard to selection
        setRole(null);
      } else if (role === null && targetRole === null) {
        // Already at selection screen, check for exit
        if (window.confirm('Keluar dari aplikasi?')) {
          // If they confirm, we let it go
        } else {
          // If they cancel, push state again to "trap" the back button
          window.history.pushState({ entry: true, role: null }, '');
        }
      } else if (targetRole !== role) {
        // Handle direct role switching if needed
        setRole(targetRole);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [role, showNotifications]);

  // Push state when role changes to enable back button
  useEffect(() => {
    if (role !== null) {
      // Only push if transition is from null to something
      // or if we want to ensure it's in history
      window.history.pushState({ role, isSubNav: false }, '');
    }
  }, [role]);

  return (
    <div className="min-h-screen bg-black font-sans text-white flex flex-col lg:flex-row h-[100dvh] overflow-hidden">
      
      <AnimatePresence mode="popLayout">
        {role === null ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden bg-black">
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
                <h1 className="text-4xl font-light tracking-tight mb-2 italic text-white drop-shadow-sm">Renovki Dashboard</h1>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Smart Construction Management</p>
              </div>

              <div className="w-full space-y-4 bg-white/5 backdrop-blur-3xl p-6 rounded-[32px] border border-white/10 shadow-2xl">
                <h2 className="text-[10px] font-black text-white/40 uppercase ml-1 mb-2 tracking-[0.3em] leading-none">Pilih Divisi</h2>
                
                <RoleAccount 
                  name="Divisi Konstruksi" 
                  role=""
                  icon={<HardHat size={64} className="text-white/5 absolute -right-4 -bottom-4 -rotate-12" />}
                  onClick={() => setRole('SM')}
                  gradient="bg-white/5 hover:bg-white/10"
                />
                <RoleAccount 
                  name="Divisi SCM" 
                  role=""
                  icon={<Truck size={64} className="text-white/5 absolute -right-4 -bottom-4 -rotate-12" />}
                  onClick={() => setRole('SCM')}
                  gradient="bg-white/5 hover:bg-white/10"
                />
                <RoleAccount 
                  name="Divisi Finance" 
                  role=""
                  icon={<Wallet size={64} className="text-white/5 absolute -right-4 -bottom-4 -rotate-12" />}
                  onClick={() => setRole('FINANCE')}
                  gradient="bg-white/5 hover:bg-white/10"
                />
              </div>

              <div className="mt-12 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest">
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
            <nav className="hidden lg:flex w-[240px] border-r border-white/10 flex-col p-6 h-full shrink-0 bg-black">
              <div className="mb-10 px-3 flex flex-col">
                <h1 className="text-2xl font-light tracking-tight italic leading-tight text-white">Renovki</h1>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Dashboard</p>
              </div>

              <div className="flex-1 space-y-2">
                <SidebarLink 
                  icon={<Globe size={24} />} 
                  label="Dashboard" 
                  active={!showNotifications && !showNotebook}
                  onClick={() => { setShowNotifications(false); setShowNotebook(false); }}
                />
                <SidebarLink 
                  icon={<Send size={24} className="-rotate-12 text-white" />} 
                  label="Notebook" 
                  active={showNotebook}
                  onClick={() => setShowNotebook(true)}
                />
                <SidebarLink 
                  icon={<Bell size={24} />} 
                  label="Activity" 
                  badge={unreadCount > 0}
                  active={showNotifications}
                  onClick={() => { setShowNotifications(!showNotifications); setShowNotebook(false); }}
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

            <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-black text-white">
              {/* Global Background Image with Overlay */}
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("https://4kwallpapers.com/images/walls/thumbs_3t/26286.jpg")' }}
              />
              <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-[2px]" />
              
              <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-transparent z-10">
              {/* Mobile Mobile Header */}
              <header className="lg:hidden h-[60px] border-b border-white/5 flex items-center justify-between px-4 shrink-0 sticky top-0 bg-black/40 backdrop-blur-md z-30">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => window.history.back()}
                    className="p-1 rounded-full transition-colors text-white active:opacity-60"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <span className="font-bold text-lg tracking-tight text-white">
                    {role === 'SM' ? 'Divisi Konstruksi' : role === 'SCM' ? 'Divisi SCM' : 'Divisi Finance'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setShowNotebook(true);
                      window.history.pushState({ role, isSubNav: true }, '');
                    }}
                    className="p-1 transition-opacity text-white opacity-100 active:opacity-60"
                  >
                    <Send size={24} strokeWidth={2} className="-rotate-12" />
                  </button>
                  <button 
                    onClick={() => {
                      if (!showNotifications) {
                        window.history.pushState({ role, isSubNav: true }, '');
                      }
                      setShowNotifications(!showNotifications);
                    }}
                    className="relative p-1 transition-opacity text-white opacity-100 active:opacity-60"
                  >
                    <Bell size={24} strokeWidth={2} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-[10px] h-[10px] bg-red-500 rounded-full border-2 border-black" />
                    )}
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

              {/* Notebook Modal */}
              <AnimatePresence>
                {showNotebook && (
                  <>
                    <motion.div 
                      key="notebook-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotebook(false)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                    />
                    <motion.div 
                      key="notebook-modal"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="fixed bottom-0 left-0 right-0 h-[85dvh] bg-zinc-950/90 backdrop-blur-3xl rounded-t-[40px] z-[110] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden border-t border-white/10"
                    >
                      {/* Header with Close Handle */}
                      <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
                         <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6 pt-2 pb-4">
                        <div className="flex items-center justify-between mb-5 shrink-0">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-sky-400 border border-white/10">
                                 <Send size={20} className="-rotate-12" />
                              </div>
                              <div>
                                 <h3 className="text-xl font-bold text-white tracking-tight italic">Buku Catatan</h3>
                                 <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Personal Notes</p>
                              </div>
                           </div>
                           <button 
                              onClick={() => setShowNotebook(false)}
                              className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                           >
                              <X size={24} />
                           </button>
                        </div>

                        {/* List Area on TOP */}
                        <div className="flex-1 flex flex-col group/list min-h-[200px]">
                           <div className="flex items-center justify-between mb-4 shrink-0">
                              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Catatan Tersimpan</p>
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                                 {notes.length} Catatan
                              </span>
                           </div>

                           <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
                             {notes.length === 0 ? (
                               <div className="h-48 flex flex-col items-center justify-center text-white/10 italic">
                                 <Send size={32} strokeWidth={1} className="mb-2 opacity-20 -rotate-12 text-white/40" />
                                 <p className="text-xs font-bold text-white/30">Belum ada catatan</p>
                                 <p className="text-[9px] text-white/20 uppercase tracking-wider mt-1">Tulis catatan di bawah untuk memulai</p>
                               </div>
                             ) : (
                               <div className="flex flex-wrap gap-2.5">
                                 {notes.map((note) => {
                                   const noteColor = note.color || 'green';
                                   return (
                                     <div 
                                       key={note.id} 
                                       onClick={() => toggleNoteColor(note.id)}
                                       className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full border transition-all cursor-pointer select-none active:scale-95 duration-150 ${
                                         noteColor === 'purple' 
                                           ? 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500/15 hover:border-fuchsia-500/30' 
                                           : noteColor === 'red' 
                                             ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/30' 
                                             : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/30'
                                       }`}
                                       title="Klik untuk ubah warna"
                                     >
                                       {/* Color indicator dot */}
                                       <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                         noteColor === 'purple' 
                                           ? 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.6)]' 
                                           : noteColor === 'red' 
                                             ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]' 
                                             : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                                       }`} />
                                       
                                       <span className="text-xs font-bold leading-none pr-1">{note.text}</span>
                                       
                                       <button 
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           deleteNote(note.id);
                                         }}
                                         className="text-white/30 hover:text-white p-0.5 rounded-full transition-colors hover:bg-white/10 shrink-0"
                                         title="Hapus"
                                       >
                                         <X size={12} className="stroke-[2.5]" />
                                       </button>
                                     </div>
                                   );
                                 })}
                               </div>
                             )}
                           </div>
                        </div>

                        {/* Input Area on BOTTOM */}
                        <div className="shrink-0 bg-white/[0.02] border border-white/5 rounded-[28px] p-4 mt-auto space-y-3 shadow-xl">
                           <div className="flex items-center justify-between">
                              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Pilih Warna & Tulis Catatan</p>
                              
                              {/* Color Selector */}
                              <div className="flex items-center gap-2">
                                 {(['green', 'purple', 'red'] as const).map((col) => (
                                    <button
                                       key={col}
                                       type="button"
                                       onClick={() => setSelectedNoteColor(col)}
                                       className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                          selectedNoteColor === col 
                                             ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' 
                                             : 'opacity-50 hover:opacity-100'
                                       }`}
                                    >
                                       <span className={`w-3.5 h-3.5 rounded-full ${
                                          col === 'green' ? 'bg-emerald-400' : col === 'purple' ? 'bg-fuchsia-400' : 'bg-rose-400'
                                       }`} />
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {/* Single Line Pill Input */}
                           <div className="relative flex items-center">
                              <input 
                                 type="text"
                                 className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-full outline-none text-xs font-bold text-white placeholder:text-white/20 transition-all focus:bg-white/10 focus:border-white/20"
                                 placeholder="Tulis catatan satu baris di sini..."
                                 value={currentNote}
                                 onChange={(e) => setCurrentNote(e.target.value)}
                                 onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                       saveNote();
                                    }
                                 }}
                              />
                              <button 
                                 onClick={saveNote}
                                 disabled={!currentNote.trim()}
                                 className="absolute right-1.5 p-2 bg-white text-black disabled:bg-white/5 disabled:text-white/20 rounded-full transition-all active:scale-95 shadow-md flex items-center justify-center"
                                 title="Kirim"
                              >
                                 <Send size={12} className="-rotate-12 stroke-[2.5]" />
                              </button>
                           </div>
                        </div>
                      </div>

                      <div className="p-6 shrink-0 bg-white/[0.02] border-t border-white/5">
                        <button 
                          onClick={() => setShowNotebook(false)}
                          className="w-full bg-white/10 text-white/60 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all border border-white/5 hover:bg-white/20 hover:text-white"
                        >
                          Tutup
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Mobile Bottom Navigation (Instagram Style) - Only for SCM as others have their own */}
              {(role === 'SCM') && (
                <footer className="lg:hidden h-[50px] border-t border-white/5 flex items-center justify-around bg-black/40 backdrop-blur-md shrink-0">
                  <button onClick={() => setShowNotifications(false)} className="p-2">
                    <Globe size={24} className={!showNotifications ? 'text-white' : 'text-white/40'} />
                  </button>
                  <button onClick={() => setShowNotifications(true)} className="p-2 relative">
                    <Bell size={24} className={showNotifications ? 'text-white' : 'text-white/40'} />
                    {unreadCount > 0 && <span className="absolute top-2 right-2 w-[8px] h-[8px] bg-red-500 rounded-full border border-black" />}
                  </button>
                </footer>
              )}
            </div>
          </div>

            {/* Notification Sidebar as Modal Overlay for Mobile Feel */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div 
                    key="notification-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowNotifications(false)}
                    className="fixed lg:absolute inset-0 bg-black/40 z-[40] backdrop-blur-sm shadow-2xl"
                  />
                  <motion.div 
                    key="notification-sidebar"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed lg:absolute top-0 right-0 w-full lg:w-[380px] h-[100dvh] bg-black/80 backdrop-blur-3xl z-[50] flex flex-col border-l border-white/10 shadow-2xl shadow-black"
                  >
                    <div className="h-[60px] lg:h-[80px] border-b border-white/10 px-6 flex items-center justify-between shrink-0">
                      <h3 className="text-xl font-bold text-white tracking-tight italic">Activity</h3>
                      <button onClick={() => setShowNotifications(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3 pt-6 custom-scrollbar">
                      {filteredNotifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/20">
                          <Bell size={48} strokeWidth={1} className="mb-4 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No activity yet</p>
                        </div>
                      ) : (
                        filteredNotifications.map(notif => (
                          <div key={notif.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm backdrop-blur-md ${
                              notif.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                              notif.type === 'update' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              <Globe size={18} />
                            </div>
                            <div className="flex-1 text-[13px] leading-snug pt-0.5">
                              <span className="font-bold mr-1 text-white uppercase text-[11px] tracking-tight">{notif.locationName || 'System'}</span>
                              <span className="text-white/60 font-medium">{notif.message}</span>
                              <p className="text-[10px] text-white/30 mt-2 font-black uppercase tracking-widest">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <button onClick={() => dismissNotification(notif.id)} className="text-white/20 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={14} />
                            </button>
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
