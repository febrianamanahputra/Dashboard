import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Plus, Package, MapPin, X, AlertTriangle, HardHat, FileSpreadsheet, CheckCircle2, Trash2, Edit2, Camera, UserCircle, History, BarChart3, Box, Clock, Target, PlusSquare, RefreshCw, ClipboardList, Wallet, Send, Settings, Table, FileText, Landmark, Circle } from 'lucide-react';
import { StockEntry, MaterialRequest, RequestStatus } from '../../types';
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
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [view, setView] = useState<'main' | 'rap'>('main');
  const [activeTab, setActiveTab] = useState<'active' | 'riwayat' | 'total' | 'stok'>('active');
  const [subStock, setSubStock] = useState<StockEntry[]>([]);
  const [receivingRequest, setReceivingRequest] = useState<MaterialRequest | null>(null);
  const [activeView, setActiveView] = useState<'reports' | 'requests' | 'funds' | 'profile'>('requests');
  const [reportDrafts, setReportDrafts] = useState<Record<string, string[]>>({});

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
      case 'pending': return 'Belum di proses';
      case 'processing': return 'Diproses';
      case 'awaiting_payment': return 'Menunggu Pembayaran';
      case 'paid': return 'Pembayaran Berhasil';
      case 'delivered': return 'Pengantaran';
      case 'received': return 'Diterima';
      case 'on_hold': return 'HOLD / INDENT';
      default: return s;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'delivered': return 'bg-blue-50 text-ig-blue border-blue-100 italic font-medium';
      case 'on_hold': return 'bg-red-50 text-red-500 border-red-100';
      case 'pending': return 'bg-gray-50 text-ig-grey border-border-ig';
      case 'paid': return 'bg-green-50 text-green-600 border-green-100 font-bold';
      default: return 'bg-gray-50 text-ig-black border-border-ig';
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
    <div className="relative h-full flex flex-col bg-bg-base overflow-hidden">
      {/* Global Top Nav Bar for Sub Selection */}
      {activeProfile && activeView !== 'profile' && (
        <div className="bg-bg-base border-b border-border-ig flex flex-col shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setShowEditProfile(true)}
                className="w-8 h-8 rounded-full bg-bg-alt flex items-center justify-center border border-border-ig overflow-hidden shrink-0 cursor-pointer"
              >
                {getProfileAvatar(activeProfile)}
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight leading-none mb-1">{activeProfile.name}</h2>
                <div className="flex items-center gap-1.5 text-ig-blue">
                   <MapPin size={10} strokeWidth={3} />
                   <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                     {profileSubs.find(s => s.id === activeSubId)?.name || 'Pilih Sub'}
                   </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               {/* Buttons removed from here as they are moved to view-specific headers */}
            </div>
          </div>

          {/* iOS Style Segmented Control for Subs (Horizontal Scroll) */}
          <div className="px-4 pb-3 overflow-x-auto custom-scrollbar-hide">
            <div className="flex bg-bg-alt p-1 rounded-xl gap-1 min-w-max">
              {profileSubs.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubId(sub.id)}
                  className={`shrink-0 px-5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    activeSubId === sub.id 
                      ? 'bg-white text-ig-black shadow-sm ring-1 ring-black/5' 
                      : 'text-ig-grey hover:text-ig-black'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
              <button
                onClick={() => setShowAddSub(true)}
                className="px-3 py-1.5 text-ig-grey hover:text-ig-blue transition-colors flex items-center justify-center"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="flex-1 flex flex-col overflow-hidden bg-bg-alt pb-[85px] md:pb-[70px] safe-area-pb">
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
                      <div className="px-4 py-3 bg-bg-base flex items-center justify-between border-b border-border-ig">
                        <div className="flex items-center p-1.5 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl shadow-lg shadow-green-500/20 gap-1">
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
                      <div className="px-4 py-6 bg-bg-base">
                        <div className="bg-bg-alt/50 backdrop-blur-md p-1 rounded-2xl flex items-center gap-1 relative overflow-hidden ring-1 ring-black/5">
                          {(['active', 'riwayat', 'total', 'stok'] as const).map((tab) => {
                            const isActive = activeTab === tab;
                            const labels = { active: 'Aktif', riwayat: 'Riwayat', total: 'Total', stok: 'Stok' };
                            
                            return (
                              <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative flex-1 py-3 flex items-center justify-center z-10 transition-all duration-300 ${
                                  isActive ? 'text-[#00FF00]' : 'text-ig-grey hover:text-ig-black'
                                }`}
                              >
                                {isActive && (
                                  <motion.div 
                                    layoutId="glass-bubble"
                                    className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-white/20"
                                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                                  />
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-widest relative z-10">{labels[tab]}</span>
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
                              activeRequests.map(req => (
                                <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ig-card overflow-hidden group">
                                  <div className="p-4 border-b border-border-ig flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-bg-alt flex items-center justify-center border border-border-ig">
                                        <Package size={16} />
                                      </div>
                                      <span className="font-bold text-sm tracking-tight">{req.materialName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] border shadow-sm ${getStatusColor(req.status)}`}>
                                        {getStatusLabel(req.status)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <div className="flex items-baseline justify-between mb-2">
                                       <span className="text-2xl font-bold tracking-tighter">{req.quantity} <span className="text-xs font-medium text-ig-grey uppercase tracking-widest">{req.unit}</span></span>
                                       <span className="text-[11px] text-ig-grey font-medium">Batas: {new Date(req.dateNeeded).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                      {req.status === 'delivered' && (
                                        <button onClick={() => setReceivingRequest(req)} className="flex-1 bg-ig-blue text-white py-2 rounded-md font-bold text-[13px] hover:opacity-90 transition-opacity">Selesaikan Penerimaan</button>
                                      )}
                                      <button onClick={() => setEditingRequest(req)} className="p-2 rounded-md border border-border-ig text-ig-grey hover:bg-bg-alt transition-colors"><Edit2 size={16} /></button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </>
                        )}
                        {activeTab === 'riwayat' && (
                          <>
                            <h3 className="text-[10px] font-bold text-ig-grey uppercase tracking-widest px-1">Material Diterima</h3>
                            {historyRequests.length === 0 ? (
                              <div className="ig-card p-12 flex flex-col items-center justify-center text-center opacity-40">
                                 <History size={32} className="mb-2" />
                                 <p className="text-xs font-bold uppercase tracking-widest">Belum ada riwayat</p>
                              </div>
                            ) : (
                              historyRequests.map(req => (
                                <div key={req.id} className="ig-card p-4 flex items-center justify-between border-l-4 border-green-500">
                                  <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600"><CheckCircle2 size={20} /></div>
                                    <div>
                                      <p className="text-sm font-bold tracking-tight">{req.materialName}</p>
                                      <p className="text-[10px] text-ig-grey font-medium italic mt-1">Diterima: {new Date(req.receivedAt).toLocaleDateString('id-ID')}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-sm font-black italic">{req.quantity} <span className="text-[10px] opacity-60">{req.unit}</span></p>
                                  </div>
                                </div>
                              ))
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
                                   <div key={idx} className="p-4 flex items-center justify-between bg-white">
                                      <div>
                                        <p className="text-sm font-bold tracking-tight">{item.materialName}</p>
                                        <p className="text-[10px] text-ig-black font-bold uppercase tracking-tighter mt-0.5">Sudah Diterima</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xl font-black italic tracking-tighter leading-none text-ig-blue">{item.quantity}</p>
                                        <span className="text-[10px] font-bold uppercase text-ig-grey">{item.unit}</span>
                                      </div>
                                   </div>
                                 ))
                               )}
                            </div>
                          </>
                        )}
                        {activeTab === 'stok' && (
                          <>
                            <h3 className="text-[10px] font-bold text-ig-grey uppercase tracking-widest px-1">Gudang Mini ({subStock.length})</h3>
                            {subStock.length === 0 ? (
                              <div className="ig-card p-12 flex flex-col items-center justify-center text-center opacity-40">
                                 <Box size={32} className="mb-2" />
                                 <p className="text-xs font-bold uppercase tracking-widest">Stok kosong</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3">
                                {subStock.map((entry) => (
                                  <motion.button  layout key={entry.id} onClick={() => { setSelectedStock(entry); setEditQuantity(entry.quantity.toString()); }} className="ig-card p-4 flex flex-col gap-1 transition-all hover:ring-2 hover:ring-ig-blue active:scale-95">
                                    <span className="text-[9px] font-bold text-ig-grey uppercase tracking-widest">{entry.materialName}</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                      <span className="text-2xl font-black italic tracking-tighter text-ig-black">{entry.quantity}</span>
                                      <span className="text-[10px] font-bold uppercase text-ig-grey">{entry.unit}</span>
                                    </div>
                                    <div className="mt-2 text-[8px] text-ig-grey uppercase font-bold flex items-center gap-1 opacity-60"><RefreshCw size={8} /> {new Date(entry.dateReceived).toLocaleDateString('id-ID')}</div>
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
                  <FundsView subId={activeSubId || ''} />
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
              getProfileAvatar={getProfileAvatar}
            />
          )}
        </AnimatePresence>

        {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border-ig px-2 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-around z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] min-h-[70px] md:h-[70px]">
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
        {selectedStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative border border-border-ig flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-base font-bold">Edit Quantity</h3>
                <button onClick={() => setSelectedStock(null)} className="text-ig-grey">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider mb-2">Material</p>
                  <p className="font-bold text-base">{selectedStock.materialName}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider">Adjustment</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      className="flex-1 bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-lg font-bold focus:ring-1 focus:ring-ig-blue outline-none transition-all"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                    />
                    <span className="font-bold text-ig-grey uppercase text-xs">{selectedStock.unit}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (activeSubId && selectedStock) {
                      updateStock(activeSubId, selectedStock.id, parseFloat(editQuantity) || 0);
                      setSelectedStock(null);
                    }
                  }}
                  className="w-full bg-ig-blue text-white py-3 rounded-md font-bold text-[14px] hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
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
              className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative border border-border-ig text-center"
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
      className={`flex flex-col items-center gap-0.5 transition-all ${
        active ? 'text-ig-blue scale-110' : 'text-ig-grey'
      }`}
    >
      <div className={`${active ? 'bg-ig-blue/10 p-1.5 rounded-xl text-ig-blue' : 'p-1.5 text-ig-grey'}`}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
    </button>
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
    const locationName = activeProfile ? activeProfile.name : 'Project';
    const targetLocation = locationName;
    const dateStr = getIndonesianDate();

    let message = '';
    if (mode === 'full') {
      const validLines = rows.filter(r => r.trim()).map(r => 
        isAfternoon ? `> Pek. ${r.trim()}` : `- Pek. ${r.trim()}`
      );
      if (validLines.length === 0) return alert('Input laporan terlebih dahulu');
      
      if (isAfternoon) {
        message = `*Bismillah,*\n*Progress Project ${targetLocation}*\n\n\n\`${dateStr}\`\n${separator}\n${validLines.join('\n')}\n${separator}\nTerima kasih`;
      } else {
        message = `Bismillah, Selamat Pagi Bapak/ibu\nRencana Kerja ${targetLocation}\n\n\n${dateStr}\n${separator}\n${validLines.join('\n')}\n${separator}\nTerima kasih`;
      }
    } else if (lineIndex !== undefined) {
      const lineText = rows[lineIndex].trim();
      if (!lineText) return;
      message = isAfternoon ? `> Pek. ${lineText}` : `- Pek. ${lineText}`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-base overflow-hidden">
      <div className="px-5 py-4 border-b border-border-ig flex items-center justify-between bg-bg-base sticky top-0 z-10 shadow-sm text-left">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-tight">Report Harian</h2>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar pb-32">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-1">
             <label className="text-[10px] font-bold text-ig-grey uppercase tracking-widest">Detail Pekerjaan (Caption)</label>
             <button 
              onClick={addRow}
              className="text-ig-blue text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
             >
               Tambah Baris
             </button>
          </div>

          <div className="space-y-1.5">
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2 group">
                <div 
                  className={`flex-1 flex items-center bg-gradient-to-br ${rowColors[idx % rowColors.length]} rounded-none border border-border-ig overflow-hidden focus-within:ring-1 focus-within:ring-ig-blue transition-all relative`}
                >
                  {/* Bubble Watermark Effect */}
                  <div className="absolute right-10 -bottom-2 text-ig-blue/10 pointer-events-none select-none group-hover:scale-110 transition-transform">
                     <div className="relative">
                        <Circle size={40} className="opacity-20" strokeWidth={1} />
                        <Circle size={20} className="absolute -top-2 -left-2 opacity-10" strokeWidth={1} />
                     </div>
                  </div>

                  <input 
                    type="text"
                    className="flex-1 px-4 py-3 text-xs font-bold outline-none bg-transparent placeholder:italic placeholder:opacity-50 z-10"
                    placeholder="Input detail pekerjaan..."
                    value={row}
                    onChange={(e) => updateRow(idx, e.target.value)}
                  />
                  <button 
                    onClick={() => handleSendWA('line', idx)}
                    disabled={!row.trim()}
                    className={`p-2 transition-colors relative z-10 ${row.trim() ? 'text-[#25D366] hover:bg-green-50/50' : 'text-ig-grey opacity-20'}`}
                    title="Kirim Baris Ini"
                  >
                    <Send size={14} />
                  </button>
                </div>

                <button 
                   onClick={() => removeRow(idx)}
                   className="p-2 text-ig-grey hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <button 
              onClick={() => handleSendWA('full')}
              className="w-full bg-[#25D366] text-white py-4 rounded-none flex items-center justify-center gap-3 transition-all hover:opacity-95 active:scale-[0.98] shadow-lg shadow-green-500/10"
            >
              <Send size={18} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Kirim Report WhatsApp</span>
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
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-base w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-border-ig"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-bold">Template Report</h3>
          <button onClick={onClose} className="text-ig-grey"><X size={24} /></button>
        </div>

        <div className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-widest ml-1">Pesan Pembuka (Heading)</label>
            <textarea 
              className="w-full bg-bg-alt border border-border-ig rounded-xl p-4 text-sm font-medium focus:ring-1 focus:ring-ig-blue outline-none min-h-[100px]"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Contoh: Laporan Harian Proyek..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-widest ml-1">Pesan Penutup (Footer)</label>
            <textarea 
              className="w-full bg-bg-alt border border-border-ig rounded-xl p-4 text-sm font-medium focus:ring-1 focus:ring-ig-blue outline-none min-h-[100px]"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="Contoh: Terima Kasih."
            />
          </div>
          <button 
            onClick={() => onSave(heading, footer)}
            className="w-full bg-ig-blue text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-ig-blue/20 transition-all active:scale-95"
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
    quantity: initialData?.quantity || 1,
    unit: initialData?.unit || 'zak',
    dateRequested: initialData?.dateRequested || new Date().toISOString().split('T')[0],
    dateNeeded: initialData?.dateNeeded || '',
    subId
  });

  const isLocked = status && status !== 'pending';

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative border border-border-ig flex flex-col"
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
                className="text-ig-blue text-[10px] font-bold uppercase tracking-wider bg-ig-blue/5 px-2 py-1.5 rounded-md border border-ig-blue/10 hover:bg-ig-blue/10 transition-colors"
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
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Nama Material</label>
            <input 
              required
              disabled={isSubmitting}
              type="text" 
              placeholder="Contoh: Semen Padang"
              className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none"
              value={form.materialName}
              onChange={e => setForm({...form, materialName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Jumlah</label>
              <input 
                required
                disabled={isSubmitting}
                type="number" 
                min="1"
                className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                value={form.quantity}
                onChange={e => setForm({...form, quantity: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Satuan</label>
              <select 
                disabled={isSubmitting}
                className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none appearance-none"
                value={form.unit}
                onChange={e => setForm({...form, unit: e.target.value})}
              >
                {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Batas Tanggal</label>
            <input 
              required
              disabled={isSubmitting}
              type="date" 
              className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none"
              value={form.dateNeeded}
              onChange={e => setForm({...form, dateNeeded: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 bg-ig-blue text-white py-4 rounded-md font-bold text-sm shadow-lg shadow-ig-blue/20"
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
  const [quantity, setQuantity] = useState(1);
  const [dateNeeded, setDateNeeded] = useState('');

  React.useEffect(() => {
    if (!selectedMaterialId && materials && materials.length > 0) {
      setSelectedMaterialId(materials[0].id);
    }
  }, [materials, selectedMaterialId]);

  const selectedMaterial = materials?.find(m => m.id === selectedMaterialId);

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative border border-border-ig flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-bold">Request Material Utama</h3>
          <button onClick={onClose} className="text-ig-grey">
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
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Pilih Material</label>
            <select 
              required
              disabled={isSubmitting}
              className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none appearance-none"
              value={selectedMaterialId}
              onChange={e => setSelectedMaterialId(e.target.value)}
            >
              <option value="" disabled>Pilih Material...</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name.toUpperCase()} ({m.unit.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Jumlah</label>
            <div className="flex items-center gap-3">
              <input 
                required
                disabled={isSubmitting}
                type="number" 
                min="1"
                className="flex-1 bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
              />
              <span className="font-bold text-ig-grey uppercase text-xs">
                {selectedMaterial?.unit || '-'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Batas Tanggal</label>
            <input 
              required
              disabled={isSubmitting}
              type="date" 
              className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none"
              value={dateNeeded}
              onChange={e => setDateNeeded(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !selectedMaterialId}
            className="w-full mt-4 bg-ig-blue text-white py-4 rounded-md font-bold text-sm shadow-lg shadow-ig-blue/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Request Utama'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function EditProfileModal({ profile, onClose, onUpdate, onDelete }: { 
  profile: any; 
  onClose: () => void; 
  onUpdate: (name: string, avatar: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
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
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl border border-border-ig flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-bold">Pengaturan Profile</h3>
          <button onClick={onClose} className="text-ig-grey">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
             <div className="w-24 h-24 rounded-full border-2 border-ig-blue p-1">
                <div className="w-full h-full rounded-full bg-bg-alt border border-border-ig flex items-center justify-center overflow-hidden">
                   {avatarUrl ? (
                     <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <UserCircle size={48} className="text-ig-grey" />
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
              className="text-xs font-bold text-ig-blue flex items-center gap-1"
             >
                <Camera size={14} />
                Ganti Foto Profile
             </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Nama Profile</label>
              <input 
                type="text"
                className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => onUpdate(name, avatarUrl)}
              className="w-full bg-ig-blue text-white py-3 rounded-md font-bold text-[14px]"
            >
              Simpan Perubahan
            </button>
            <button 
              onClick={onDelete}
              className="w-full py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-md flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Hapus Profile
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
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl border border-border-ig flex flex-col"
      >
        <div className="flex items-center gap-4 mb-8">
           <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-border-ig flex items-center justify-center overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={32} className="text-ig-grey" />
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
              <h3 className="text-base font-bold">Profile Baru</h3>
              <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider">Story Identity</p>
           </div>
        </div>
        <div className="space-y-4 mb-8">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Nama Profile</label>
            <input 
              autoFocus
              required
              disabled={isSubmitting}
              type="text" 
              placeholder="Contoh: Site Masamba"
              className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-base font-bold focus:ring-1 focus:ring-ig-blue outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1 py-3 text-[12px] font-bold text-ig-grey hover:bg-bg-alt rounded-md transition-colors"
          >
            Batal
          </button>
          <button 
            disabled={!name || isSubmitting}
            onClick={() => {
              setIsSubmitting(true);
              onSubmit(name, avatarUrl);
            }}
            className="flex-1 py-3 bg-ig-blue text-white rounded-md text-[12px] font-bold shadow-lg shadow-ig-blue/20"
          >
            {isSubmitting ? 'Menyimpan...' : 'Tambah Profile'}
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
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl border border-border-ig flex flex-col"
      >
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-bg-alt border border-border-ig rounded-full flex items-center justify-center">
              <MapPin size={24} className="text-ig-black" />
           </div>
           <div>
              <h3 className="text-base font-bold">Sub Lokasi Baru</h3>
              <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider">Node Proyek</p>
           </div>
        </div>
        <div className="space-y-1 mb-8">
          <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Nama Sub Lokasi</label>
          <input 
            autoFocus
            required
            disabled={isSubmitting}
            type="text" 
            placeholder="Contoh: BLOK A"
            className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-base font-bold focus:ring-1 focus:ring-ig-blue outline-none shadow-sm"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1 py-3 text-[12px] font-bold text-ig-grey hover:bg-bg-alt rounded-md transition-colors"
          >
            Batal
          </button>
          <button 
            disabled={!name || isSubmitting}
            onClick={() => {
              setIsSubmitting(true);
              onSubmit(name);
            }}
            className="flex-1 py-3 bg-ig-blue text-white rounded-md text-[12px] font-bold shadow-lg shadow-ig-blue/20"
          >
            {isSubmitting ? 'Menyimpan...' : 'Tambah Sub'}
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
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4 text-left">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative border border-border-ig flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-base font-bold">Konfirmasi Paket</h3>
           <button onClick={onClose} className="text-ig-grey">
             <X size={24} />
           </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center">
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase truncate max-w-[200px]">{request.materialName}</h3>
            <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider">Penerimaan Terakhir</p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Penerima</label>
            <div className="relative">
              <select 
                className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none appearance-none"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              >
                {RECIPIENTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Dikirim Oleh</label>
            <div className="relative">
              <select 
                className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none appearance-none"
                value={deliverer}
                onChange={e => setDeliverer(e.target.value)}
              >
                {DELIVERERS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onConfirm({ recipient, deliverer })}
          className="w-full bg-ig-blue text-white py-4 rounded-md font-bold text-sm shadow-lg shadow-ig-blue/20 transition-all active:scale-95"
        >
          Konfirmasi Diterima
        </button>
      </motion.div>
    </div>
  );
}

function FundsView({ subId }: { subId: string }) {
  const { fieldFunds = [], addFieldFundEntry, deleteFieldFundEntry } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  
  const subFunds = fieldFunds.filter(f => f.subId === subId);

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-base overflow-hidden">
      <div className="px-4 py-4 border-b border-border-ig flex items-center justify-between bg-bg-base sticky top-0 z-10 shadow-sm text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
            <Landmark size={22} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Dana Lapangan</h2>
            <p className="text-[10px] text-ig-grey font-bold uppercase tracking-widest leading-none">Petty Cash Proyek</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (!subId) return alert('Pilih sub lokasi terlebih dahulu');
            setShowAdd(true);
          }}
          className="bg-ig-blue text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-lg shadow-ig-blue/20 transition-all active:scale-90"
        >
          <Plus size={22} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar pb-24">
        {subFunds.length === 0 ? (
          <div className="p-20 text-center opacity-30 flex flex-col items-center">
            <Wallet size={48} className="mb-4" strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest">Belum ada input dana</p>
          </div>
        ) : (
          <div className="min-w-[1200px] p-4 text-left">
            <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm border border-border-ig">
              <thead>
                <tr className="bg-bg-alt text-[9px] font-bold text-ig-grey uppercase tracking-widest text-left">
                  <th className="p-3 border-b border-border-ig">NO NOTA</th>
                  <th className="p-3 border-b border-border-ig">TANGGAL</th>
                  <th className="p-3 border-b border-border-ig">ITEM PEMBELIAN</th>
                  <th className="p-3 border-b border-border-ig">KLASIFIKASI</th>
                  <th className="p-3 border-b border-border-ig">QTY</th>
                  <th className="p-3 border-b border-border-ig">SAT</th>
                  <th className="p-3 border-b border-border-ig">HARGA SATUAN</th>
                  <th className="p-3 border-b border-border-ig">TOTAL</th>
                  <th className="p-3 border-b border-border-ig">TOTAL NOTA</th>
                  <th className="p-3 border-b border-border-ig">AKSI</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-medium text-ig-black divide-y divide-gray-50 text-left">
                {subFunds.map((nota) => (
                  <React.Fragment key={nota.id}>
                    {(nota.items || []).map((item: any, idx: number) => (
                      <tr key={`${nota.id}-${idx}`} className="hover:bg-bg-alt/30 transition-colors">
                        {idx === 0 && (
                          <td rowSpan={nota.items.length} className="p-3 font-bold border-r border-border-ig bg-bg-alt/10 align-top">
                            {nota.notaNo}
                          </td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={nota.items.length} className="p-3 font-bold border-r border-border-ig align-top">
                            {nota.tanggal}
                          </td>
                        )}
                        <td className="p-3 max-w-[200px] truncate font-bold">{item.uraian}</td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-ig-black/5 text-[8px] font-black uppercase">
                            {item.klasifikasi || 'BAHAN'}
                          </span>
                        </td>
                        <td className="p-3">{item.jumlah}</td>
                        <td className="p-3">{item.satuan}</td>
                        <td className="p-3">{(item.hargaSatuan || 0).toLocaleString()}</td>
                        <td className="p-3 font-bold">{(item.hargaTotal || 0).toLocaleString()}</td>
                        {idx === 0 && (
                          <td rowSpan={nota.items.length} className="p-3 text-ig-blue font-black bg-ig-blue/5 text-sm border-l border-border-ig align-top">
                            {(nota.totalNota || 0).toLocaleString()}
                          </td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={nota.items.length} className="p-3 border-l border-border-ig align-top">
                            <button 
                              onClick={() => deleteFieldFundEntry(nota.id)}
                              className="p-1.5 text-red-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <FundEntryModal 
            subId={subId}
            onClose={() => setShowAdd(false)}
            onSubmit={(entry: any) => {
              addFieldFundEntry(entry);
              setShowAdd(false);
            }}
          />
        )}
      </AnimatePresence>
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
    <div className="flex-1 flex flex-col h-full bg-bg-alt overflow-hidden pt-4">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 text-left">
        <div className="grid grid-cols-3 gap-6">
          <button 
            onClick={() => setShowAddProfile(true)}
            className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-border-ig flex items-center justify-center text-ig-grey hover:text-ig-blue hover:border-ig-blue transition-all bg-white shadow-sm">
              <Plus size={32} />
            </div>
            <span className="text-[10px] font-bold text-ig-grey uppercase">Tambah</span>
          </button>
          
          {profiles.map((prof: any) => (
            <button
              key={prof.id}
              onClick={() => setActiveProfileId(prof.id)}
              className="flex flex-col items-center gap-3 relative group active:scale-95 transition-all"
            >
              <div className={`w-20 h-20 rounded-3xl p-1 border-2 transition-all overflow-hidden ${
                activeProfileId === prof.id ? 'border-ig-blue shadow-lg shadow-ig-blue/20 rotate-3' : 'border-white bg-white shadow-sm'
              }`}>
                <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-bg-alt">
                  {getProfileAvatar(prof)}
                </div>
              </div>
              <span className={`text-[11px] font-bold tracking-tight truncate w-24 text-center ${
                activeProfileId === prof.id ? 'text-ig-black' : 'text-ig-grey'
              }`}>{prof.name}</span>
              
              {activeProfileId === prof.id && (
                <div className="absolute top-0 right-0 -mr-1 -mt-1 w-6 h-6 bg-ig-blue text-white rounded-full flex items-center justify-center shadow-md animate-bounce">
                  <CheckCircle2 size={14} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        {activeProfileId && (
          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-border-ig flex items-center justify-center text-ig-grey">
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

function ProfileSelectionModal({ profiles, onSelect, onAdd, getProfileAvatar }: any) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="px-8 py-8 border-b border-border-ig bg-white text-center">
          <h2 className="text-2xl font-black tracking-tight mb-2">Renovki Konstruksi</h2>
          <p className="text-xs font-bold text-ig-grey uppercase tracking-widest">Pilih Lokasi Proyek</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {profiles.length === 0 ? (
            <div className="text-center py-8">
               <div className="w-20 h-20 rounded-full border border-border-ig flex items-center justify-center mx-auto mb-6 text-ig-grey opacity-40">
                  <MapPin size={32} />
               </div>
               <h3 className="text-base font-bold mb-2">Belum Ada Lokasi</h3>
               <p className="text-ig-grey text-xs mb-8">Tambahkan lokasi proyek pertama Anda untuk mulai mengelola</p>
               <button 
                onClick={onAdd}
                className="w-full bg-ig-blue text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-ig-blue/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
               >
                 <Plus size={20} strokeWidth={3} />
                 TAMBAH LOKASI
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {profiles.map((prof: any) => (
                <button
                  key={prof.id}
                  onClick={() => onSelect(prof.id)}
                  className="flex flex-col items-center gap-3 active:scale-95 transition-all text-center group"
                >
                  <div className="w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center bg-bg-alt border border-border-ig shadow-sm group-hover:ring-4 group-hover:ring-ig-blue/10 transition-all">
                    {getProfileAvatar(prof)}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest truncate w-full text-ig-black">{prof.name}</span>
                </button>
              ))}
              <button 
                onClick={onAdd}
                className="flex flex-col items-center gap-3 active:scale-95 transition-all group"
              >
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center border-2 border-dashed border-border-ig bg-transparent text-ig-grey hover:text-ig-blue hover:border-ig-blue/50 transition-all">
                  <Plus size={32} />
                </div>
                <span className="text-[11px] font-bold text-ig-grey uppercase tracking-widest">Baru</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-bg-alt/30 border-t border-border-ig text-center">
            <p className="text-[9px] font-bold text-ig-grey uppercase tracking-[0.2em]">Selamat Bekerja, Site Manager!</p>
        </div>
      </motion.div>
    </div>
  );
}

function FundEntryModal({ subId, onClose, onSubmit }: any) {
  const [notaParts, setNotaParts] = useState({
    series: '',
    input: '',
    number: ''
  });
  const [form, setForm] = useState({
    subId,
    tanggal: new Date().toISOString().split('T')[0],
    notaNo: '',
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
    (newItems[idx] as any)[field] = val;
    
    // Logic: Free to edit either but try to assist
    if (field === 'jumlah' || field === 'hargaSatuan') {
      const item = newItems[idx];
      if (item.jumlah && item.hargaSatuan) {
        item.hargaTotal = item.jumlah * item.hargaSatuan;
      }
    } else if (field === 'hargaTotal') {
      const item = newItems[idx];
      if (item.jumlah && item.hargaTotal) {
        item.hargaSatuan = item.hargaTotal / item.jumlah;
      }
    }

    const newTotal = newItems.reduce((acc, item) => acc + (item.hargaTotal || 0), 0);
    setForm({ ...form, items: newItems, totalNota: newTotal });
  };

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-base w-full max-w-2xl rounded-[32px] p-8 shadow-2xl relative border border-border-ig max-h-[90vh] overflow-y-auto custom-scrollbar text-left"
      >
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-bg-base z-10 pb-4">
          <div>
            <h3 className="text-base font-bold">Input Dana Lapangan (Nota)</h3>
            <p className="text-[10px] text-ig-grey font-bold uppercase tracking-widest mt-0.5">Satu nota untuk banyak item</p>
          </div>
          <button onClick={onClose} className="text-ig-grey"><X size={24} /></button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          const fullNota = `${notaParts.series}${notaParts.input}${notaParts.number}`.trim();
          onSubmit({ ...form, notaNo: fullNota || 'Tanpa Nomor' });
        }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-alt p-6 rounded-2xl border border-border-ig">
            <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-ig-grey uppercase tracking-widest ml-1 mb-2 block">No. Nota (Header)</label>
                 <div className="flex items-center gap-1">
                    <input 
                      type="text" 
                      className="w-16 bg-white border border-border-ig rounded-lg px-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                      value={notaParts.series}
                      onChange={e => setNotaParts({...notaParts, series: e.target.value})}
                      placeholder="Series"
                    />
                    <input 
                      type="text" 
                      className="flex-1 bg-white border border-border-ig rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                      value={notaParts.input}
                      onChange={e => setNotaParts({...notaParts, input: e.target.value})}
                      placeholder="Input"
                    />
                    <input 
                      type="text" 
                      className="w-20 bg-white border border-border-ig rounded-lg px-2 py-2 text-[10px] font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                      value={notaParts.number}
                      onChange={e => setNotaParts({...notaParts, number: e.target.value})}
                      placeholder="Nota"
                    />
                 </div>
               </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ig-grey uppercase tracking-widest ml-1 mb-2 block">Tanggal</label>
              <input 
                required
                type="date" 
                className="w-full bg-white border border-border-ig rounded-xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                value={form.tanggal}
                onChange={e => setForm({...form, tanggal: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-ig-blue uppercase tracking-widest">Daftar Item Pembelian</p>
              <button 
                type="button"
                onClick={addItem}
                className="text-[10px] font-bold text-ig-blue uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                <Plus size={14} /> Tambah Item
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="p-4 bg-white border border-border-ig rounded-2xl relative group">
                  {form.items.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-6 gap-3 mb-3">
                    <div className="col-span-3 space-y-1">
                      <label className="text-[9px] font-bold text-ig-grey uppercase">Uraian</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-bg-alt px-3 py-2 rounded-lg text-xs font-bold outline-none" 
                        value={item.uraian}
                        onChange={e => updateItem(idx, 'uraian', e.target.value)}
                        placeholder="Contoh: Semen Gresik"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <label className="text-[9px] font-bold text-ig-grey uppercase">Klasifikasi</label>
                      <select 
                        className="w-full bg-bg-alt px-3 py-2 rounded-lg text-xs font-bold outline-none appearance-none"
                        value={item.klasifikasi}
                        onChange={e => updateItem(idx, 'klasifikasi', e.target.value)}
                      >
                        <option value="BAHAN">BAHAN</option>
                        <option value="ALAT">ALAT</option>
                        <option value="JASA">JASA</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-ig-grey uppercase">Jumlah</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-bg-alt px-3 py-2 rounded-lg text-xs font-bold outline-none" 
                        value={item.jumlah}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          updateItem(idx, 'jumlah', val);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-ig-grey uppercase">Satuan</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-bg-alt px-3 py-2 rounded-lg text-xs font-bold outline-none" 
                        value={item.satuan}
                        onChange={e => updateItem(idx, 'satuan', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-ig-grey uppercase">Harga Satuan</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-bg-alt px-3 py-2 rounded-lg text-xs font-bold outline-none" 
                        value={item.hargaSatuan}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          updateItem(idx, 'hargaSatuan', val);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-ig-grey uppercase text-ig-blue">Harga Total</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-bg-alt px-3 py-2 rounded-lg text-xs font-black outline-none border border-ig-blue/30 text-ig-blue" 
                        value={item.hargaTotal}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          updateItem(idx, 'hargaTotal', val);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border-ig flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-ig-grey uppercase tracking-widest">Total Keseluruhan Nota</p>
              <h4 className="text-xl font-black text-ig-blue">Rp {form.totalNota.toLocaleString()}</h4>
            </div>
            <button 
              type="submit"
              className="bg-ig-blue text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-ig-blue/20 transition-all active:scale-95"
            >
              Simpan Nota
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
