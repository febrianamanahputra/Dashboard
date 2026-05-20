import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Plus, Package, MapPin, X, AlertTriangle, HardHat, FileSpreadsheet, CheckCircle2, Trash2, Edit2, Camera, UserCircle, History, BarChart3, Box, Clock, Target, PlusSquare, RefreshCw, ClipboardList, Wallet, Send, Settings, Table, FileText, Landmark, Circle, Truck, Check, Banknote, MessageCircle, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { StockEntry, MaterialRequest, RequestStatus } from '../../types';

const handleEnterNextField = (e: React.KeyboardEvent<HTMLElement>) => {
  if (e.key === 'Enter' && e.currentTarget.tagName !== 'TEXTAREA') {
    e.preventDefault();
    const current = e.currentTarget;
    let nextElement: HTMLElement | null = null;
    
    const form = (current as HTMLInputElement).form;
    if (form) {
      const elements = Array.from(form.elements) as HTMLElement[];
      const index = elements.indexOf(current as any);
      if (index > -1) {
        let i = index + 1;
        while (elements[i]) {
          const el = elements[i];
          if (
            (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'BUTTON') &&
            !(el as any).disabled && (el as any).type !== 'hidden'
          ) {
            nextElement = el;
            break;
          }
          i++;
        }
      }
    } else {
      // Fallback for non-form containers (like in Report Harian)
      const container = current.closest('.space-y-1\\.5') || current.closest('.space-y-3') || current.parentElement?.parentElement;
      if (container) {
        const focusables = Array.from(container.querySelectorAll('input, select, button')) as HTMLElement[];
        const index = focusables.indexOf(current);
        if (index > -1) {
          let i = index + 1;
          while (focusables[i]) {
            const el = focusables[i];
            const isInput = el.tagName === 'INPUT' || el.tagName === 'SELECT';
            const isSubmit = el.tagName === 'BUTTON' && (el as any).type === 'submit';
            if (isInput || isSubmit) {
              nextElement = el;
              break;
            }
            i++;
          }
        }
      }
    }

    if (nextElement) {
      nextElement.focus();
    }
  }
};

const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.split(' ').map(word => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

const handleTitleCaseChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
  const { value, selectionStart, selectionEnd } = e.target;
  const transformed = toTitleCase(value);
  setter(transformed);
  
  // Restore cursor position
  requestAnimationFrame(() => {
    if (e.target) {
      e.target.setSelectionRange(selectionStart, selectionEnd);
    }
  });
};

import RAPDashboard from '../RAP/RAPDashboard';
import * as XLSX from 'xlsx';

const UNITS = ['zak', 'ret', 'dus', 'Pcs', 'galon', 'm2', 'm3', 'Liter', 'Roll', 'Lembar', 'Kaleng', 'Dll'];
const RECIPIENTS = ['Site Manager', 'Mandor', 'Tukang'];
const DELIVERERS = ['Kurir', 'SCM', 'Toko', 'Pengambilan Sendiri'];

const FUNNY_AVATARS = [
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1513584684374-8bdb7483fe8f?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1600607687940-47a04b615a1d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1628744276229-c83470af5ee2?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=200&h=200&fit=crop"
];

