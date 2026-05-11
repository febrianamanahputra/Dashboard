import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { Truck, Package, Clock, CheckCircle2, CreditCard, ChevronRight, Pause, Play, X, Send, History, Check, AlertTriangle, Trash2, Plus, RefreshCw, FileSpreadsheet, Wallet } from 'lucide-react';
import { RequestStatus, MaterialRequest } from '../../types';

export default function SCMDashboard() {
  const { 
    profiles = [],
    subs = [], 
    requests = [], 
    updateRequestStatus, 
    approveEdit, 
    rejectEdit, 
    deleteRequest, 
    mainMaterials = [], 
    addMainMaterial, 
    deleteMainMaterial,
    syncDirectToSheet
  } = useApp();
  const [showPaymentModal, setShowPaymentModal] = useState<MaterialRequest | null>(null);
  const [showMainMaterialModal, setShowMainMaterialModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

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
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'processing': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'awaiting_payment': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'paid': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'received': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'on_hold': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-ig-black border-border-ig';
    }
  };

  const getRequestTheme = (s: string) => {
    switch (s) {
      case 'pending': 
        return {
          bg: 'bg-gradient-to-br from-[#FFD700] to-[#FDB931]',
          text: 'text-white',
          badge: 'bg-white/20 text-white border-white/30',
          watermark: <Clock size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
        };
      case 'processing':
        return {
          bg: 'bg-gradient-to-br from-[#FF8C00] to-[#FF4500]',
          text: 'text-white',
          badge: 'bg-white/20 text-white border-white/30',
          watermark: <RefreshCw size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
        };
      case 'awaiting_payment':
        return {
          bg: 'bg-gradient-to-br from-[#2E0854] to-[#4B0082]',
          text: 'text-white',
          badge: 'bg-white/20 text-white border-white/30',
          watermark: <Wallet size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
        };
      case 'paid':
        return {
          bg: 'bg-gradient-to-br from-[#8A2BE2] to-[#B06AB3]',
          text: 'text-white',
          badge: 'bg-white/20 text-white border-white/30',
          watermark: <CheckCircle2 size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
        };
      case 'delivered':
        return {
          bg: 'bg-gradient-to-br from-[#25D366] to-[#128C7E]',
          text: 'text-white',
          badge: 'bg-white/20 text-white border-white/30',
          watermark: <Truck size={80} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
        };
      default:
        return {
          bg: 'bg-white',
          text: 'text-ig-black',
          badge: 'bg-gray-100 text-gray-600 border-gray-200',
          watermark: <Package size={80} className="absolute -right-4 -bottom-4 text-black/5 rotate-12" />
        };
    }
  };

  const relevantRequests = requests.filter(r => r.status !== 'received');

  const subsWithRequests = subs.map(sub => ({
    ...sub,
    requests: relevantRequests.filter(r => r.subId === sub.id)
  })).filter(sub => sub.requests.length > 0);

  // History extraction per sub
  const historyBySub = subs.map(sub => {
    const receivedReqs = requests
      .filter(r => r.subId === sub.id && r.status === 'received')
      .map(r => {
        const receivedEntry = r.history.find(h => h.status === 'received');
        return {
          ...r,
          receivedAt: receivedEntry?.timestamp || 0
        };
      })
      .sort((a, b) => b.receivedAt - a.receivedAt);
    
    return { ...sub, history: receivedReqs };
  }).filter(sub => sub.history.length > 0);

  const orphanedRequests = relevantRequests.filter(r => !subs.some(s => s.id === r.subId));

  return (
    <div className="relative h-full flex flex-col bg-bg-base pt-[env(safe-area-inset-top)]">
      <div className="relative z-10 flex flex-col h-full bg-bg-alt overflow-hidden">
        <header className="flex flex-col px-4 py-4 bg-bg-base border-b border-border-ig shrink-0 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-bg-alt border border-border-ig flex items-center justify-center">
                 <Truck size={20} className="text-ig-black" strokeWidth={2.5} />
              </div>
              <div>
                 <h2 className="text-base font-black tracking-tight leading-none mb-1">Divisi SCM</h2>
                 <p className="text-ig-grey text-[9px] font-black uppercase tracking-[0.15em]">Kontrol Suplai</p>
              </div>
            </div>
            
            <div className="flex bg-bg-alt p-1 rounded-xl border border-border-ig">
               <button 
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tighter transition-all ${activeTab === 'active' ? 'bg-white shadow-sm text-ig-blue overflow-hidden' : 'text-ig-grey'}`}
               >
                 Aktif
               </button>
               <button 
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tighter transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-ig-blue overflow-hidden' : 'text-ig-grey'}`}
               >
                 Riwayat
               </button>
               <button 
                onClick={() => setShowMainMaterialModal(true)}
                className="ml-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter text-green-600 bg-green-50 border border-green-100 hover:bg-green-100 transition-all flex items-center gap-1.5"
               >
                 <Plus size={14} strokeWidth={3} />
                 Material
               </button>
            </div>
          </div>
          
          {activeTab === 'active' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white border border-border-ig rounded-2xl px-4 py-2.5 flex items-center justify-between">
                 <p className="text-[9px] font-black text-ig-grey uppercase tracking-widest">Antrian</p>
                 <p className="text-sm font-black italic">{relevantRequests.length}</p>
              </div>

              <div className="flex-1 bg-white border border-ig-blue/20 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                 <p className="text-[9px] font-black text-ig-blue uppercase tracking-widest">Menunggu</p>
                 <p className="text-sm font-black italic">{relevantRequests.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          )}
        </header>

        {activeTab === 'active' ? (
          subsWithRequests.length === 0 && orphanedRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 rounded-full border border-border-ig flex items-center justify-center mb-6 opacity-30">
                 <Truck size={48} strokeWidth={1} />
              </div>
              <h3 className="text-lg font-bold mb-1">Armada Stand By</h3>
              <p className="text-ig-grey text-sm">Tidak ada protokol logistik aktif terdeteksi</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-20 px-4 space-y-8">
              <div className="space-y-6">
                {subsWithRequests.map((sub, idx) => {
                  const profile = profiles.find(p => p.id === sub.profileId);
                  return (
                    <motion.div 
                      key={sub.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-ig-blue" />
                          <h3 className="text-sm font-bold tracking-tight">
                            {profile?.name} - {sub.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-ig-grey uppercase">{sub.requests.length} Request</span>
                      </div>

                      <div className="space-y-4">
                        {sub.requests.map((req) => (
                          <RequestItem 
                            key={req.id} 
                            request={req} 
                            onStatusUpdate={updateRequestStatus} 
                            onApproveEdit={approveEdit} 
                            onRejectEdit={rejectEdit} 
                            onRequestPayment={setShowPaymentModal} 
                            locationName={`${profile?.name} - ${sub.name}`}
                            theme={getRequestTheme(req.status)}
                            statusLabel={getStatusLabel(req.status)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {orphanedRequests.length > 0 && (
                <div className="pt-10 border-t border-border-ig">
                  <h3 className="text-xs font-bold text-ig-grey uppercase tracking-widest mb-6 px-2 text-red-500">Vektor Tak Terpeta (Lokasi Terhapus)</h3>
                  <div className="space-y-4">
                    {orphanedRequests.map(req => (
                      <RequestItem 
                        key={req.id}
                        request={req} 
                        onStatusUpdate={updateRequestStatus} 
                        onApproveEdit={approveEdit}
                        onRejectEdit={rejectEdit}
                        onRequestPayment={setShowPaymentModal}
                        onDelete={(id) => {
                          if (confirm('Hapus permintaan yang tidak memiliki lokasi ini?')) {
                            deleteRequest(id);
                          }
                        }}
                        locationName="Domain Kosong"
                        theme={getRequestTheme(req.status)}
                        statusLabel={getStatusLabel(req.status)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* History View */
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-20 px-4 space-y-8">
            {historyBySub.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-40">
                <History size={48} />
                <p className="mt-4 font-bold text-xs uppercase tracking-widest">Belum Ada Riwayat</p>
              </div>
            ) : (
              historyBySub.map(sub => {
                const profile = profiles.find(p => p.id === sub.profileId);
                const fullName = `${profile?.name} - ${sub.name}`;
                return (
                  <div key={sub.id} className="space-y-4">
                     <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <h3 className="text-sm font-bold tracking-tight">{fullName}</h3>
                      </div>
                      <div className="bg-white border border-border-ig rounded-2xl divide-y divide-gray-50 overflow-hidden shadow-sm">
                          {sub.history.map((item) => (
                            <div key={item.id} className="p-3 flex items-center justify-between active:bg-bg-alt transition-colors">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                                     <Package size={14} />
                                  </div>
                                  <div>
                                     <p className="text-xs font-black tracking-tight leading-tight">{item.materialName}</p>
                                     <p className="text-[9px] text-ig-grey font-bold uppercase tracking-tighter mt-0.5">
                                        {new Date((item as any).receivedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                     </p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      syncDirectToSheet(item, fullName);
                                      alert(`Sinkronisasi "${item.materialName}" dikirim ke Spreadsheet!`);
                                    }}
                                    className="p-2 rounded-xl bg-bg-alt text-ig-grey hover:text-ig-blue transition-colors"
                                  >
                                     <RefreshCw size={12} />
                                  </button>
                                  <div className="text-right">
                                     <p className="text-sm font-black italic text-ig-black leading-none">
                                        {item.quantity} 
                                     </p>
                                     <span className="text-[9px] text-ig-grey uppercase font-black">{item.unit}</span>
                                  </div>
                               </div>
                            </div>
                          ))}
                      </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMainMaterialModal && (
          <MainMaterialModal 
            materials={mainMaterials}
            onAdd={addMainMaterial}
            onDelete={deleteMainMaterial}
            onClose={() => setShowMainMaterialModal(false)}
          />
        )}
        {showPaymentModal && (
          <PaymentModal 
            request={showPaymentModal} 
            locationName={subs.find(s => s.id === showPaymentModal.subId)?.name || ''}
            onClose={() => setShowPaymentModal(null)}
            onConfirm={(requestId) => {
              updateRequestStatus(requestId, 'awaiting_payment');
              setShowPaymentModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MainMaterialModal({ materials, onAdd, onDelete, onClose }: { 
  materials: any[]; 
  onAdd: (n: string, u: string) => void; 
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('zak');
  const UNITS = ['zak', 'ret', 'dus', 'Pcs', 'galon', 'm2', 'm3', 'Liter', 'Roll', 'Lembar', 'Kaleng', 'Dll'];

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 text-ig-black">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-6 shadow-2xl relative border border-border-ig flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold">Daftar Material Utama</h3>
          <button onClick={onClose} className="text-ig-grey">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
           <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                 <input 
                  type="text" 
                  placeholder="Nama Material"
                  className="w-full bg-bg-alt border border-border-ig rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && name.trim()) {
                      onAdd(name, unit);
                      setName('');
                    }
                  }}
                 />
              </div>
              <div className="w-24 space-y-1">
                 <select 
                  className="w-full bg-bg-alt border border-border-ig rounded-md px-2 py-2 text-xs font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                 >
                    {UNITS.map(u => <option key={u} value={u.toLowerCase()}>{u.toUpperCase()}</option>)}
                 </select>
              </div>
              <button 
                disabled={!name}
                onClick={() => {
                  onAdd(name, unit);
                  setName('');
                }}
                className="bg-ig-blue text-white px-3 py-2 rounded-md font-bold text-xs disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar border-t border-border-ig pt-4 space-y-2">
           {materials.length === 0 ? (
             <p className="text-center text-[10px] text-ig-grey italic py-8">Belum ada material utama.</p>
           ) : (
             materials.map(m => (
               <div key={m.id} className="flex items-center justify-between p-3 bg-bg-alt rounded-lg border border-border-ig">
                  <div>
                     <p className="text-xs font-bold uppercase">{m.name}</p>
                     <p className="text-[10px] text-ig-grey font-medium uppercase tracking-widest">{m.unit}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Hapus material "${m.name}"?`)) {
                        onDelete(m.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors p-2"
                  >
                     <Trash2 size={16} />
                  </button>
               </div>
             ))
           )}
        </div>
      </motion.div>
    </div>
  );
}

const RequestItem: React.FC<{ 
  request: MaterialRequest; 
  onStatusUpdate: (id: string, s: RequestStatus) => void;
  onApproveEdit: (id: string) => void;
  onRejectEdit: (id: string) => void;
  onRequestPayment: (req: MaterialRequest) => void;
  onDelete?: (id: string) => void;
  locationName: string;
  theme: any;
  statusLabel: string;
}> = ({ 
  request, 
  onStatusUpdate, 
  onApproveEdit,
  onRejectEdit,
  onRequestPayment,
  onDelete,
  locationName,
  theme,
  statusLabel
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'text-ig-grey';
      case 'processing': return 'text-amber-500';
      case 'awaiting_payment': return 'text-ig-blue font-bold';
      case 'paid': return 'text-green-600 font-bold';
      case 'delivered': return 'text-ig-blue font-bold italic';
      case 'on_hold': return 'text-red-500';
      default: return 'text-ig-grey';
    }
  };

  const currentStatusIndex = request.history.length - 1;
  const currentStatusStartTime = request.history[currentStatusIndex].timestamp;

  const getResumeStatus = (): RequestStatus => {
    if (request.history.length < 2) return 'pending';
    for (let i = request.history.length - 2; i >= 0; i--) {
      if (request.history[i].status !== 'on_hold') return request.history[i].status;
    }
    return 'pending';
  };

  return (
    <div className={`border border-white/10 rounded-2xl shadow-md transition-all relative overflow-hidden ${theme.bg} mb-2`}>
      {theme.watermark}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-sm ${theme.text}`}>
            {request.status === 'delivered' ? <Truck size={18} /> : 
             request.status === 'processing' ? <RefreshCw size={18} /> :
             request.status === 'awaiting_payment' ? <Wallet size={18} /> :
             request.status === 'paid' ? <CheckCircle2 size={18} /> :
             <Package size={18} />}
          </div>
          <div>
            <p className={`text-sm font-black tracking-tight ${theme.text}`}>{request.materialName}</p>
            <StatusTimer status={request.status} startTime={currentStatusStartTime} theme={theme} statusLabel={statusLabel} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {request.pendingEdit && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_white] animate-pulse" />}
          <div className={`transition-transform ${theme.text} opacity-60 ${isExpanded ? 'rotate-90' : ''}`}>
             <ChevronRight size={18} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 space-y-4 relative z-10"
          >
            {request.pendingEdit && (
              <div className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white">
                  <AlertTriangle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Ada Revisi Dari Site Manager</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                   <div className="text-[9px] text-white/70 font-bold uppercase">Nama: <span className="font-black text-white">{request.pendingEdit.materialName}</span></div>
                   <div className="text-[9px] text-white/70 font-bold uppercase">Jumlah: <span className="font-black text-white">{request.pendingEdit.quantity} {request.pendingEdit.unit}</span></div>
                   <div className="text-[9px] text-white/70 font-bold uppercase">Deadline: <span className="font-black text-white">{new Date(request.pendingEdit.dateNeeded).toLocaleDateString()}</span></div>
                </div>
                <div className="flex gap-2 pt-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); onApproveEdit(request.id); }}
                    className="flex-1 bg-white text-ig-black py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
                   >
                     SETUJUI REVISI
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onRejectEdit(request.id); }}
                    className="flex-1 bg-white/10 text-white border border-white/30 py-2.5 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all"
                   >
                     TOLAK
                   </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="space-y-1">
                <p className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-70`}>Volume</p>
                <p className={`text-sm font-black italic ${theme.text}`}>{request.quantity} {request.unit.toUpperCase()}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className={`text-[9px] font-black uppercase tracking-widest ${theme.text} opacity-70`}>Batas Waktu</p>
                <p className={`text-sm font-black ${theme.text}`}>{new Date(request.dateNeeded).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2">
                {request.status === 'pending' && (
                  <ActionButton 
                    label="PROSES SEKARANG" 
                    icon={<Play size={14} fill="currentColor" />} 
                    onClick={() => onStatusUpdate(request.id, 'processing')}
                    className="flex-1 bg-white text-amber-500 shadow-xl" 
                  />
                )}
                {request.status === 'processing' && (
                  <ActionButton 
                    label="AJUKAN PEMBAYARAN" 
                    icon={<Send size={14} />} 
                    onClick={() => onRequestPayment(request)}
                    className="flex-1 bg-white text-orange-600 shadow-xl" 
                  />
                )}
                {request.status === 'paid' && (
                  <ActionButton 
                    label="PENGIRIMAN BARANG" 
                    icon={<Truck size={16} />} 
                    onClick={() => onStatusUpdate(request.id, 'delivered')}
                    className="flex-1 bg-white text-indigo-600 shadow-xl" 
                  />
                )}
                {request.status === 'delivered' && (
                    <div className="flex-1 h-12 flex items-center justify-center gap-2 text-[11px] font-black text-white bg-white/10 border border-white/30 rounded-xl italic">
                        <Truck size={14} /> DALAM PERJALANAN...
                    </div>
                )}
                {request.status === 'awaiting_payment' && (
                    <div className="flex-1 h-12 flex items-center justify-center gap-2 text-[11px] font-black text-white bg-white/10 border border-white/30 rounded-xl italic">
                        <Wallet size={14} /> MENUNGGU ADMIN FINANCE
                    </div>
                )}

                {['pending', 'processing', 'awaiting_payment', 'paid'].includes(request.status) ? (
                  <ActionButton 
                    label="HOLD" 
                    icon={<Pause size={14} />} 
                    onClick={() => onStatusUpdate(request.id, 'on_hold')}
                    className="bg-white/10 text-white w-20 border border-white/30" 
                  />
                ) : request.status === 'on_hold' ? (
                  <ActionButton 
                    label="LANJUTKAN PROSES" 
                    icon={<Play size={14} fill="currentColor" />} 
                    onClick={() => onStatusUpdate(request.id, getResumeStatus())}
                    className="flex-1 bg-white text-red-500 shadow-xl" 
                  />
                ) : null}
                
                {onDelete && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(request.id); }}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 text-white border border-white/30 rounded-xl active:scale-95 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function PaymentModal({ request, locationName, onClose, onConfirm }: { 
  request: MaterialRequest; 
  locationName: string;
  onClose: () => void; 
  onConfirm: (id: string) => void;
}) {

  const [form, setForm] = useState({
    location: locationName,
    accountName: '',
    accountNumber: '',
    bank: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `Lokasi : ${form.location}\nNama : ${form.accountName}\nNo Rekening : ${form.accountNumber}\nBank : ${form.bank}\n\nBismillah Saya Telah Mengorder *${request.materialName}* Mohon Lakukan Pembayaran Bu Terima Kasih`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    onConfirm(request.id);
  };

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-6 shadow-2xl relative border border-border-ig"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-bold">Pengajuan Pembayaran</h3>
          <button onClick={onClose} className="text-ig-grey">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Lokasi</label>
            <input 
              readOnly
              type="text" 
              className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-2.5 text-sm font-bold text-ig-grey"
              value={form.location}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Atas Nama Rekening</label>
            <input 
              required
              type="text" 
              placeholder="e.g. PT. Logistics Jaya"
              className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-2.5 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none placeholder:text-gray-400"
              value={form.accountName}
              onChange={e => setForm({...form, accountName: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Nomor Rekening</label>
            <input 
              required
              type="text" 
              placeholder="000-000-000"
              className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-2.5 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none placeholder:text-gray-400"
              value={form.accountNumber}
              onChange={e => setForm({...form, accountNumber: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Nama Bank</label>
            <input 
              required
              type="text" 
              placeholder="e.g. BCA"
              className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-2.5 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none placeholder:text-gray-400"
              value={form.bank}
              onChange={e => setForm({...form, bank: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full mt-4 bg-green-500 text-white py-3 rounded-md font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
          >
            <Send size={16} />
            Kirim ke WhatsApp
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function StatusTimer({ status, startTime, theme, statusLabel }: { status: RequestStatus, startTime: number, theme: any, statusLabel: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === 'on_hold') return; 

    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, status]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 mt-0.5">
      <span className={`text-[9px] font-black uppercase tracking-widest ${theme.text}`}>
        {statusLabel}
      </span>
      <span className={`${theme.text} opacity-30 text-[8px]`}>|</span>
      <span className={`text-[10px] font-bold tracking-tight ${theme.text} opacity-80`}>
        {status === 'on_hold' ? 'TERKUNCI' : formatTime(elapsed)}
      </span>
    </div>
  );
}

function ActionButton({ label, icon, onClick, className }: { label: string, icon: React.ReactNode, onClick: () => void, className: string }) {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
