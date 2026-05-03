import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { Truck, Package, Clock, CheckCircle2, CreditCard, ChevronRight, Pause, Play, X, Send, History, Check, AlertTriangle, Trash2, Plus } from 'lucide-react';
import { RequestStatus, MaterialRequest } from '../../types';

export default function SCMDashboard() {
  const { 
    locations = [], 
    requests = [], 
    updateRequestStatus, 
    approveEdit, 
    rejectEdit, 
    deleteRequest, 
    mainMaterials = [], 
    addMainMaterial, 
    deleteMainMaterial 
  } = useApp();
  const [showPaymentModal, setShowPaymentModal] = useState<MaterialRequest | null>(null);
  const [showMainMaterialModal, setShowMainMaterialModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const relevantRequests = requests.filter(r => r.status !== 'received');

  const locationsWithRequests = locations.map(loc => ({
    ...loc,
    requests: relevantRequests.filter(r => r.locationId === loc.id)
  })).filter(loc => loc.requests.length > 0);

  // History extraction per location
  const historyByLocation = locations.map(loc => {
    const receivedReqs = requests
      .filter(r => r.locationId === loc.id && r.status === 'received')
      .map(r => {
        const receivedEntry = r.history.find(h => h.status === 'received');
        return {
          ...r,
          receivedAt: receivedEntry?.timestamp || 0
        };
      })
      .sort((a, b) => b.receivedAt - a.receivedAt);
    
    return { ...loc, history: receivedReqs };
  }).filter(loc => loc.history.length > 0);

  const orphanedRequests = relevantRequests.filter(r => !locations.some(l => l.id === r.locationId));

  return (
    <div className="relative h-full flex flex-col bg-bg-base">
      <div className="relative z-10 flex flex-col h-full bg-bg-alt overflow-hidden">
        <header className="flex flex-col px-6 py-6 bg-bg-base border-b border-border-ig shrink-0 gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-bg-alt border border-border-ig flex items-center justify-center">
                 <Truck size={24} className="text-ig-black" strokeWidth={2} />
              </div>
              <div>
                 <h2 className="text-lg font-bold tracking-tight">Manajemen Suplai</h2>
                 <p className="text-ig-grey text-[11px] font-medium uppercase tracking-wider">Kontrol Logistik</p>
              </div>
            </div>
            
            <div className="flex bg-bg-alt p-1 rounded-lg border border-border-ig">
               <button 
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${activeTab === 'active' ? 'bg-white shadow-sm text-ig-blue' : 'text-ig-grey'}`}
               >
                 Aktif
               </button>
               <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-ig-blue' : 'text-ig-grey'}`}
               >
                 Riwayat
               </button>
               <button 
                onClick={() => setShowMainMaterialModal(true)}
                className="ml-2 px-3 py-1.5 rounded-md text-[13px] font-bold text-green-600 bg-green-50 border border-green-100 hover:bg-green-100 transition-all flex items-center gap-2"
               >
                 <Plus size={16} />
                 Material Utama
               </button>
            </div>
          </div>
          
          {activeTab === 'active' && (
            <div className="flex items-center gap-4">
              <div className="flex-1 ig-card px-4 py-3 flex flex-col gap-1">
                 <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider leading-none">Total Antrian</p>
                 <p className="text-xl font-bold">{relevantRequests.length}</p>
              </div>

              <div className="flex-1 ig-card px-4 py-3 flex flex-col gap-1 border-ig-blue/20">
                 <p className="text-[10px] font-bold text-ig-blue uppercase tracking-wider leading-none">Menunggu</p>
                 <p className="text-xl font-bold">{relevantRequests.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          )}
        </header>

        {activeTab === 'active' ? (
          locationsWithRequests.length === 0 && orphanedRequests.length === 0 ? (
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
                {locationsWithRequests.map((loc, idx) => (
                  <motion.div 
                    key={loc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-ig-blue" />
                        <h3 className="text-sm font-bold tracking-tight">{loc.name}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-ig-grey uppercase">{loc.requests.length} Request</span>
                    </div>

                    <div className="space-y-4">
                      {loc.requests.map((req) => (
                        <RequestItem 
                          key={req.id} 
                          request={req} 
                          onStatusUpdate={updateRequestStatus} 
                          onApproveEdit={approveEdit}
                          onRejectEdit={rejectEdit}
                          onRequestPayment={setShowPaymentModal}
                          locationName={loc.name}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
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
            {historyByLocation.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-40">
                <History size={48} />
                <p className="mt-4 font-bold text-xs uppercase tracking-widest">Belum Ada Riwayat</p>
              </div>
            ) : (
              historyByLocation.map(loc => (
                <div key={loc.id} className="space-y-4">
                   <div className="flex items-center gap-2 px-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <h3 className="text-sm font-bold tracking-tight">{loc.name}</h3>
                    </div>
                    <div className="ig-card divide-y divide-gray-50 overflow-hidden">
                       {loc.history.map((item) => (
                         <div key={item.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                                  <Package size={14} />
                               </div>
                               <div>
                                  <p className="text-sm font-bold leading-tight">{item.materialName}</p>
                                  <p className="text-[10px] text-ig-grey font-medium mt-0.5">
                                     Diterima: {new Date((item as any).receivedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-lg font-bold tracking-tighter leading-none">
                                  {item.quantity} 
                               </p>
                               <span className="text-[10px] text-ig-grey uppercase font-bold">{item.unit}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                </div>
              ))
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
            locationName={locations.find(l => l.id === showPaymentModal.locationId)?.name || ''}
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
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative border border-border-ig flex flex-col"
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
}> = ({ 
  request, 
  onStatusUpdate, 
  onApproveEdit,
  onRejectEdit,
  onRequestPayment,
  onDelete,
  locationName
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
    <div className={`ig-card overflow-hidden transition-all ${
      request.status === 'on_hold' ? 'bg-red-50/30' : 'bg-bg-base'
    }`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-bg-alt flex items-center justify-center border border-border-ig ${getStatusColor(request.status)}`}>
            {request.status === 'delivered' ? <Truck size={18} /> : <Package size={18} />}
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">{request.materialName}</p>
            <StatusTimer status={request.status} startTime={currentStatusStartTime} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {request.pendingEdit && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />}
          {onDelete && (
             <button 
              onClick={(e) => { e.stopPropagation(); onDelete(request.id); }}
              className="p-2 text-red-400 hover:text-red-600 transition-colors"
             >
                <Trash2 size={16} />
             </button>
          )}
          <div className={`text-ig-grey transition-transform ${isExpanded ? 'rotate-90 text-ig-blue' : ''}`}>
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
            className="px-4 pb-4 space-y-4"
          >
            {request.pendingEdit && (
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Permintaan Edit</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                   <div className="text-[10px] text-yellow-600">Nama Baru: <span className="font-bold text-yellow-900">{request.pendingEdit.materialName}</span></div>
                   <div className="text-[10px] text-yellow-600">Kuantitas: <span className="font-bold text-yellow-900">{request.pendingEdit.quantity} {request.pendingEdit.unit}</span></div>
                   <div className="text-[10px] text-yellow-600">Batas: <span className="font-bold text-yellow-900">{new Date(request.pendingEdit.dateNeeded).toLocaleDateString()}</span></div>
                </div>
                <div className="flex gap-2 pt-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); onApproveEdit(request.id); }}
                    className="flex-1 bg-yellow-500 text-white py-1.5 rounded-md text-[10px] font-bold uppercase"
                   >
                     Setujui
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onRejectEdit(request.id); }}
                    className="flex-1 bg-white text-yellow-700 border border-yellow-200 py-1.5 rounded-md text-[10px] font-bold uppercase"
                   >
                     Tolak
                   </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-3 bg-bg-alt rounded-lg border border-border-ig">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider leading-none">Jumlah</p>
                <p className="text-sm font-bold">{request.quantity} {request.unit.toUpperCase()}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider leading-none">Batas</p>
                <p className="text-sm font-bold">{new Date(request.dateNeeded).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2">
                {request.status === 'pending' && (
                  <ActionButton 
                    label="Proses" 
                    icon={<Play size={14} />} 
                    onClick={() => onStatusUpdate(request.id, 'processing')}
                    className="flex-1 bg-amber-500 text-white" 
                  />
                )}
                {request.status === 'processing' && (
                  <ActionButton 
                    label="Ajukan Bayar" 
                    icon={<CreditCard size={14} />} 
                    onClick={() => onRequestPayment(request)}
                    className="flex-1 bg-ig-blue text-white" 
                  />
                )}
                {request.status === 'paid' && (
                  <ActionButton 
                    label="Kirim Barang" 
                    icon={<Truck size={14} />} 
                    onClick={() => onStatusUpdate(request.id, 'delivered')}
                    className="flex-1 bg-green-600 text-white" 
                  />
                )}
                {request.status === 'delivered' && (
                  <div className="flex-1 h-10 flex items-center justify-center text-[11px] font-bold text-ig-blue bg-blue-50 rounded-md border border-blue-100 italic">
                    Sedang Diantar
                  </div>
                )}
                {request.status === 'awaiting_payment' && (
                  <div className="flex-1 h-10 flex items-center justify-center text-[11px] font-bold text-ig-grey bg-bg-alt rounded-md border border-border-ig italic">
                    Menunggu Pembayaran
                  </div>
                )}

                {['pending', 'processing', 'awaiting_payment', 'paid'].includes(request.status) ? (
                  <ActionButton 
                    label="Hold" 
                    icon={<Pause size={14} />} 
                    onClick={() => onStatusUpdate(request.id, 'on_hold')}
                    className="bg-bg-alt text-red-500 w-16 border border-border-ig" 
                  />
                ) : request.status === 'on_hold' ? (
                  <ActionButton 
                    label="Lanjutkan" 
                    icon={<Play size={14} />} 
                    onClick={() => onStatusUpdate(request.id, getResumeStatus())}
                    className="flex-1 bg-ig-blue text-white" 
                  />
                ) : null}
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
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative border border-border-ig"
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

function StatusTimer({ status, startTime }: { status: RequestStatus, startTime: number }) {
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

  const getStatusLabel = (s: RequestStatus) => {
    switch (s) {
      case 'pending': return 'Belum di proses';
      case 'processing': return 'Diproses';
      case 'awaiting_payment': return 'Menunggu Pembayaran';
      case 'paid': return 'Pembayaran Berhasil';
      case 'delivered': return 'Pengantaran';
      case 'on_hold': return 'HOLD';
      default: return s;
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={`text-[10px] font-bold uppercase ${
        status === 'on_hold' ? 'text-red-500' : 'text-ig-blue'
      }`}>
        {getStatusLabel(status)}
      </span>
      <span className="text-ig-grey opacity-30 mx-1">•</span>
      <span className={`text-[10px] font-medium tracking-tight ${status === 'on_hold' ? 'text-red-500 italic' : 'text-ig-grey'}`}>
        {status === 'on_hold' ? 'Terkunci' : formatTime(elapsed)}
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
