import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Plus, Package, MapPin, X, AlertTriangle, HardHat, FileSpreadsheet, CheckCircle2, Trash2, Edit2, Camera, UserCircle, History, BarChart3, Box, Clock, Target, PlusSquare, RefreshCw } from 'lucide-react';
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
  
  const [activeProfileId, setActiveProfileId] = useState<string | null>(profiles?.[0]?.id || null);
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

  React.useEffect(() => {
    if (activeProfileId && !profiles.find(p => p.id === activeProfileId)) {
      setActiveProfileId(profiles?.[0]?.id || null);
      setActiveSubId(null);
    } else if (!activeProfileId && profiles.length > 0) {
      setActiveProfileId(profiles?.[0]?.id || null);
    }
  }, [profiles, activeProfileId]);

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
      {/* Sidebar Profiles (Stories) */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-4 border-b border-border-ig overflow-x-auto custom-scrollbar bg-bg-base sticky top-0 z-20">
        <button 
          onClick={() => setShowAddProfile(true)}
          className="shrink-0 w-14 h-14 rounded-full border-2 border-dashed border-border-ig flex items-center justify-center text-ig-grey hover:text-ig-blue hover:border-ig-blue transition-all"
        >
          <Plus size={24} />
        </button>
        
        {profiles.map(prof => (
          <button
            key={prof.id}
            onClick={() => {
              setActiveProfileId(prof.id);
              setActiveSubId(null); // Reset sub selection when profile changes
            }}
            className="shrink-0 flex flex-col items-center gap-1 group"
          >
            <div className={`w-16 h-16 rounded-full p-0.5 border-2 transition-all ${
              activeProfileId === prof.id ? 'border-ig-blue' : 'border-transparent'
            }`}>
              <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-all ${
                activeProfileId === prof.id ? 'bg-ig-blue text-white' : 'bg-bg-alt text-ig-grey border border-border-ig'
              }`}>
                {getProfileAvatar(prof)}
              </div>
            </div>
            <span className={`text-[10px] font-semibold tracking-tight truncate w-16 text-center ${
              activeProfileId === prof.id ? 'text-ig-black' : 'text-ig-grey'
            }`}>{prof.name}</span>
          </button>
        ))}
      </div>

      <section className="flex-1 flex flex-col overflow-hidden bg-bg-alt">
        {activeProfile ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* iOS Style Segmented Control for Subs */}
            <div className="px-4 py-3 bg-bg-base border-b border-border-ig overflow-x-auto">
              <div className="flex bg-bg-alt p-1 rounded-xl gap-1">
                {profileSubs.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubId(sub.id)}
                    className={`shrink-0 px-5 py-2 text-xs font-bold rounded-lg transition-all ${
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
                  className="px-3 py-2 text-ig-grey hover:text-ig-blue transition-colors flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="bg-bg-base border-b border-border-ig px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setShowEditProfile(true)}
                    className="relative group w-10 h-10 rounded-full bg-bg-alt flex items-center justify-center border border-border-ig overflow-hidden shrink-0 cursor-pointer"
                  >
                    {getProfileAvatar(activeProfile)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">{activeProfile.name}</h2>
                    <p className="text-[10px] text-ig-grey font-medium uppercase tracking-widest leading-none">
                      {profileSubs.find(s => s.id === activeSubId)?.name || 'Pilih Sub'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Budget RAP - Simbol Sheet Saja */}
                   <button 
                    onClick={() => setView('rap')}
                    className="p-2.5 text-ig-blue hover:bg-ig-blue/5 rounded-full transition-colors flex items-center justify-center"
                    title="Budget RAP"
                   >
                      <FileSpreadsheet size={24} strokeWidth={1.5} />
                   </button>
 
                   <div className="flex items-center gap-3 ml-1">
                      {/* Request Material General */}
                      <button 
                        onClick={() => activeSubId && setShowAddForm(true)}
                        disabled={!activeSubId}
                        className={`transition-colors p-1 ${!activeSubId ? 'opacity-20 cursor-not-allowed' : 'text-ig-black hover:text-ig-blue'}`}
                        title="Request Material"
                      >
                        <PlusSquare size={26} />
                      </button>
 
                      {/* Request Material Utama */}
                      <button 
                        onClick={() => activeSubId && setShowMainRequestForm(true)}
                        disabled={!activeSubId}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm ${!activeSubId ? 'bg-ig-grey/20 cursor-not-allowed' : 'bg-ig-blue text-white hover:bg-ig-blue/90 shadow-ig-blue/20 shadow-md active:scale-95'}`}
                        title="Request Utama"
                      >
                        <Plus size={22} strokeWidth={3} />
                      </button>
                   </div>
                </div>
              </div>

              {/* Segmented Control - Glass Style */}
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

              <div className="px-4 pb-20 space-y-4">
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
                        <motion.div 
                          key={req.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="ig-card overflow-hidden group"
                        >
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
                                <button 
                                  onClick={() => setReceivingRequest(req)}
                                  className="flex-1 bg-ig-blue text-white py-2 rounded-md font-bold text-[13px] hover:opacity-90 transition-opacity"
                                >
                                  Selesaikan Penerimaan
                                </button>
                              )}
                              <button 
                                onClick={() => setEditingRequest(req)}
                                className="p-2 rounded-md border border-border-ig text-ig-grey hover:bg-bg-alt transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}

                    {onHoldRequests.length > 0 && (
                      <div className="mt-8 space-y-4">
                        <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest px-1">Hold / Indent ({onHoldRequests.length})</h3>
                        {onHoldRequests.map(req => (
                          <motion.div 
                            key={req.id}
                            className="ig-card overflow-hidden opacity-80"
                          >
                            <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                              <span className="font-bold text-sm tracking-tight">{req.materialName}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] border border-orange-200 bg-white text-orange-500 font-bold uppercase">Hold / Indent</span>
                            </div>
                            <div className="p-4">
                              <div className="flex items-baseline justify-between">
                                <span className="text-xl font-bold">{req.quantity} {req.unit}</span>
                                <button 
                                  onClick={() => setEditingRequest(req)}
                                  className="p-1.5 rounded-md border border-border-ig text-ig-grey hover:bg-bg-alt transition-colors"
                                >
                                  <Edit2 size={14} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
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
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                              <CheckCircle2 size={20} />
                            </div>
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
                                <p className="text-xl font-black italic tracking-tighter leading-none text-ig-blue">
                                   {item.quantity}
                                </p>
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
                          <motion.button 
                            layout
                            key={entry.id} 
                            onClick={() => {
                              setSelectedStock(entry);
                              setEditQuantity(entry.quantity.toString());
                            }}
                            className="ig-card p-4 flex flex-col gap-1 transition-all hover:ring-2 hover:ring-ig-blue active:scale-95"
                          >
                            <span className="text-[9px] font-bold text-ig-grey uppercase tracking-widest">{entry.materialName}</span>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-2xl font-black italic tracking-tighter text-ig-black">{entry.quantity}</span>
                              <span className="text-[10px] font-bold uppercase text-ig-grey">{entry.unit}</span>
                            </div>
                            <div className="mt-2 text-[8px] text-ig-grey uppercase font-bold flex items-center gap-1 opacity-60">
                              <RefreshCw size={8} /> {new Date(entry.dateReceived).toLocaleDateString('id-ID')}
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
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
             <div className="w-24 h-24 rounded-full border border-border-ig flex items-center justify-center mb-6 text-ig-grey">
                <MapPin size={48} strokeWidth={1} />
             </div>
             <h3 className="text-lg font-bold mb-1">Pilih Lokasi</h3>
             <p className="text-ig-grey text-sm">Pilih lokasi proyek untuk mengelola stok dan permintaan</p>
          </div>
        )}
      </section>

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
          <button onClick={onClose} className="text-ig-grey">
            <X size={24} />
          </button>
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