export default function SMDashboard() {
  const { 
    profiles = [], 
    subs = [],
    requests = [], 
    addRequest, 
    editRequest,
    deleteRequest,
    addProfile, 
    updateProfile,
    removeProfile, 
    addSub,
    updateSub,
    removeSub,
    updateRequestStatus, 
    updateStock,
    addManualStock,
    mainMaterials = []
  } = useApp();
  
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMainRequestForm, setShowMainRequestForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaterialRequest | null>(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showEditSub, setShowEditSub] = useState<string | null>(null);
  const [subToDelete, setSubToDelete] = useState<any>(null);
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<MaterialRequest | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [view, setView] = useState<'main' | 'rap'>('main');
  const [activeTab, setActiveTab] = useState<'active' | 'riwayat' | 'total' | 'stok'>('active');
  const [viewingHistorySubId, setViewingHistorySubId] = useState<string | null>(null);
  const [subStock, setSubStock] = useState<StockEntry[]>([]);
  const [receivingRequest, setReceivingRequest] = useState<MaterialRequest | null>(null);
  const [showAddManualStock, setShowAddManualStock] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [viewingNota, setViewingNota] = useState<any>(null);
  const [activeView, setActiveView] = useState<'reports' | 'requests' | 'funds' | 'profile'>('requests');
  const [reportDrafts, setReportDrafts] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('reportDrafts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('reportDrafts', JSON.stringify(reportDrafts));
    } catch (e) {
      console.error(e);
    }
  }, [reportDrafts]);

  // Auto-scroll focused fields into view center (ideal for mobile keyboards)
  React.useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')
      ) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
      }
    };
    document.addEventListener('focusin', handleFocus);
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  // Back Button Navigation Support for Android/Mobile Browser
  React.useEffect(() => {
    const hasOpenModal = !!(
      showAddForm || editingRequest || showMainRequestForm || selectedStock || 
      selectedRequestForDetail || receivingRequest || showAdd || viewingNota ||
      showAddProfile || showAddSub || showEditProfile || showEditSub || showAddManualStock
    );

    const handlePopState = (e: PopStateEvent) => {
      // If this back event is handled by some other logic or is meant for role change, skip
      if (e.state && !e.state.isSubNav && e.state.role === null) {
        return; 
      }

      if (hasOpenModal) {
        // Close all modals instead of navigating away
        setShowAddForm(false);
        setEditingRequest(null);
        setShowMainRequestForm(false);
        setSelectedStock(null);
        setSelectedRequestForDetail(null);
        setReceivingRequest(null);
        setShowAdd(false);
        setViewingNota(null);
        setShowAddProfile(false);
        setShowAddSub(false);
        setShowEditProfile(false);
        setShowEditSub(null);
        setShowAddManualStock(false);
      } else if (view === 'rap') {
        setView('main');
      } else if (activeSubId) {
        setActiveSubId(null);
      } else if (activeProfileId) {
        setActiveProfileId(null);
      } else if (activeView !== 'requests') {
        setActiveView('requests');
      }
    };

    // Push history state whenever we navigate deeper or open a modal
    if (hasOpenModal || activeView !== 'requests' || activeProfileId || activeSubId || view === 'rap') {
      window.history.pushState({ role: 'SM', isSubNav: true }, "");
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    showAddForm, editingRequest, showMainRequestForm, selectedStock, 
    selectedRequestForDetail, receivingRequest, showAdd, viewingNota,
    showAddProfile, showAddSub, showEditProfile, showEditSub, 
    activeView, activeProfileId, activeSubId, view
  ]);

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const profileSubs = subs.filter(s => s.profileId === activeProfileId);
  
  // Handle active sub initialization
  React.useEffect(() => {
    if (activeProfileId && profileSubs.length > 0 && !activeSubId) {
      setActiveSubId(profileSubs[0].id);
    }
  }, [activeProfileId, profileSubs, activeSubId]);

  // Fetch stock for active sub
  React.useEffect(() => {
    if (!activeSubId) {
      setSubStock([]);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, `subs/${activeSubId}/stock`), (snapshot) => {
      const items: StockEntry[] = [];
      snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() } as StockEntry));
      setSubStock(items);
    });
    return () => unsubscribe();
  }, [activeSubId]);

  React.useEffect(() => {
    const handleOpenMain = () => setShowMainRequestForm(true);
    window.addEventListener('open-main-material', handleOpenMain);
    return () => window.removeEventListener('open-main-material', handleOpenMain);
  }, []);

  const subRequests = requests.filter(r => r.subId === activeSubId);
  
  // Tab filtered data
  const activeRequests = subRequests.filter(r => r.status !== 'received' && r.status !== 'on_hold');
  const onHoldRequests = subRequests.filter(r => r.status === 'on_hold');
  
  const historyRequests = subRequests
    .filter(r => r.status === 'received')
    .map(r => {
      const receivedEntry = r.history.find(h => h.status === 'received');
      return {
        ...r,
        receivedAt: receivedEntry?.timestamp || 0
      };
    })
    .sort((a, b) => b.receivedAt - a.receivedAt);

  const handleSendStockWA = () => {
    if (!activeSubId) return;
    const activeSub = subs.find(s => s.id === activeSubId);
    const locationName = activeSub ? activeSub.name : 'Project';
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    let message = `*Stock Material ${locationName}*\n\`${dateStr}\`\n________________________________________\n\n`;
    
    if (subStock.length === 0) {
      message += "_Stok Kosong_";
    } else {
      subStock.sort((a,b) => a.materialName.localeCompare(b.materialName)).forEach(item => {
        message += `> *${item.materialName}* ${item.quantity} ${item.unit}\n`;
      });
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  interface AggregatedTotal {
    materialName: string;
    quantity: number;
    unit: string;
  }

  const totalReceived = historyRequests.reduce((acc, curr) => {
    const key = `${curr.materialName.toLowerCase()}-${curr.unit.toLowerCase()}`;
    if (!acc[key]) {
      acc[key] = { materialName: curr.materialName, quantity: 0, unit: curr.unit.toLowerCase() };
    }
    acc[key].quantity += curr.quantity;
    return acc;
  }, {} as Record<string, AggregatedTotal>);

  const totalsArray: AggregatedTotal[] = (Object.values(totalReceived) as AggregatedTotal[]).sort((a, b) => a.materialName.localeCompare(b.materialName));

  // Auto-selection logic removed to allow profile selector to appear first
  // React.useEffect(() => {
  //   if (activeProfileId && !profiles.find(p => p.id === activeProfileId)) {
  //     setActiveProfileId(profiles?.[0]?.id || null);
  //     setActiveSubId(null);
  //   } else if (!activeProfileId && profiles.length > 0) {
  //     setActiveProfileId(profiles?.[0]?.id || null);
  //   }
  // }, [profiles, activeProfileId]);

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'pending': return 'Belum Di Proses';
      case 'processing': return 'Sedang Di Proses';
      case 'awaiting_payment': return 'Menunggu Pembayaran';
      case 'paid': return 'Pembayaran Berhasil';
      case 'delivered': return 'Pengantaran';
      case 'received': return 'Selesai Diterima';
      case 'on_hold': return 'Tertunda (Hold)';
      default: return s;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'processing': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'awaiting_payment': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'paid': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'received': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'on_hold': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return 'bg-white/5 text-white border-white/10';
    }
  };

  const getRequestTheme = (s: string) => {
    switch (s) {
      case 'pending': 
        return {
          bg: 'bg-transparent',
          text: 'text-white',
          badge: 'bg-white/10 text-white border-white/20',
          watermark: null
        };
      case 'processing':
        return {
          bg: 'bg-transparent',
          text: 'text-white',
          badge: 'bg-white/10 text-white border-white/20',
          watermark: null
        };
      case 'awaiting_payment':
        return {
          bg: 'bg-transparent',
          text: 'text-white',
          badge: 'bg-white/10 text-white border-white/20',
          watermark: null
        };
      case 'paid':
        return {
          bg: 'bg-transparent',
          text: 'text-white',
          badge: 'bg-white/10 text-white border-white/20',
          watermark: null
        };
      case 'delivered':
        return {
          bg: 'bg-transparent',
          text: 'text-white',
          badge: 'bg-white/10 text-white border-white/20',
          watermark: null
        };
      default:
        return {
          bg: 'bg-transparent',
          text: 'text-white',
          badge: 'bg-white/10 text-white border-white/20',
          watermark: null
        };
    }
  };

    if (view === 'rap') {
    return (
      <RAPDashboard 
        onBack={() => setView('main')} 
        subId={activeSubId || ''}
        stock={[]} // Simplified for now
      />
    );
  }

  const getProfileAvatar = (profile: any) => {
    if (profile.avatarUrl) {
      return (
        <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
      );
    }
    // Default avatar with color background and logo
    const colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
    const colorIndex = profile.id.charCodeAt(0) % colors.length;
    return (
      <div className={`w-full h-full flex items-center justify-center ${colors[colorIndex]} text-white`}>
        <UserCircle size={32} />
      </div>
    );
  };

  return (
    <div className="relative h-full flex flex-col bg-transparent overflow-hidden">
      {/* Global Top Nav Bar for Sub Selection */}
      {activeProfile && activeView !== 'profile' && (
        <div 
          className="relative overflow-hidden shrink-0 border-b border-white/10"
        >
          {/* Overlay to ensure readability */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          
          <div className="relative z-10">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div 
                  onClick={() => setShowEditProfile(true)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 overflow-hidden shrink-0 cursor-pointer"
                >
                  {getProfileAvatar(activeProfile)}
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight leading-none mb-1 text-white">{activeProfile.name}</h2>
                  <div className="flex items-center gap-1.5 text-white/60">
                    <MapPin size={10} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                      {profileSubs.find(s => s.id === activeSubId)?.name || 'Pilih Sub'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* iOS Style Segmented Control for Subs (Horizontal Scroll) */}
            <div className="px-4 pb-3 overflow-x-auto custom-scrollbar-hide">
              <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl gap-1 min-w-max border border-white/10">
                {profileSubs.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubId(sub.id)}
                    className={`shrink-0 px-5 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${
                      activeSubId === sub.id 
                        ? 'bg-white text-black shadow-lg' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
                <button
                  onClick={() => setShowAddSub(true)}
                  className="px-3 py-1.5 text-white/40 hover:text-white transition-colors flex items-center justify-center"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="flex-1 flex flex-col overflow-hidden bg-transparent pb-[85px] md:pb-[70px] safe-area-pb">
        <AnimatePresence mode="wait">
          <>
            {activeView === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                <ReportView 
                  subId={activeSubId || ''} 
                  draftRows={activeSubId ? reportDrafts[activeSubId] : undefined}
                  onDraftChange={(newRows) => activeSubId && setReportDrafts(prev => ({ ...prev, [activeSubId]: newRows }))}
                />
              </motion.div>
            )}

            {activeView === 'requests' && (
              <motion.div 
                key="requests"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div 
                        className="px-4 py-3 flex items-center justify-between border-b border-white/10 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-md" />
                        <div className="flex items-center p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl gap-1 relative z-10">
                           <button 
                            onClick={() => setView('rap')}
                            className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 rounded-xl transition-all"
                           >
                              <FileSpreadsheet size={18} strokeWidth={2.5} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Budget RAP</span>
                           </button>
                           <div className="w-[1px] h-6 bg-white/20 mx-1" />
                           <button 
                            onClick={() => activeSubId && setShowAddForm(true)}
                            disabled={!activeSubId}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                              !activeSubId 
                              ? 'opacity-20 cursor-not-allowed text-white/50' 
                              : 'text-white hover:bg-white/10'
                            }`}
                          >
                            <PlusSquare size={18} strokeWidth={2.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Request Material</span>
                          </button>
                        </div>
                      </div>
                      {/* Tabs moved to Request specific section */}
                      <div className="px-4 py-6 bg-transparent">
                        <div className="bg-transparent p-1 rounded-2xl flex items-center gap-1 relative overflow-hidden border border-white/20">
                          {(['active', 'riwayat', 'total', 'stok'] as const).map((tab) => {
                            const isActive = activeTab === tab;
                            const labels = { active: 'Aktif', riwayat: 'Riwayat', total: 'Total', stok: 'Stok' };
                            
                            return (
                              <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative flex-1 py-3 flex items-center justify-center z-10 transition-all duration-300 ${
                                  isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
                                }`}>
                                {isActive && (
                                  <motion.div 
                                    layoutId="glass-bubble"
                                    className="absolute inset-x-0 bottom-0 h-0.5 bg-white rounded-full shadow-lg"
                                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                                  />
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{labels[tab]}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      {/* Request Content */}
                      <div className="px-4 pb-20 space-y-4">
                        {/* Content for tabs - truncated for space but kept structure */}
                        {activeTab === 'active' && (
                          <>
                            <h3 className="text-[10px] font-bold text-ig-grey uppercase tracking-widest px-1">Menunggu Konfirmasi ({activeRequests.length})</h3>
                            {activeRequests.length === 0 ? (
                              <div className="ig-card p-12 flex flex-col items-center justify-center text-center opacity-40">
                                 <Clock size={32} className="mb-2" />
                                 <p className="text-xs font-bold uppercase">Tidak ada permintaan aktif</p>
                              </div>
                            ) : (
                              <div className="space-y-1 mt-2">
                                {activeRequests.map(req => {
                                  const theme = getRequestTheme(req.status);
                                  return (
                                    <motion.button 
                                      key={req.id} 
                                      initial={{ opacity: 0, x: -10 }} 
                                      animate={{ opacity: 1, x: 0 }} 
                                      onClick={() => setSelectedRequestForDetail(req)}
                                      className={`w-full ${theme.bg} border border-white/10 flex items-center justify-between p-4 active:scale-[0.98] transition-all group hover:brightness-105 shadow-md rounded-2xl relative overflow-hidden mb-2`}
                                    >
                                      {theme.watermark}
                                      <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 bg-white/10 backdrop-blur-sm shadow-sm ${theme.text}`}>
                                          {req.status === 'pending' && <Clock size={18} />}
                                          {req.status === 'processing' && <RefreshCw size={18} />}
                                          {req.status === 'awaiting_payment' && <Wallet size={18} />}
                                          {req.status === 'paid' && <CheckCircle2 size={18} />}
                                          {req.status === 'delivered' && <Truck size={18} />}
                                          {!['pending', 'processing', 'awaiting_payment', 'paid', 'delivered'].includes(req.status) && <Package size={18} />}
                                        </div>
                                        <div className="text-left">
                                          <p className={`font-black text-sm tracking-tight ${theme.text}`}>{req.materialName}</p>
                                          <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.text} opacity-80`}>{req.quantity} {req.unit}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 relative z-10">
                                        <span className={`px-3 py-1 rounded-full text-[9px] border font-black uppercase tracking-widest shadow-sm ${theme.badge}`}>
                                          {getStatusLabel(req.status)}
                                        </span>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if(confirm('Hapus request ini?')) deleteRequest(req.id);
                                          }}
                                          className={`p-2 ${theme.text} hover:bg-white/10 rounded-xl transition-all opacity-60 hover:opacity-100`}
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                        {activeTab === 'riwayat' && (
                          <>
                            {!viewingHistorySubId ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Riwayat Per Lokasi</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {profileSubs.map(sub => {
                                    const subHistoryCount = requests.filter(r => r.subId === sub.id && r.status === 'received').length;
                                    return (
                                      <button 
                                        key={sub.id}
                                        onClick={() => setViewingHistorySubId(sub.id)}
                                        className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all active:scale-[0.98]"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                            <MapPin size={20} />
                                          </div>
                                          <div className="text-left">
                                            <p className="text-sm font-black text-white uppercase tracking-tight">{sub.name}</p>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{subHistoryCount} Item Diterima</p>
                                          </div>
                                        </div>
                                        <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                  <button 
                                    onClick={() => setViewingHistorySubId(null)}
                                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white"
                                  >
                                    <ChevronLeft size={20} />
                                  </button>
                                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">
                                    Riwayat: {subs.find(s => s.id === viewingHistorySubId)?.name}
                                  </h3>
                                </div>
                                
                                {requests.filter(r => r.subId === viewingHistorySubId && r.status === 'received').length === 0 ? (
                                  <div className="ig-card p-12 flex flex-col items-center justify-center text-center opacity-40">
                                    <History size={32} className="mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-white">Belum ada riwayat</p>
                                  </div>
                                ) : (
                                  requests
                                    .filter(r => r.subId === viewingHistorySubId && r.status === 'received')
                                    .sort((a,b) => (b.history.find(h => h.status === 'received')?.timestamp || 0) - (a.history.find(h => h.status === 'received')?.timestamp || 0))
                                    .map(req => (
                                      <div key={req.id} className="bg-white/5 backdrop-blur-md p-4 flex items-center justify-between border border-white/10 rounded-2xl group">
                                        <div className="flex gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                                            <CheckCircle2 size={18} />
                                          </div>
                                          <div>
                                            <p className="text-sm font-black text-white tracking-tight leading-none mb-1.5">{req.materialName}</p>
                                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
                                              Diterima: {new Date(req.history.find(h => h.status === 'received')?.timestamp || 0).toLocaleDateString('id-ID')}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="text-right">
                                            <p className="text-sm font-black text-white italic">{req.quantity} <span className="text-[10px] opacity-40 uppercase">{req.unit}</span></p>
                                          </div>
                                          <button 
                                            onClick={() => {
                                              if (confirm('Hapus riwayat ini? (Ini tidak akan mengembalikan stok)')) {
                                                deleteRequest(req.id);
                                              }
                                            }}
                                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                )}
                              </div>
                            )}
                          </>
                        )}
                        {activeTab === 'total' && (
                          <>
                            <h3 className="text-[10px] font-bold text-ig-grey uppercase tracking-widest px-1">Total Akumulasi Material</h3>
                            <div className="ig-card divide-y divide-gray-50 border-t-2 border-ig-black overflow-hidden">
                               {totalsArray.length === 0 ? (
                                 <p className="p-8 text-center text-xs text-ig-grey font-bold">Belum ada data tersedia</p>
                               ) : (
                                 totalsArray.map((item, idx) => (
                                   <div key={idx} className="p-4 flex items-center justify-between bg-white/10 backdrop-blur-sm border-b border-white/5">
                                      <div>
                                        <p className="text-sm font-bold tracking-tight text-white">{item.materialName}</p>
                                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-tighter mt-0.5">Sudah Diterima</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xl font-black italic tracking-tighter leading-none text-white">{item.quantity}</p>
                                        <span className="text-[10px] font-bold uppercase text-white/40">{item.unit}</span>
                                      </div>
                                   </div>
                                 ))
                               )}
                            </div>
                          </>
                        )}
                        {activeTab === 'stok' && (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-[10px] font-bold text-ig-grey uppercase tracking-widest px-1">Gudang Mini ({subStock.length})</h3>
                              <div className="flex gap-2">
                                <button 
                                  onClick={handleSendStockWA}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-emerald-500 hover:text-white"
                                >
                                  <Send size={12} /> LAPORKAN WA
                                </button>
                                <button 
                                  onClick={() => setShowAddManualStock(true)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                                >
                                  <Plus size={12} /> TAMBAH STOK
                                </button>
                              </div>
                            </div>
                            {subStock.length === 0 ? (
                              <div className="ig-card p-12 flex flex-col items-center justify-center text-center opacity-40">
                                 <Box size={32} className="mb-2" />
                                 <p className="text-xs font-bold uppercase tracking-widest">Stok kosong</p>
                              </div>
                            ) : (
                              <div className="space-y-1 mt-2">
                                {subStock.map((entry) => (
                                  <motion.button 
                                    layout 
                                    key={entry.id} 
                                    onClick={() => { setSelectedStock(entry); setEditQuantity(entry.quantity.toString()); }} 
                                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-between p-4 rounded-2xl active:scale-[0.98] transition-all group hover:bg-white/20 shadow-xl"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-white/40">
                                        <Box size={14} />
                                      </div>
                                      <div className="text-left text-white">
                                        <p className="font-black text-xs tracking-tight">{entry.materialName}</p>
                                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-0.5">Update: {new Date(entry.dateReceived).toLocaleDateString('id-ID')}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-black italic text-white">{entry.quantity} <span className="text-[10px] text-white/40 uppercase font-black">{entry.unit}</span></p>
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'funds' && (
                <motion.div 
                  key="funds"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  <FundsView 
                    subId={activeSubId || ''} 
                    showAdd={showAdd}
                    setShowAdd={setShowAdd}
                    viewingNota={viewingNota}
                    setViewingNota={setViewingNota}
                  />
                </motion.div>
              )}

              {activeView === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col h-full overflow-hidden"
                >
                  <ProfileManagementView 
                    profiles={profiles}
                    activeProfileId={activeProfileId}
                    setActiveProfileId={setActiveProfileId}
                    setShowAddProfile={setShowAddProfile}
                    setShowEditProfile={setShowEditProfile}
                    getProfileAvatar={getProfileAvatar}
                  />
                </motion.div>
              )}
            </>
          </AnimatePresence>
        </section>

        {/* Global Profile Selection Pop-up */}
        <AnimatePresence>
          {!activeProfileId && activeView !== 'profile' && (
            <ProfileSelectionModal 
              profiles={profiles}
              onSelect={setActiveProfileId}
              onAdd={() => setShowAddProfile(true)}
              onEdit={(prof: any) => {
                setActiveProfileId(prof.id);
                setShowEditProfile(true);
              }}
              getProfileAvatar={getProfileAvatar}
            />
          )}
        </AnimatePresence>

        {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 px-2 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-around z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.3)] min-h-[70px] md:h-[70px] overflow-hidden bg-black/20 backdrop-blur-2xl">
        <NavButton 
          active={activeView === 'reports'} 
          onClick={() => setActiveView('reports')} 
          icon={<ClipboardList size={22} />} 
          label="Report" 
        />
        <NavButton 
          active={activeView === 'requests'} 
          onClick={() => setActiveView('requests')} 
          icon={<Package size={22} />} 
          label="Request" 
        />
        <NavButton 
          active={activeView === 'funds'} 
          onClick={() => setActiveView('funds')} 
          icon={<Wallet size={22} />} 
          label="Dana" 
        />
        <NavButton 
          active={activeView === 'profile'} 
          onClick={() => setActiveView('profile')} 
          icon={<UserCircle size={22} />} 
          label="Profil" 
        />
      </div>

      {/* Modals with AnimatePresence */}
      <AnimatePresence>
        {(showAddForm || editingRequest) && activeSubId && (
          <RequestFormModal 
            onClose={() => {
              setShowAddForm(false);
              setEditingRequest(null);
            }} 
            subId={activeSubId}
            onSubmit={(data) => {
              if (editingRequest) {
                editRequest(editingRequest.id, data);
              } else {
                addRequest(data);
              }
            }}
            initialData={editingRequest || undefined}
            isEdit={!!editingRequest}
            status={editingRequest?.status}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMainRequestForm && activeSubId && (
          <MainRequestFormModal 
            onClose={() => setShowMainRequestForm(false)}
            subId={activeSubId}
            materials={mainMaterials}
            onSubmit={(data) => {
              addRequest(data);
              setShowMainRequestForm(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddProfile && (
          <ProfileFormModal 
            onClose={() => setShowAddProfile(false)}
            onSubmit={(name, avatar) => {
              addProfile(name, avatar);
              setShowAddProfile(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddSub && activeProfileId && (
          <SubFormModal 
            onClose={() => setShowAddSub(false)}
            onSubmit={(name) => {
              addSub(name, activeProfileId);
              setShowAddSub(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditProfile && activeProfile && (
          <EditProfileModal 
            profile={activeProfile}
            onClose={() => setShowEditProfile(false)}
            onUpdate={(name, avatar) => {
              updateProfile(activeProfile.id, name, avatar);
              setShowEditProfile(false);
            }}
            onDelete={() => {
              setShowEditProfile(false);
              setShowDeleteConfirm(true);
            }}
            onDeleteSub={(sub) => setSubToDelete(sub)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddManualStock && activeSubId && (
          <ManualStockModal 
            onClose={() => setShowAddManualStock(false)}
            onSubmit={(name, qty, unit) => {
              addManualStock(activeSubId, name, qty, unit);
              setShowAddManualStock(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {subToDelete && (
          <DeleteSubConfirmModal 
            sub={subToDelete} 
            onClose={() => setSubToDelete(null)}
            onConfirm={(cascade) => {
              removeSub(subToDelete.id, cascade);
              setSubToDelete(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receivingRequest && (
          <ReceiveOrderModal 
            onClose={() => setReceivingRequest(null)}
            request={receivingRequest}
            onConfirm={(extra) => {
              updateRequestStatus(receivingRequest.id, 'received', extra);
              setReceivingRequest(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRequestForDetail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/20 backdrop-blur-2xl w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-white/20"
            >
              {(() => {
                const theme = getRequestTheme(selectedRequestForDetail.status);
                return (
                  <div className={`px-8 py-10 ${theme.bg} text-center relative overflow-hidden`}>
                    {theme.watermark}
                    <div className="relative z-10">
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20 bg-white/10 backdrop-blur-md shadow-lg text-white">
                        {selectedRequestForDetail.status === 'pending' && <Clock size={40} />}
                        {selectedRequestForDetail.status === 'processing' && <RefreshCw size={40} />}
                        {selectedRequestForDetail.status === 'awaiting_payment' && <Wallet size={40} />}
                        {selectedRequestForDetail.status === 'paid' && <CheckCircle2 size={40} />}
                        {selectedRequestForDetail.status === 'delivered' && <Truck size={40} />}
                        {!['pending', 'processing', 'awaiting_payment', 'paid', 'delivered'].includes(selectedRequestForDetail.status) && <Package size={40} />}
                      </div>
                      <h2 className="text-2xl font-black tracking-tight mb-2 text-white">{selectedRequestForDetail.materialName}</h2>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${theme.badge}`}>
                        {getStatusLabel(selectedRequestForDetail.status)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Kuantitas</p>
                      <p className="text-lg font-black text-white">{selectedRequestForDetail.quantity} <span className="text-xs uppercase text-white/40">{selectedRequestForDetail.unit}</span></p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Batas Waktu</p>
                      <p className="text-sm font-bold text-white">{new Date(selectedRequestForDetail.dateNeeded).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                   </div>
                </div>

                {selectedRequestForDetail.description && (
                  <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Keterangan / Detail</p>
                    <p className="text-xs font-medium text-white/80 leading-relaxed">{selectedRequestForDetail.description}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {selectedRequestForDetail.status === 'delivered' && (
                    <button 
                      onClick={() => {
                        setReceivingRequest(selectedRequestForDetail);
                        setSelectedRequestForDetail(null);
                      }} 
                      className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-green-500/20 flex items-center justify-center gap-3"
                    >
                      TERIMA MATERIAL
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingRequest(selectedRequestForDetail);
                        setSelectedRequestForDetail(null);
                      }}
                      className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-black text-sm border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                      <Edit2 size={16} /> EDIT
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm('Hapus request ini?')) {
                          deleteRequest(selectedRequestForDetail.id);
                          setSelectedRequestForDetail(null);
                        }
                      }}
                      className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl font-black text-sm border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> HAPUS
                    </button>
                  </div>
                  <button 
                    onClick={() => setSelectedRequestForDetail(null)}
                    className="w-full py-2 text-[10px] font-bold text-ig-grey uppercase tracking-widest"
                  >
                    TUTUP
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStock && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/20 backdrop-blur-2xl w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-white/20"
            >
              <div className="px-8 py-8 border-b border-white/10 text-center">
                 <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 border border-white/20 text-white shadow-xl">
                    <Box size={32} />
                 </div>
                 <h2 className="text-xl font-black tracking-tight mb-1 text-white">{selectedStock.materialName}</h2>
                 <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Informasi Stok Gudang</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center">
                   <p className="text-4xl font-black italic tracking-tighter text-white mb-1">{selectedStock.quantity}</p>
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{selectedStock.unit}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   <div className="flex items-center justify-between px-4 py-3 bg-white/10 rounded-xl">
                      <span className="text-[10px] font-bold text-white/40 uppercase">Terakhir Update</span>
                      <span className="text-xs font-bold text-white">{new Date(selectedStock.dateReceived).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                   </div>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ig-grey uppercase tracking-widest ml-1">Koreksi Jumlah Manual</label>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-lg font-black text-white focus:ring-2 focus:ring-white/40 outline-none transition-all"
                          onKeyDown={handleEnterNextField}
                          onFocus={e => e.target.select()}
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                        />
                        <button 
                          onClick={() => {
                            if (activeSubId && selectedStock) {
                              updateStock(activeSubId, selectedStock.id, parseFloat(editQuantity) || 0);
                              setSelectedStock(null);
                            }
                          }}
                          className="bg-ig-black text-white px-6 rounded-2xl font-black text-sm shadow-lg shadow-black/10 active:scale-95 transition-all"
                        >
                          UPDATE
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStock(null)}
                    className="w-full py-4 text-[10px] font-bold text-ig-grey uppercase tracking-widest mt-4"
                  >
                    KEMBALI
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && activeProfile && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-white/20 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto border border-red-100">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2">Delete Profile</h3>
              <p className="text-ig-grey text-xs mb-8">
                Are you sure you want to delete <span className="font-bold text-ig-black">{activeProfile.name}</span>? All associated data will be removed.
              </p>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    removeProfile(activeProfile.id);
                    setActiveProfileId(null);
                    setShowDeleteConfirm(false);
                  }}
                  className="w-full bg-red-500 text-white py-3 rounded-md font-bold text-sm"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-3 text-ig-grey font-bold text-sm hover:bg-bg-alt rounded-md"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1.5 transition-all relative px-4 py-2 rounded-2xl ${
        active 
          ? 'text-white' 
          : 'text-white/30 hover:text-white/60'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg"
          transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
        />
      )}
      <div className="relative z-10">{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] relative z-10">{label}</span>
    </button>
  );
}

function DeleteSubConfirmModal({ 
  sub, 
  onClose, 
  onConfirm 
}: { 
  sub: any; 
  onClose: () => void; 
  onConfirm: (cascade: boolean) => void 
}) {
  const [cascade, setCascade] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a1a1a] border border-white/10 rounded-[40px] p-8 max-w-sm w-full shadow-2xl text-center"
      >
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto border border-red-500/10">
          <AlertTriangle size={32} />
        </div>
        
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Hapus Lokasi?</h3>
        <p className="text-xs text-white/40 mb-8 font-medium">
          Dihapus: <span className="text-white font-bold">{sub.name}</span>
        </p>

        <div 
          onClick={() => setCascade(!cascade)}
          className={`flex items-center gap-4 p-5 rounded-[24px] border cursor-pointer transition-all mb-8 text-left ${
            cascade ? 'bg-red-500/10 border-red-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${cascade ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : 'border-white/20'}`}>
            {cascade && <Check size={18} strokeWidth={4} />}
          </div>
          <div>
            <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none mb-1.5">Hapus Seluruh Data</p>
            <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest leading-relaxed">Termasuk SCM, Finance, RAP & Stok di lokasi ini.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onConfirm(cascade)}
            className="w-full bg-red-500 text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-red-500/40 active:scale-95 transition-all"
          >
            KONFIRMASI HAPUS
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 text-white/30 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
          >
            BATAL
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReportView({ 
  subId, 
  draftRows, 
  onDraftChange 
}: { 
  subId: string;
  draftRows?: string[];
  onDraftChange: (rows: string[]) => void;
}) {
  const { reportTemplates = [], updateReportTemplate, profiles = [], subs = [], activeProfileId } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const template = reportTemplates.find(t => t.subId === subId) || { heading: '', footer: '' };

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const activeSub = subs.find(s => s.id === subId);

  // Local effect to handle rows state through parent
  const rows = draftRows || ['', '', '', '', ''];

  const getIndonesianDate = () => {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    
    return `${dayName}, ${date} ${monthName} ${year}`;
  };

  const updateRow = (index: number, value: string) => {
    const newRows = [...rows];
    newRows[index] = value;
    onDraftChange(newRows);
  };

  const addRow = () => onDraftChange([...rows, '']);
  const removeRow = (index: number) => {
    if (rows.length <= 1) {
      onDraftChange(['']);
      return;
    }
    onDraftChange(rows.filter((_, i) => i !== index));
  };

  const rowColors = [
    'from-blue-50/50 to-indigo-50/30',
    'from-emerald-50/50 to-teal-50/30',
    'from-rose-50/50 to-pink-50/30',
    'from-amber-50/50 to-orange-50/30',
    'from-purple-50/50 to-violet-50/30'
  ];

  const handleSendWA = (mode: 'full' | 'line', lineIndex?: number) => {
    if (!subId) {
      alert('Silahkan pilih sub lokasi terlebih dahulu');
      return;
    }

    const hour = new Date().getHours();
    const isAfternoon = hour >= 13;
    const separator = "________________________________________";
    const locationName = activeSub ? activeSub.name : 'Project';
    const targetLocation = locationName;
    const dateStr = getIndonesianDate();

    let message = '';
    if (mode === 'full') {
      const validLines = rows.filter(r => r.trim()).map(r => 
        `> Pek. ${r.trim()}`
      );
      if (validLines.length === 0) return alert('Input laporan terlebih dahulu');
      
      if (isAfternoon) {
        message = `*Bismillah,*\n*Progress Project ${targetLocation}*\n\`${dateStr}\`\n${separator}\n${validLines.join('\n')}\n\nTerima kasih`;
      } else {
        message = `Bismillah, Selamat Pagi Bapak/ibu\nRencana Kerja ${targetLocation}\n\`${dateStr}\`\n${separator}\n${validLines.join('\n')}\n\nTerima kasih`;
      }
    } else if (lineIndex !== undefined) {
      const lineText = rows[lineIndex].trim();
      if (!lineText) return;
      message = `> Pek. ${lineText}`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 z-10 text-left">
        <div className="flex items-center gap-2 relative z-10">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Report Harian</h2>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar pb-32">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-2">
             <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Detail Pekerjaan (Caption)</label>
             <button 
              onClick={addRow}
              className="text-white/80 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
             >
               <Plus size={12} /> Tambah Baris
             </button>
          </div>

          <div className="space-y-1.5">
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2 group">
                <div 
                  className={`flex-1 flex items-center bg-transparent border-b border-white/20 overflow-hidden focus-within:border-white/60 transition-all relative`}
                >
                  <input 
                    type="text"
                    className="flex-1 px-4 py-3 text-xs font-bold outline-none bg-transparent text-white placeholder:text-white/60 placeholder:italic z-10"
                    placeholder="Input detail pekerjaan..."
                    value={row}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const inputs = document.querySelectorAll('input[placeholder="Input detail pekerjaan..."]');
                        if (idx === rows.length - 1) {
                          if (row.trim() !== '') {
                            addRow();
                            setTimeout(() => {
                              const newInputs = document.querySelectorAll('input[placeholder="Input detail pekerjaan..."]');
                              (newInputs[newInputs.length - 1] as HTMLInputElement)?.focus();
                            }, 50);
                          }
                        } else {
                          // Focus next input specifically, skipping the "send" button
                          (inputs[idx + 1] as HTMLInputElement)?.focus();
                        }
                      }
                    }}
                    onBlur={(e) => updateRow(idx, toTitleCase(e.target.value))}
                    onChange={(e) => handleTitleCaseChange(e, (val) => updateRow(idx, val))}
                  />
                  <button 
                    onClick={() => handleSendWA('line', idx)}
                    disabled={!row.trim()}
                    className={`p-2 transition-colors relative z-10 ${row.trim() ? 'text-emerald-400 hover:bg-white/10' : 'text-white/30'}`}
                    title="Kirim Baris Ini"
                  >
                    <Send size={14} />
                  </button>
                </div>

                <button 
                   onClick={() => removeRow(idx)}
                   className="p-2 text-white/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <button 
              onClick={() => handleSendWA('full')}
              className="w-full bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 text-emerald-400 py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-emerald-500/30 active:scale-[0.98] shadow-[0_10px_30px_rgba(16,185,129,0.1)] font-black uppercase tracking-[0.2em]"
            >
              <Send size={20} fill="currentColor" />
              <span className="text-xs font-black">Kirim Report WhatsApp</span>
            </button>
            <div className="mt-4 opacity-50 text-center">
              <p className="text-[9px] font-bold text-ig-grey uppercase tracking-widest">Templating Otomatis Berdasarkan Waktu</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <ReportSettingsModal 
            subId={subId}
            onClose={() => setShowSettings(false)}
            initialTemplate={template}
            onSave={(heading: string, footer: string) => {
              updateReportTemplate(subId, heading, footer);
              setShowSettings(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportSettingsModal({ subId, onClose, initialTemplate, onSave }: any) {
  const [heading, setHeading] = useState(initialTemplate?.heading || '');
  const [footer, setFooter] = useState(initialTemplate?.footer || '');

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-white/20"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-black text-white">Template Report</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Pesan Pembuka (Heading)</label>
            <textarea 
              className="w-full bg-transparent border border-white/20 rounded-2xl p-4 text-sm font-black text-white outline-none min-h-[100px] transition-all"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Contoh: Laporan Harian Proyek..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Pesan Penutup (Footer)</label>
            <textarea 
              className="w-full bg-transparent border border-white/20 rounded-2xl p-4 text-sm font-black text-white outline-none min-h-[100px] transition-all"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="Contoh: Terima Kasih."
            />
          </div>
          <button 
            onClick={() => onSave(heading, footer)}
            className="w-full bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            Simpan Template
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RequestFormModal({ onClose, subId, onSubmit, initialData, isEdit, status }: { 
  onClose: () => void; 
  subId: string;
  onSubmit: (req: any) => void;
  initialData?: any;
  isEdit?: boolean;
  status?: RequestStatus;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    materialName: initialData?.materialName || '',
    quantity: initialData?.quantity || 0,
    unit: initialData?.unit || '',
    dateRequested: initialData?.dateRequested || new Date().toISOString().split('T')[0],
    dateNeeded: initialData?.dateNeeded || '',
    subId
  });

  const isLocked = status && status !== 'pending';

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-white/20 flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-bold">{isEdit ? 'Edit Permintaan' : 'Request Material'}</h3>
          <div className="flex items-center gap-2">
             {!isEdit && (
               <button 
                type="button"
                onClick={() => {
                  onClose();
                  // Wait a bit for the animation
                  setTimeout(() => {
                    const event = new CustomEvent('open-main-material');
                    window.dispatchEvent(event);
                  }, 100);
                }}
                className="text-white text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/20 transition-all shadow-sm"
               >
                 Material Utama
               </button>
             )}
             <button onClick={onClose} className="text-ig-grey">
               <X size={24} />
             </button>
          </div>
        </div>

        {isLocked && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 shrink-0" size={18} />
            <p className="text-[11px] text-yellow-700 font-medium">
              Request ini sedang diproses. Perubahan memerlukan persetujuan SCM.
            </p>
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (isSubmitting) return;
          setIsSubmitting(true);
          onSubmit(form);
          onClose();
        }} className="space-y-6">
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Nama Material</label>
            <input 
              required
              disabled={isSubmitting}
              type="text" 
              placeholder="Contoh: Semen Padang"
              className="w-full bg-transparent border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none transition-all"
              onKeyDown={handleEnterNextField}
              onBlur={e => setForm({...form, materialName: toTitleCase(e.target.value)})}
              value={form.materialName}
              onChange={e => handleTitleCaseChange(e, (val) => setForm({...form, materialName: val}))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Jumlah</label>
              <input 
                required
                disabled={isSubmitting}
                type="number" 
                className="w-full bg-transparent border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none transition-all"
                onKeyDown={handleEnterNextField}
                onFocus={e => e.target.select()}
                value={form.quantity || ''}
                onChange={e => setForm({...form, quantity: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Satuan</label>
              <input 
                required
                disabled={isSubmitting}
                type="text"
                placeholder="zak/kg/batang"
                className="w-full bg-transparent border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none transition-all"
                onKeyDown={handleEnterNextField}
                onBlur={e => setForm({...form, unit: toTitleCase(e.target.value)})}
                value={form.unit}
                onChange={e => handleTitleCaseChange(e, (val) => setForm({...form, unit: val}))}
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Batas Tanggal</label>
            <input 
              required
              disabled={isSubmitting}
              type="date" 
              className="w-full bg-transparent border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none transition-all color-scheme-dark"
              onKeyDown={handleEnterNextField}
              value={form.dateNeeded}
              onChange={e => setForm({...form, dateNeeded: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            {isSubmitting ? 'Mengirim...' : isEdit ? (isLocked ? 'Kirim Permintaan Edit' : 'Simpan Perubahan') : 'Kirim Request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function MainRequestFormModal({ onClose, subId, materials = [], onSubmit }: { 
  onClose: () => void; 
  subId: string;
  materials: any[];
  onSubmit: (req: any) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials?.[0]?.id || '');
  const [quantity, setQuantity] = useState(0);
  const [dateNeeded, setDateNeeded] = useState('');

  React.useEffect(() => {
    if (!selectedMaterialId && materials && materials.length > 0) {
      setSelectedMaterialId(materials[0].id);
    }
  }, [materials, selectedMaterialId]);

  const selectedMaterial = materials?.find(m => m.id === selectedMaterialId);

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-white/20 flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-black text-white">Request Material Utama</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (!selectedMaterial || isSubmitting) return;
          setIsSubmitting(true);
          onSubmit({
            materialName: selectedMaterial.name,
            quantity: quantity,
            unit: selectedMaterial.unit,
            dateRequested: new Date().toISOString().split('T')[0],
            dateNeeded: dateNeeded,
            subId
          });
        }} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider ml-1">Pilih Material</label>
            <select 
              required
              disabled={isSubmitting}
              className="w-full bg-transparent border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white focus:bg-white/10 outline-none appearance-none cursor-pointer"
              onKeyDown={handleEnterNextField}
              value={selectedMaterialId}
              onChange={e => setSelectedMaterialId(e.target.value)}
            >
              <option value="" disabled className="text-black">Pilih Material...</option>
              {materials.map(m => (
                <option key={m.id} value={m.id} className="text-black">{m.name.toUpperCase()} ({m.unit.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider ml-1">Jumlah</label>
            <div className="flex items-center gap-3">
              <input 
                required
                disabled={isSubmitting}
                type="number" 
                className="flex-1 bg-transparent border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none focus:bg-white/10"
                onKeyDown={handleEnterNextField}
                onFocus={e => e.target.select()}
                value={quantity || ''}
                onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
              />
              <span className="font-black text-white/60 uppercase text-[10px]">
                {selectedMaterial?.unit || '-'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider ml-1">Batas Tanggal</label>
            <input 
              required
              disabled={isSubmitting}
              type="date" 
              className="w-full bg-transparent border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none focus:bg-white/10 color-scheme-dark"
              onKeyDown={handleEnterNextField}
              value={dateNeeded}
              onChange={e => setDateNeeded(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !selectedMaterialId}
            className="w-full mt-4 bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Request Utama'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function EditProfileModal({ profile, onClose, onUpdate, onDelete, onDeleteSub }: { 
  profile: any; 
  onClose: () => void; 
  onUpdate: (name: string, avatar: string) => void;
  onDelete: () => void;
  onDeleteSub: (sub: any) => void;
}) {
  const { subs, addSub } = useApp();
  const profileSubs = subs.filter(s => s.profileId === profile.id);
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [newSubName, setNewSubName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#121212] backdrop-blur-3xl w-full max-w-sm rounded-[40px] p-8 shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8 shrink-0">
          <h3 className="text-base font-black text-white uppercase tracking-widest">Settings</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-1">
          {/* Profile Section */}
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
               <div className="w-24 h-24 rounded-[32px] border-2 border-white/10 p-1 bg-white/5 shadow-2xl">
                  <div className="w-full h-full rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                     {avatarUrl ? (
                       <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                     ) : (
                       <UserCircle size={48} className="text-white/20" />
                     )}
                  </div>
               </div>
               <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
               />
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-black text-white/40 hover:text-white flex items-center gap-2 uppercase tracking-widest transition-all"
               >
                  <Camera size={14} />
                  Ganti Foto Profil
               </button>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Nama Profile</label>
              <input 
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:bg-white/10 transition-all"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="h-[1px] bg-white/10 w-full" />

          {/* Locations Management Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1">Daftar Lokasi</h4>
              <span className="text-[9px] font-black text-white/20 bg-white/5 px-2 py-0.5 rounded-md">{profileSubs.length}</span>
            </div>

            <div className="space-y-2">
               {profileSubs.map(sub => (
                 <div key={sub.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group">
                    <div className="flex items-center gap-3">
                       <MapPin size={14} className="text-white/40 group-hover:text-white transition-colors" />
                       <span className="text-xs font-black text-white uppercase truncate max-w-[150px]">{sub.name}</span>
                    </div>
                    <button 
                      onClick={() => onDeleteSub(sub)}
                      className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-500/10"
                    >
                       <Trash2 size={14} />
                    </button>
                 </div>
               ))}

               {/* Add Sub Form Inside Modal */}
               <div className="pt-2">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="SUB LOKASI BARU..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] font-black text-white outline-none focus:bg-white/10 placeholder:text-white/10 transition-all uppercase"
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                    />
                    <button 
                      disabled={!newSubName.trim()}
                      onClick={() => {
                        addSub(newSubName, profile.id);
                        setNewSubName('');
                      }}
                      className="bg-white text-black px-4 rounded-2xl font-black text-[10px] disabled:opacity-20 transition-all active:scale-95"
                    >
                      TAMBAH
                    </button>
                  </div>
               </div>
            </div>
          </div>

          <div className="h-[1px] bg-white/10 w-full" />

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pb-4">
            <button 
              onClick={() => onUpdate(name, avatarUrl)}
              className="w-full bg-white text-black py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Simpan Perubahan
            </button>
            <button 
              onClick={onDelete}
              className="w-full py-4 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 rounded-3xl flex items-center justify-center gap-2 transition-all border border-transparent hover:border-red-500/20"
            >
              <Trash2 size={14} />
              Hapus Profile Selamanya
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, avatar: string) => void }) {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-white/20 flex flex-col"
        >
          <div className="flex items-center gap-4 mb-8">
             <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={32} className="text-white/20" />
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Plus size={20} />
                </button>
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
             <div>
                <h3 className="text-base font-black text-white">Profile Baru</h3>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mt-1">Story Identity</p>
             </div>
          </div>
          <div className="space-y-4 mb-8">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Nama Profile</label>
              <input 
                autoFocus
                required
                disabled={isSubmitting}
                type="text" 
                placeholder="Contoh: Site Masamba"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-black text-white focus:bg-white/10 outline-none transition-all"
                onKeyDown={handleEnterNextField}
                onBlur={e => setName(toTitleCase(e.target.value))}
                value={name}
                onChange={e => handleTitleCaseChange(e, (val) => setName(val))}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              disabled={isSubmitting}
              className="flex-1 py-4 text-[11px] font-black text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all uppercase tracking-widest"
            >
              Batal
            </button>
            <button 
              disabled={!name || isSubmitting}
              onClick={() => {
                setIsSubmitting(true);
                onSubmit(name, avatarUrl);
              }}
              className="flex-1 py-4 bg-white/90 backdrop-blur-md text-black rounded-2xl text-[11px] font-black shadow-xl uppercase tracking-widest active:scale-95 transition-all"
            >
              {isSubmitting ? 'Proses...' : 'Simpan'}
            </button>
          </div>
        </motion.div>
    </div>
  );
}

function SubFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-white/20 flex flex-col"
        >
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                <MapPin size={24} />
             </div>
             <div>
                <h3 className="text-base font-black text-white">Sub Lokasi Baru</h3>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mt-1">Node Proyek</p>
             </div>
          </div>
          <div className="space-y-1.5 mb-8">
            <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Nama Sub Lokasi</label>
            <input 
              autoFocus
              required
              disabled={isSubmitting}
              type="text" 
              placeholder="Contoh: BLOK A"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none focus:bg-white/10 transition-all"
              onKeyDown={handleEnterNextField}
              onBlur={e => setName(toTitleCase(e.target.value))}
              value={name}
              onChange={e => handleTitleCaseChange(e, (val) => setName(val))}
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              disabled={isSubmitting}
              className="flex-1 py-4 text-[11px] font-black text-white/40 hover:text-white/60 hover:bg-white/5 rounded-2xl transition-all uppercase tracking-widest"
            >
              Batal
            </button>
            <button 
              disabled={!name || isSubmitting}
              onClick={() => {
                setIsSubmitting(true);
                onSubmit(name);
              }}
              className="flex-1 py-4 bg-white/90 backdrop-blur-md text-black rounded-2xl text-[11px] font-black shadow-xl uppercase tracking-widest active:scale-95 transition-all"
            >
              {isSubmitting ? 'Proses...' : 'Tambah Sub'}
            </button>
          </div>
        </motion.div>
    </div>
  );
}

function ReceiveOrderModal({ onClose, request, onConfirm }: { 
  onClose: () => void; 
  request: MaterialRequest;
  onConfirm: (data: { recipient: string; deliverer: string }) => void;
}) {
  const [recipient, setRecipient] = useState(RECIPIENTS[0]);
  const [deliverer, setDeliverer] = useState(DELIVERERS[0]);

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-[250] flex items-center justify-center p-4 text-left">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-white/20 flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-base font-black text-white">Konfirmasi Paket</h3>
           <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
             <X size={24} />
           </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-green-500/80 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase truncate max-w-[200px]">{request.materialName}</h3>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">Penerimaan Terakhir</p>
          </div>
        </div>

          <div className="space-y-6 mb-8">
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Penerima</label>
              <div className="relative">
                <select 
                  className="w-full bg-transparent border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none appearance-none cursor-pointer"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                >
                  {RECIPIENTS.map(r => <option key={r} value={r} className="text-black">{r}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Dikirim Oleh</label>
              <div className="relative">
                <select 
                  className="w-full bg-transparent border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none appearance-none cursor-pointer"
                  value={deliverer}
                  onChange={e => setDeliverer(e.target.value)}
                >
                  {DELIVERERS.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                </select>
              </div>
            </div>
          </div>

        <button 
          onClick={() => onConfirm({ recipient, deliverer })}
          className="w-full bg-white/90 backdrop-blur-md text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all mb-4"
        >
          Konfirmasi Diterima
        </button>

        <p className="text-[10px] text-center text-white/30 font-bold uppercase tracking-widest">
          v1.2 • Digital Signature
        </p>
      </motion.div>
    </div>
  );
}

function FundsView({ 
  subId, 
  showAdd, 
  setShowAdd, 
  viewingNota, 
  setViewingNota 
}: { 
  subId: string;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  viewingNota: any;
  setViewingNota: (v: any) => void;
}) {
  const { 
    fieldFunds = [], 
    fieldFundDeposits = [],
    addFieldFundEntry, 
    deleteFieldFundEntry, 
    addFieldFundDeposit,
    updateFieldFundDeposit,
    deleteFieldFundDeposit,
    profiles = [], 
    subs = [], 
    activeProfileId 
  } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showWallet, setShowWallet] = useState(false);
  
  const subFunds = fieldFunds.filter(f => f.subId === subId).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  
  const subDeposits = fieldFundDeposits.filter(d => d.subId === subId);
  
  const totalExpenses = subFunds.reduce((acc, f) => acc + (Number(f.totalNota || f.total_nota || 0)), 0);
  const totalDeposits = subDeposits.reduce((acc, d) => acc + (d.type === 'out' ? -(Number(d.amount) || 0) : (Number(d.amount) || 0)), 0);
  const currentBalance = totalDeposits - totalExpenses;

  const lastNotaNo = subFunds.length > 0 ? subFunds[0].notaNo : '';

  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const activeSub = subs.find(s => s.id === subId);
  const locationName = activeSub ? activeSub.name : 'Project';

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const copyToSpreadsheet = () => {
    const selectedEntries = subFunds.filter(f => selectedIds.includes(f.id));
    if (selectedEntries.length === 0) return alert('Pilih nota yang ingin dicopy');

    let tsv = '';

    // Order by notaNo ascending for copy (as requested: smallest to largest)
    const sortedForCopy = [...selectedEntries].sort((a, b) => {
      const numA = parseInt(a.notaNo) || 0;
      const numB = parseInt(b.notaNo) || 0;
      return numA - numB;
    });

    sortedForCopy.forEach(nota => {
      nota.items.forEach((item: any, idx: number) => {
        // Format: No (notaNo), Tanggal, Uraian (item), (Kosong), Uraian (Item lagi), Klasifikasi, (Kosong), Jumlah, Satuan, Harga Satuan
        // Use nota.notaNo for the first column of the first item in each nota
        const row = [
          idx === 0 ? nota.notaNo : '',
          idx === 0 ? nota.tanggal : '', // Only first item of the nota gets the date
          item.uraian, // Uraian (item)
          '',          // (Kosong)
          item.uraian, // Uraian (item lagi)
          item.klasifikasi || 'BAHAN',
          '',          // (Kosong)
          item.jumlah,
          item.satuan,
          item.hargaSatuan
        ];
        tsv += row.join('\t') + '\n';
      });
    });

    navigator.clipboard.writeText(tsv).then(() => {
      // Automatically open the spreadsheet link as requested
      window.open('https://docs.google.com/spreadsheets/d/1WAv_c-WCeBQyfGuVjEpdCJ_BHZFadn00/edit?gid=1428346177#gid=1428346177', '_blank');
    });
  };

  const sendToWhatsApp = () => {
    const selectedEntries = subFunds.filter(f => selectedIds.includes(f.id));
    if (selectedEntries.length === 0) return alert('Pilih nota yang ingin dikirim');

    let message = '';
    
    selectedEntries.forEach((nota) => {
      // Header: Dana Lapangan - No. (Bold)
      // Location: (Lokasi)
      message += `*Dana Lapangan - No. ${nota.notaNo}*\n*${locationName}*\n\n`;
      nota.items.forEach((item: any) => {
        // Quoted item list
        message += `> ${item.uraian} ${item.jumlah} ${item.satuan}\n`;
      });
      // Inline code total with extra space
      message += `\n\`Total Rp ${(nota.totalNota || 0).toLocaleString()}\`\n\n`;
    });
    
    if (selectedEntries.length > 1) {
      const totalSemua = selectedEntries.reduce((acc, n) => acc + (n.totalNota || 0), 0);
      message += `--------------------------\n`;
      message += `*TOTAL KESELURUHAN: Rp ${totalSemua.toLocaleString()}*`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">

      <div 
        className="px-4 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 z-10 text-left overflow-hidden bg-black/20 backdrop-blur-md"
      >
        <button 
          onClick={() => setShowWallet(true)}
          className="flex items-center gap-3 relative z-10 hover:bg-white/5 p-1 rounded-2xl transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <Wallet size={22} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white uppercase">Dana Lapangan</h2>
            <p className="text-[10px] text-lime-400 font-black uppercase tracking-widest leading-none mt-0.5">Rp {currentBalance.toLocaleString()}</p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <button 
                onClick={sendToWhatsApp}
                className="bg-[#25D366] text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 hover:opacity-80 transition-all active:scale-90"
                title="Kirim WA"
              >
                <MessageCircle size={18} fill="currentColor" />
              </button>
              <button 
                onClick={copyToSpreadsheet}
                className="bg-white/10 border border-white/20 text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-lg hover:bg-white/20 transition-all active:scale-90"
                title="Copy ke Spreadsheet"
              >
                <Table size={18} />
              </button>
            </>
          )}
          <button 
            onClick={() => {
              if (!subId) return alert('Pilih sub lokasi terlebih dahulu');
              setShowAdd(true);
            }}
            className="bg-white/90 backdrop-blur-md text-black w-9 h-9 rounded-xl flex items-center justify-center shadow-xl transition-all active:scale-90"
          >
            <Plus size={22} strokeWidth={4} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar pb-24 text-left relative z-10">
        {subFunds.length === 0 ? (
          <div className="p-20 text-center text-white/30 flex flex-col items-center">
            <Wallet size={48} className="mb-4" strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest">Belum ada input dana</p>
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-transparent rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-transparent border-b border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest text-left">
                    <th className="p-4 w-10 text-center">
                       <Circle size={12} className="opacity-30 mx-auto" strokeWidth={3} />
                    </th>
                    <th className="p-4">NO NOTA</th>
                    <th className="p-4">ITEM PEMBELIAN</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-black text-white divide-y divide-white/5">
                  {subFunds.map((nota) => (
                    <tr 
                      key={nota.id} 
                      onClick={() => setViewingNota(nota)}
                      className={`hover:bg-white/10 transition-all cursor-pointer group ${selectedIds.includes(nota.id) ? 'bg-white/10' : ''}`}
                    >
                      <td className="p-4 text-center">
                         <button 
                          onClick={(e) => toggleSelect(nota.id, e)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            selectedIds.includes(nota.id) 
                            ? 'bg-white border-white text-black shadow-lg' 
                            : 'bg-transparent border-white/20 text-transparent group-hover:border-white/50'
                          }`}
                         >
                           <Check size={14} strokeWidth={4} />
                         </button>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-black text-white">#{nota.notaNo}</span>
                          <span className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">{nota.tanggal}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="truncate max-w-[150px] sm:max-w-xs">{nota.items.map((i: any) => i.uraian).join(', ')}</span>
                          <span className="text-[10px] font-black text-white/60 italic">RP {(nota.totalNota || 0).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewingNota && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 text-left" onClick={() => setViewingNota(null)}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-black/95 backdrop-blur-xl w-full max-w-sm rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col border border-white/20"
      >
        <div className="bg-white/5 p-8 pb-12 relative overflow-hidden border-b border-white/10">
          <Wallet size={120} className="absolute -right-10 -bottom-10 text-white/10 -rotate-12 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-white leading-none tracking-tight">Detail Nota</h3>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Doodle Dana Report</p>
            </div>
            <button onClick={() => setViewingNota(null)} className="w-10 h-10 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"><X size={24} /></button>
          </div>
        </div>

        <div className="px-8 -mt-6 relative z-20">
          <div className="bg-white/10 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">No. Nota</p>
                <p className="text-sm font-black text-white">#{viewingNota.notaNo}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Tanggal</p>
                <p className="text-sm font-black text-white/90">{viewingNota.tanggal}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest border-b border-white/10 pb-2">Rincian Item</p>
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                 {viewingNota.items.map((item: any, idx: number) => (
                   <div key={idx} className="flex flex-col gap-1.5 border-b border-white/5 pb-3 last:border-0">
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-black text-white">{item.uraian}</span>
                       <span className="text-[8px] font-black px-2 py-0.5 rounded-lg bg-white/10 text-white/70 uppercase tracking-wider">{item.klasifikasi || 'BAHAN'}</span>
                     </div>
                     <div className="flex items-center justify-between text-[11px] font-bold text-white/50">
                       <span className="opacity-60">{item.jumlah} {item.satuan} @ {item.hargaSatuan.toLocaleString()}</span>
                       <span className="text-white font-black italic">RP {item.hargaTotal.toLocaleString()}</span>
                     </div>
                   </div>
                 ))}
              </div>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-white/50 uppercase tracking-widest">Total Bayar</p>
                <p className="text-xl font-black text-white italic">RP {viewingNota.totalNota.toLocaleString()}</p>
              </div>
            </div>

            <button 
              onClick={() => {
                if (confirm('Hapus rincian nota ini?')) {
                  deleteFieldFundEntry(viewingNota.id);
                  setViewingNota(null);
                }
              }}
              className="w-full py-4 text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-[0.2em] hover:bg-white/5 transition-all rounded-2xl flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Hapus Selamanya
            </button>
          </div>
        </div>
        <div className="h-8" />
      </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWallet && (
          <WalletModal 
            subId={subId}
            deposits={subDeposits}
            balance={currentBalance}
            onClose={() => setShowWallet(false)}
            onAdd={(amount: number, type: 'in' | 'out') => {
              addFieldFundDeposit({
                subId,
                amount,
                type,
                date: new Date().toLocaleDateString('id-ID'),
              });
            }}
            onUpdate={(id: string, amount: number, type: 'in' | 'out') => updateFieldFundDeposit(id, amount, type)}
            onDelete={(id: string) => deleteFieldFundDeposit(id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <FundEntryModal 
            subId={subId}
            lastNotaNo={lastNotaNo}
            onClose={() => setShowAdd(false)}
            onSubmit={(entry: any) => {
              addFieldFundEntry(entry);
              
              // Format: Dana Lapangan - No. [Nomor] (Bold), Location, Quoted Items, Inline Code Total
              const msg = `*Dana Lapangan - No. ${entry.notaNo}*\n*${locationName}*\n\n` + 
                          entry.items.map((i: any) => `> ${i.uraian} ${i.jumlah} ${i.satuan}`).join('\n') + 
                          `\n\n\`Total Rp ${(entry.totalNota || 0).toLocaleString()}\``;
              
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
              setShowAdd(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function WalletModal({ subId, deposits, balance, onClose, onAdd, onUpdate, onDelete }: any) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    if (editingId) {
      onUpdate(editingId, parseFloat(amount), type);
      setEditingId(null);
    } else {
      onAdd(parseFloat(amount), type);
    }
    setAmount('');
    setType('in');
  };

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-[400] flex items-center justify-center p-4 text-left">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-[32px] p-8 shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-lime-500/10 flex items-center justify-center text-lime-400 border border-lime-500/20">
                <Wallet size={20} />
             </div>
             <div>
                <h3 className="text-base font-black text-white">Saldo Dana</h3>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Management</p>
             </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Saldo Saat Ini</p>
           <h4 className={`text-2xl font-black ${balance >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
            Rp {balance.toLocaleString()}
           </h4>
        </div>

        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button 
                type="button"
                onClick={() => setType('in')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'in' ? 'bg-lime-500 text-black' : 'text-white/40'}`}
              >
                Pemasukan
              </button>
              <button 
                type="button"
                onClick={() => setType('out')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'out' ? 'bg-red-500 text-white' : 'text-white/40'}`}
              >
                Pengurangan
              </button>
           </div>

           <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">
                {editingId ? 'Edit Nominal' : 'Input Saldo Baru'}
              </label>
              <div className="flex gap-2">
                 <input 
                    type="number"
                    placeholder="Contoh: 1000000"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none focus:bg-white/10 transition-all placeholder:text-white/10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                 />
                 <button 
                    type="submit"
                    className={`px-6 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all ${type === 'in' ? 'bg-lime-500 text-black' : 'bg-red-500 text-white'}`}
                 >
                    {editingId ? 'Ok' : 'Add'}
                 </button>
              </div>
              {editingId && (
                <button 
                  type="button"
                  onClick={() => { setEditingId(null); setAmount(''); setType('in'); }}
                  className="text-[9px] font-black text-red-400 uppercase tracking-widest ml-1"
                >
                  Batal Edit
                </button>
              )}
           </div>
        </form>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Riwayat Pengisian</p>
          {deposits.length === 0 ? (
            <div className="py-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
               <p className="text-xs font-bold text-white/20 italic">Belum ada pengisian saldo</p>
            </div>
          ) : (
            deposits.map((d: any) => (
              <div key={d.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.type === 'out' ? 'bg-red-500/10 text-red-500' : 'bg-lime-500/10 text-lime-500'}`}>
                    {d.type === 'out' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                  </div>
                  <div>
                    <p className={`text-xs font-black ${d.type === 'out' ? 'text-red-400' : 'text-lime-400'}`}>
                      {d.type === 'out' ? '-' : '+'} Rp {d.amount.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">{d.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => { 
                      setEditingId(d.id); 
                      setAmount(d.amount.toString()); 
                      setType(d.type || 'in');
                    }}
                    className="p-2 text-white/40 hover:text-white transition-colors"
                   >
                     <Edit2 size={14} />
                   </button>
                   <button 
                    onClick={() => onDelete(d.id)}
                    className="p-2 text-white/40 hover:text-red-500 transition-colors"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ProfileManagementView({ 
  profiles, 
  activeProfileId, 
  setActiveProfileId,
  setShowAddProfile,
  setShowEditProfile,
  getProfileAvatar
}: any) {

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden pt-4 relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 text-left">
        <div className="grid grid-cols-3 gap-6">
          <button 
            onClick={() => setShowAddProfile(true)}
            className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 hover:text-white hover:border-white/40 transition-all bg-white/5 shadow-xl backdrop-blur-md">
              <Plus size={32} />
            </div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tambah</span>
          </button>
          
          {profiles.map((prof: any) => (
            <button
              key={prof.id}
              onClick={() => setActiveProfileId(prof.id)}
              className="flex flex-col items-center gap-3 relative group active:scale-95 transition-all"
            >
              <div className={`w-20 h-20 rounded-3xl p-1 border-2 transition-all overflow-hidden ${
                activeProfileId === prof.id ? 'border-white shadow-2xl shadow-white/20 rotate-3' : 'border-white/10 bg-white/5 shadow-sm'
              }`}>
                <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-white/5">
                  {getProfileAvatar(prof)}
                </div>
              </div>
              <span className={`text-[11px] font-black tracking-tight truncate w-24 text-center uppercase tracking-widest ${
                activeProfileId === prof.id ? 'text-white' : 'text-white/40'
              }`}>{prof.name}</span>
              
              {activeProfileId === prof.id && (
                <div className="absolute top-0 right-0 -mr-1 -mt-1 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                  <CheckCircle2 size={14} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        {activeProfileId && (
          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/40">
                <Settings size={20} />
              </div>
              <button 
                onClick={() => setShowEditProfile(true)}
                className="bg-ig-black text-white w-12 h-12 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
                title="Edit Profil"
              >
                <Edit2 size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSelectionModal({ profiles, onSelect, onAdd, getProfileAvatar, onEdit }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-transparent opacity-40 scale-105"
        />
        <div className="absolute inset-0 backdrop-blur-md bg-black/40" />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh] border border-white/20"
      >
        <div className="px-8 py-8 border-b border-white/10 bg-white/5 text-center">
          <h2 className="text-2xl font-black tracking-tight mb-1 text-white leading-none">Renovki Konstruksi</h2>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Pilih Profile</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {profiles.length === 0 ? (
            <div className="text-center py-8">
               <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6 text-white/20">
                  <MapPin size={32} />
               </div>
               <h3 className="text-base font-bold mb-2 text-white">Belum Ada Lokasi</h3>
               <p className="text-white/40 text-[11px] mb-8 font-medium">Tambahkan lokasi proyek pertama Anda untuk mulai mengelola</p>
               <button 
                onClick={onAdd}
                className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
               >
                 <Plus size={20} strokeWidth={4} />
                 TAMBAH LOKASI
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {profiles.map((prof: any) => (
                <div key={prof.id} className="relative group">
                  <button
                    onClick={() => onSelect(prof.id)}
                    className="flex flex-col items-center gap-3 active:scale-95 transition-all text-center w-full"
                  >
                    <div className="w-24 h-24 rounded-[32px] overflow-hidden flex items-center justify-center bg-white/5 border border-white/10 shadow-lg group-hover:scale-105 transition-all p-1">
                      <div className="w-full h-full rounded-[24px] overflow-hidden">
                        {getProfileAvatar(prof)}
                      </div>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest truncate w-full text-white">{prof.name}</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(prof);
                    }}
                    className="absolute top-0 right-0 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
                    title="Manage Profile & Locations"
                  >
                    <Settings size={14} />
                  </button>
                </div>
              ))}
              <button 
                onClick={onAdd}
                className="flex flex-col items-center gap-3 active:scale-95 transition-all group"
              >
                <div className="w-24 h-24 rounded-[32px] flex items-center justify-center border-2 border-dashed border-white/10 bg-transparent text-white/20 hover:text-white/40 transition-all">
                  <Plus size={32} />
                </div>
                <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Baru</span>
              </button>
            </div>
          )}
        </div>
        
      </motion.div>
    </div>
  );
}

function FundEntryModal({ subId, onClose, onSubmit, lastNotaNo }: any) {
  const [form, setForm] = useState({
    subId,
    tanggal: new Date().toISOString().split('T')[0],
    notaNo: (() => {
      if (!lastNotaNo) return '1';
      const match = lastNotaNo.match(/^(\D*)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const numPart = match[2];
        const incremented = (parseInt(numPart) + 1).toString();
        return prefix + incremented.padStart(numPart.length, '0');
      }
      return lastNotaNo + '-1';
    })(),
    items: [{
      uraian: '',
      klasifikasi: 'BAHAN',
      jumlah: 0,
      satuan: '',
      hargaSatuan: 0,
      hargaTotal: 0
    }],
    totalNota: 0,
    keterangan: ''
  });

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        uraian: '',
        klasifikasi: 'BAHAN',
        jumlah: 0,
        satuan: '',
        hargaSatuan: 0,
        hargaTotal: 0
      }]
    }));
  };

  const removeItem = (idx: number) => {
    if (form.items.length === 1) return;
    const newItems = form.items.filter((_, i) => i !== idx);
    const newTotal = newItems.reduce((acc, item) => acc + (item.hargaTotal || 0), 0);
    setForm({ ...form, items: newItems, totalNota: newTotal });
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const newItems = [...form.items];
    const item = newItems[idx];
    (item as any)[field] = val;
    
    // Logic: Always keep Harga Satuan updated if it's derived from Total and Qty
    const qty = parseFloat(item.jumlah as any) || 0;
    const total = parseFloat(item.hargaTotal as any) || 0;
    
    if (qty > 0) {
      if (field === 'hargaTotal' || field === 'jumlah') {
        item.hargaSatuan = Math.round((total / qty) * 100) / 100;
      }
    } else {
      item.hargaSatuan = 0;
    }

    const newTotal = newItems.reduce((acc, item) => acc + (item.hargaTotal || 0), 0);
    setForm({ ...form, items: newItems, totalNota: newTotal });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex justify-center items-start overflow-y-auto custom-scrollbar p-6">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: -50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-zinc-900/70 backdrop-blur-3xl w-full max-w-sm rounded-[40px] shadow-2xl relative border border-white/20 my-4 flex flex-col overflow-hidden max-h-[90dvh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 relative z-10 flex items-center justify-between border-b border-white/10 bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Banknote size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-tight leading-none uppercase">Dana Lapangan</h3>
              <p className="text-[8px] text-white/40 font-black uppercase tracking-widest mt-1">Input Nota Baru</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          const validItems = form.items.filter(item => item.uraian.trim() !== '');
          if (validItems.length === 0) return alert('Isi minimal 1 item');
          onSubmit({ ...form, items: validItems });
        }} className="flex-1 flex flex-col min-h-0 relative z-10">
          
          <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02] shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">No. Nota</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-white placeholder:text-white/20 focus:bg-white/10 outline-none transition-all"
                  onKeyDown={handleEnterNextField}
                  value={form.notaNo}
                  onChange={e => handleTitleCaseChange(e, (val) => setForm({...form, notaNo: val}))}
                  placeholder="000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">Tanggal</label>
                <input 
                  required
                  type="date" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-[11px] font-black text-white outline-none transition-all color-scheme-dark"
                  onKeyDown={handleEnterNextField}
                  value={form.tanggal}
                  onChange={e => setForm({...form, tanggal: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar pb-24 space-y-4">
            <div className="flex items-center justify-between px-1 bg-transparent sticky top-0 py-2 z-20 backdrop-blur-md">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Item Nota</p>
              <button 
                type="button"
                onClick={addItem}
                className="text-[8px] font-black text-white uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/20 transition-all active:scale-95"
              >
                + Tambah
              </button>
            </div>

            <div className="space-y-4">
              {form.items.map((item, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl relative shadow-sm">
                  {form.items.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="absolute -top-1 -right-1 w-7 h-7 bg-red-500/80 backdrop-blur-md text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Uraian Pekerjaan / Material</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-xs font-black text-white outline-none focus:bg-white/10" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const itemContainer = e.currentTarget.closest('.space-y-3');
                            const inputs = itemContainer?.querySelectorAll('input');
                            if (inputs && inputs.length > 1) {
                              (inputs[1] as HTMLElement).focus();
                            }
                          }
                        }}
                        onBlur={e => updateItem(idx, 'uraian', toTitleCase(e.target.value))}
                        value={item.uraian}
                        onChange={e => handleTitleCaseChange(e, (val) => updateItem(idx, 'uraian', val))}
                        placeholder="..."
                      />
                    </div>

                    <div className="flex gap-1.5">
                      {['BAHAN', 'ALAT', 'JASA'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => updateItem(idx, 'klasifikasi', k)}
                          className={`flex-1 py-1.5 rounded-xl text-[8px] font-black transition-all border ${
                            item.klasifikasi === k 
                            ? 'bg-white text-black border-white shadow-lg' 
                            : 'bg-transparent text-white/20 border-white/5'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Jumlah</label>
                        <input 
                          type="number" 
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs font-black text-white outline-none focus:bg-white/10" 
                          onKeyDown={handleEnterNextField}
                          onFocus={e => e.target.select()}
                          value={item.jumlah === 0 ? '' : item.jumlah}
                          onChange={e => updateItem(idx, 'jumlah', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Satuan</label>
                        <input 
                          type="text" 
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs font-black text-white outline-none focus:bg-white/10" 
                          onKeyDown={handleEnterNextField}
                          onBlur={e => updateItem(idx, 'satuan', toTitleCase(e.target.value))}
                          value={item.satuan}
                          onChange={e => handleTitleCaseChange(e, (val) => updateItem(idx, 'satuan', val))}
                          placeholder="Satuan"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-white/50 uppercase tracking-widest">Total Harga (Rp)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm font-black text-white outline-none focus:bg-white/10 transition-all font-mono" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (idx === form.items.length - 1) {
                              e.preventDefault();
                              addItem();
                              setTimeout(() => {
                                const allInputs = document.querySelectorAll('input');
                                const targetInput = Array.from(allInputs).filter(i => i.placeholder === '...').pop();
                                targetInput?.focus();
                              }, 50);
                            } else {
                              handleEnterNextField(e);
                            }
                          }
                        }}
                        onFocus={e => e.target.select()}
                        value={item.hargaTotal === 0 ? '' : item.hargaTotal}
                        onChange={e => updateItem(idx, 'hargaTotal', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex items-center justify-between px-1 text-[8px] font-black text-white/30 italic uppercase tracking-wider">
                      <span>Hrg Satuan</span>
                      <span>RP {item.hargaSatuan.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-5 py-3.5 bg-zinc-950/95 backdrop-blur-3xl border-t border-white/10 flex items-center justify-between rounded-b-[40px] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] shrink-0">
             <div className="space-y-0.5">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Total Nota</p>
                <p className="text-base font-black italic text-white leading-none">RP {form.totalNota.toLocaleString()}</p>
             </div>
             
             <button 
                type="submit"
                className="w-11 h-11 bg-white hover:bg-neutral-200 text-black rounded-2xl flex items-center justify-center active:scale-[0.95] transition-all shadow-xl"
                title="Simpan Nota"
             >
                <Send size={15} fill="currentColor" />
             </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ManualStockModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, qty: number, unit: string) => void }) {
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: ''
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[400] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-[#1a1a1a] border border-white/10 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Tambah Stok Manual</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form.name, parseFloat(form.quantity) || 0, form.unit);
        }} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Nama Material</label>
            <input 
              required
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-black text-white outline-none focus:bg-white/10 transition-all"
              onKeyDown={handleEnterNextField}
              onBlur={e => setForm({...form, name: toTitleCase(e.target.value)})}
              value={form.name}
              onChange={e => handleTitleCaseChange(e, (val) => setForm({...form, name: val}))}
              placeholder="Contoh: Semen Padang"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Jumlah</label>
              <input 
                required
                type="number" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-black text-white outline-none focus:bg-white/10 transition-all"
                onKeyDown={handleEnterNextField}
                onFocus={e => e.target.select()}
                value={form.quantity}
                onChange={e => setForm({...form, quantity: e.target.value})}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Satuan</label>
              <input 
                required
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-black text-white outline-none focus:bg-white/10 transition-all"
                onKeyDown={handleEnterNextField}
                onBlur={e => setForm({...form, unit: toTitleCase(e.target.value)})}
                value={form.unit}
                onChange={e => handleTitleCaseChange(e, (val) => setForm({...form, unit: val}))}
                placeholder="zak/ret/dus"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-4 bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            SIMPAN STOK
          </button>
        </form>
      </motion.div>
    </div>
  );
}
