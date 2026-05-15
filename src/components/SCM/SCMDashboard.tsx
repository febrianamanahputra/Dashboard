import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { Truck, Package, Clock, CheckCircle2, CreditCard, ChevronRight, Pause, Play, X, Send, History, Check, AlertTriangle, Trash2, Plus, RefreshCw, FileSpreadsheet, Wallet } from 'lucide-react';
import { RequestStatus, MaterialRequest } from '../../types';

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
  
  requestAnimationFrame(() => {
    if (e.target) {
      e.target.setSelectionRange(selectionStart, selectionEnd);
    }
  });
};

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
  const [viewingHistorySubId, setViewingHistorySubId] = useState<string | null>(null);

  useEffect(() => {
    const hasOpenModal = !!(showPaymentModal || showMainMaterialModal);

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && !e.state.isSubNav && e.state.role === null) return;

      if (showPaymentModal) {
        setShowPaymentModal(null);
      } else if (showMainMaterialModal) {
        setShowMainMaterialModal(false);
      } else if (viewingHistorySubId) {
        setViewingHistorySubId(null);
      } else if (activeTab !== 'active') {
        setActiveTab('active');
      }
    };

    if (hasOpenModal || activeTab !== 'active' || viewingHistorySubId) {
      window.history.pushState({ role: 'SCM', isSubNav: true }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showPaymentModal, showMainMaterialModal, activeTab, viewingHistorySubId]);

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
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'processing': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'awaiting_payment': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'paid': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'received': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'on_hold': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/5 text-white border-white/10';
    }
  };

  const getRequestTheme = (s: string) => {
    switch (s) {
      case 'pending': 
        return {
          bg: 'bg-white/5 backdrop-blur-md border border-white/10',
          text: 'text-white',
          badge: 'bg-white/5 text-white border-white/10',
          watermark: <Clock size={80} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
        };
      case 'processing':
        return {
          bg: 'bg-gradient-to-br from-[#FF8C00]/20 to-[#FF4500]/20 backdrop-blur-md border border-orange-500/20',
          text: 'text-orange-100',
          badge: 'bg-orange-500/20 text-orange-200 border-orange-500/30',
          watermark: <RefreshCw size={80} className="absolute -right-4 -bottom-4 text-orange-500/10 rotate-12" />
        };
      case 'awaiting_payment':
        return {
          bg: 'bg-gradient-to-br from-[#2E0854]/20 to-[#4B0082]/20 backdrop-blur-md border border-purple-500/20',
          text: 'text-purple-100',
          badge: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
          watermark: <Wallet size={80} className="absolute -right-4 -bottom-4 text-purple-500/10 rotate-12" />
        };
      case 'paid':
        return {
          bg: 'bg-gradient-to-br from-[#8A2BE2]/20 to-[#B06AB3]/20 backdrop-blur-md border border-indigo-500/20',
          text: 'text-indigo-100',
          badge: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
          watermark: <CheckCircle2 size={80} className="absolute -right-4 -bottom-4 text-indigo-500/10 rotate-12" />
        };
      case 'delivered':
        return {
          bg: 'bg-gradient-to-br from-[#25D366]/20 to-[#128C7E]/20 backdrop-blur-md border border-green-500/20',
          text: 'text-green-100',
          badge: 'bg-green-500/20 text-green-200 border-green-500/30',
          watermark: <Truck size={80} className="absolute -right-4 -bottom-4 text-green-500/10 rotate-12" />
        };
      default:
        return {
          bg: 'bg-white/5 backdrop-blur-md border border-white/10',
          text: 'text-white',
          badge: 'bg-white/5 text-white border-white/10',
          watermark: <Package size={80} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
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
    <div className="relative h-full flex flex-col pt-[env(safe-area-inset-top)]">
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <header className="flex flex-col px-4 py-4 bg-black/40 backdrop-blur-md border-b border-white/10 shrink-0 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                 <Truck size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                 <h2 className="text-base font-black tracking-tight leading-none mb-1 text-white">Divisi SCM</h2>
                 <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.15em]">Kontrol Suplai</p>
              </div>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
               <button 
                onClick={() => { setActiveTab('active'); setViewingHistorySubId(null); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tighter transition-all ${activeTab === 'active' ? 'bg-white shadow-lg text-black' : 'text-white/40'}`}
               >
                 Aktif
               </button>
               <button 
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tighter transition-all ${activeTab === 'history' ? 'bg-white shadow-lg text-black' : 'text-white/40'}`}
               >
                 Riwayat
               </button>
               <button 
                onClick={() => setShowMainMaterialModal(true)}
                className="ml-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter text-white bg-green-600 shadow-lg hover:bg-green-700 transition-all flex items-center gap-1.5"
               >
                 <Plus size={14} strokeWidth={3} />
                 Material
               </button>
            </div>
          </div>
          
          {activeTab === 'active' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                 <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Antrian</p>
                 <p className="text-sm font-black italic text-white">{relevantRequests.length}</p>
              </div>

              <div className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                 <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Menunggu</p>
                 <p className="text-sm font-black italic text-white">{relevantRequests.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          )}
        </header>

        {activeTab === 'active' ? (
          subsWithRequests.length === 0 && orphanedRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
              <div className="w-24 h-24 rounded-full border border-black/20 flex items-center justify-center mb-6">
                 <Truck size={48} strokeWidth={1} className="text-black" />
              </div>
              <h3 className="text-lg font-black text-black mb-1 uppercase tracking-tight">Armada Stand By</h3>
              <p className="text-black/40 text-xs font-black uppercase tracking-widest">Tidak ada protokol logistik aktif terdeteksi</p>
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
                          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                          <h3 className="text-sm font-black tracking-tight text-white uppercase">
                            {profile?.name} - {sub.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{sub.requests.length} Request</span>
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
          /* History View - Modified to drill-down by location */
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-20 px-4">
            {!viewingHistorySubId ? (
              /* Location List View */
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2 mb-4">Pilih Lokasi Riwayat</h3>
                {historyBySub.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-20 opacity-40">
                    <History size={48} className="text-white" />
                    <p className="mt-4 font-black text-[10px] uppercase tracking-widest text-white">Belum Ada Riwayat Terdeteksi</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {historyBySub.map((sub) => {
                      const profile = profiles.find(p => p.id === sub.profileId);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setViewingHistorySubId(sub.id)}
                          className="bg-white/5 backdrop-blur-md border border-white/10 p-5 flex items-center justify-between rounded-3xl hover:bg-white/10 transition-all active:scale-[0.98] group shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all border border-white/10">
                              <Package size={24} />
                            </div>
                            <div className="text-left">
                              <h4 className="text-sm font-black text-white italic tracking-tight uppercase leading-none mb-1">{sub.name}</h4>
                              <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{profile?.name}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[8px] font-black text-white bg-white/10 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-white/10">
                              {sub.history.length} ITEM
                            </span>
                            <ChevronRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Detailed History per Sub View */
              <div className="space-y-6">
                {(() => {
                  const subContent = historyBySub.find(s => s.id === viewingHistorySubId);
                  const profile = profiles.find(p => p.id === subContent?.profileId);
                  const fullName = `${profile?.name} - ${subContent?.name}`;

                  return (
                    <>
                      <div className="flex items-center justify-between px-2 mb-6">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setViewingHistorySubId(null)}
                            className="w-10 h-10 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
                          >
                            <ChevronRight size={20} className="rotate-180" />
                          </button>
                          <div>
                            <h3 className="text-sm font-black text-white tracking-tight uppercase">{subContent?.name}</h3>
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{profile?.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus semua riwayat untuk lokasi "${subContent?.name}"?`)) {
                              subContent?.history.forEach(item => deleteRequest(item.id));
                              setViewingHistorySubId(null);
                            }
                          }}
                          className="flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-500/10 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={12} /> Hapus Semua
                        </button>
                      </div>

                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] divide-y divide-white/5 overflow-hidden shadow-2xl">
                        {subContent?.history.map((item) => (
                          <div key={item.id} className="p-5 flex items-center justify-between active:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/10">
                                <Package size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-black tracking-tight text-white uppercase">{item.materialName}</p>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-0.5">
                                  {new Date((item as any).receivedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-black italic text-white leading-none">
                                  {item.quantity} 
                                </p>
                                <span className="text-[9px] text-white/40 uppercase font-black">{item.unit}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    syncDirectToSheet(item, fullName);
                                    alert(`Sinkronisasi "${item.materialName}" dikirim ke Spreadsheet!`);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white transition-all border border-white/5"
                                  title="Sync to Sheet"
                                >
                                  <RefreshCw size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus riwayat "${item.materialName}"?`)) {
                                      deleteRequest(item.id);
                                    }
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/10 shadow-sm"
                                  title="Hapus Riwayat"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-black/95 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative border border-white/10 flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-black text-white uppercase tracking-tight">Daftar Material</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
           <div className="flex gap-2">
              <div className="flex-1">
                 <input 
                  type="text" 
                  placeholder="Nama..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-black text-white focus:bg-white/10 outline-none"
                  value={name}
                  onBlur={e => setName(toTitleCase(e.target.value))}
                  onChange={e => handleTitleCaseChange(e, (val) => setName(val))}
                  onKeyDown={handleEnterNextField}
                 />
              </div>
              <div className="w-24">
                 <input 
                  type="text"
                  placeholder="Satuan"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-xs font-black text-white focus:bg-white/10 outline-none text-center"
                  onKeyDown={handleEnterNextField}
                  onBlur={e => setUnit(toTitleCase(e.target.value))}
                  value={unit}
                  onChange={e => handleTitleCaseChange(e, (val) => setUnit(val))}
                 />
              </div>
              <button 
                disabled={!name}
                onClick={() => {
                  onAdd(name, unit);
                  setName('');
                }}
                className="bg-white text-black px-3.5 py-2.5 rounded-xl font-black text-xs disabled:opacity-30 active:scale-95 transition-all shadow-lg"
              >
                <Plus size={18} strokeWidth={4} />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar border-t border-white/5 pt-4 space-y-2">
           {materials.length === 0 ? (
             <p className="text-center text-[10px] text-white/30 italic py-8 uppercase font-black">Belum ada material.</p>
           ) : (
             materials.map(m => (
               <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl shadow-sm hover:shadow-md transition-all group">
                  <div>
                     <p className="text-xs font-black text-white uppercase">{m.name}</p>
                     <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{m.unit}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Hapus material "${m.name}"?`)) {
                        onDelete(m.id);
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                     <Trash2 size={14} />
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
    <div className={`border border-white/10 rounded-[28px] shadow-2xl transition-all relative overflow-hidden ${theme.bg} mb-4`}>
      {theme.watermark}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between text-left relative z-10"
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
                  <div className="flex-1 flex gap-2">
                    <div className="flex-1 h-12 flex items-center justify-center gap-2 text-[10px] font-black text-white/60 bg-white/5 border border-white/10 rounded-xl italic px-2">
                        <Wallet size={12} /> MENUNGGU FINANCE
                    </div>
                    <ActionButton 
                      label="APPROVE PEMBAYARAN" 
                      icon={<CheckCircle2 size={14} />} 
                      onClick={() => onStatusUpdate(request.id, 'paid')}
                      className="flex-[2] bg-white text-indigo-600 shadow-xl" 
                    />
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
    <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-white/20"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Payment Req</h3>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Konfirmasi Pembayaran</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-white/50 uppercase tracking-widest ml-1">Lokasi</label>
            <input 
              readOnly
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-black text-white/50"
              value={form.location}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-white/70 uppercase tracking-widest ml-1">Atas Nama Rekening</label>
            <input 
              required
              type="text" 
              placeholder="..."
              className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-3.5 text-sm font-black text-white focus:bg-white/10 outline-none placeholder:text-white/20 shadow-inner"
              onKeyDown={handleEnterNextField}
              onBlur={e => setForm({...form, accountName: toTitleCase(e.target.value)})}
              value={form.accountName}
              onChange={e => handleTitleCaseChange(e, (val) => setForm({...form, accountName: val}))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-white/70 uppercase tracking-widest ml-1">No. Rekening</label>
              <input 
                required
                type="text" 
                placeholder="000"
                className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-3.5 text-sm font-black text-white focus:bg-white/10 outline-none placeholder:text-white/20 shadow-inner"
                onKeyDown={handleEnterNextField}
                value={form.accountNumber}
                onChange={e => setForm({...form, accountNumber: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-white/70 uppercase tracking-widest ml-1">Bank</label>
              <input 
                required
                type="text" 
                placeholder="BCA/BRI"
                className="w-full bg-white/5 border border-white/20 rounded-2xl px-4 py-3.5 text-sm font-black text-white focus:bg-white/10 outline-none placeholder:text-white/20 shadow-inner"
                onKeyDown={handleEnterNextField}
                onBlur={e => setForm({...form, bank: toTitleCase(e.target.value)})}
                value={form.bank}
                onChange={e => handleTitleCaseChange(e, (val) => setForm({...form, bank: val}))}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-6 bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all uppercase tracking-widest"
          >
            <Send size={18} fill="currentColor" />
            Kirim WhatsApp
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
