import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { Truck, Package, Clock, CheckCircle2, CreditCard, ChevronRight, Pause, Play, X, Send } from 'lucide-react';
import { RequestStatus, MaterialRequest } from '../../types';

export default function SCMDashboard() {
  const { locations, requests, updateRequestStatus } = useApp();
  const [showPaymentModal, setShowPaymentModal] = useState<MaterialRequest | null>(null);

  const relevantRequests = requests.filter(r => r.status !== 'received');

  const locationsWithRequests = locations.map(loc => ({
    ...loc,
    requests: relevantRequests.filter(r => r.locationId === loc.id)
  })).filter(loc => loc.requests.length > 0);

  // For debugging/safety: find requests that don't match any location
  const orphanedRequests = relevantRequests.filter(r => !locations.some(l => l.id === r.locationId));

  return (
    <div className="relative min-h-[80vh] bg-white p-4 md:p-12 border border-slate-100 shadow-sm rounded-[32px] md:rounded-3xl">
      <div className="relative z-10 space-y-8 md:space-y-16">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-50 pb-8 gap-6">
          <div className="space-y-1">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Logistik & Distribusi</h2>
             <p className="text-slate-500 text-sm">Monitoring pemenuhan material proyek secara real-time.</p>
          </div>
          <div className="hidden lg:flex items-center gap-12">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Permintaan</p>
                <p className="text-3xl font-black text-emerald-600 tracking-tighter">{relevantRequests.length}</p>
             </div>
             <div className="w-px h-12 bg-slate-100" />
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antrian Baru</p>
                <p className="text-3xl font-black text-teal-600 tracking-tighter">{relevantRequests.filter(r => r.status === 'pending').length}</p>
             </div>
          </div>
        </header>

        {locationsWithRequests.length === 0 && orphanedRequests.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck size={40} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-bold text-slate-300">Belum Ada Permintaan</h3>
            <p className="text-slate-400 mt-2">Semua logistik sedang stand-by.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {locationsWithRequests.map(loc => (
                <div key={loc.id} className="bg-slate-50/20 border border-slate-100 rounded-2xl p-8 hover:border-slate-200 transition-all flex flex-col h-full group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-0.5">
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-600 transition-colors uppercase tracking-tight">{loc.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Unit Lokasi</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 uppercase">
                        {loc.requests.filter(r => r.status === 'pending' || r.status === 'processing').length} Active
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6 flex-1">
                    {loc.requests.map((req) => (
                      <RequestItem 
                        key={req.id} 
                        request={req} 
                        onStatusUpdate={updateRequestStatus} 
                        onRequestPayment={setShowPaymentModal}
                        locationName={loc.name}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {orphanedRequests.length > 0 && (
              <div className="pt-12 border-t border-slate-100">
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-slate-800">Permintaan Tanpa Lokasi</h3>
                  <p className="text-sm text-slate-500">Muncul jika data lokasi tidak sinkron atau dihapus.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {orphanedRequests.map(req => (
                    <div key={req.id} className="bg-rose-50/10 border border-rose-100 rounded-2xl p-6">
                      <RequestItem 
                        request={req} 
                        onStatusUpdate={updateRequestStatus} 
                        onRequestPayment={setShowPaymentModal}
                        locationName="Lokasi Tidak Diketahui"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
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

const RequestItem: React.FC<{ 
  request: MaterialRequest; 
  onStatusUpdate: (id: string, s: RequestStatus) => void;
  onRequestPayment: (req: MaterialRequest) => void;
  locationName: string;
}> = ({ 
  request, 
  onStatusUpdate, 
  onRequestPayment,
  locationName
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'text-slate-400';
      case 'processing': return 'text-amber-500';
      case 'awaiting_payment': return 'text-blue-500';
      case 'paid': return 'text-indigo-500';
      case 'delivered': return 'text-emerald-500';
      case 'on_hold': return 'text-rose-500';
      default: return 'text-slate-400';
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
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      request.status === 'on_hold' ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50/50 border-slate-100 hover:bg-white'
    }`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-white shadow-sm ${getStatusColor(request.status)}`}>
            {request.status === 'delivered' ? <Truck size={16} /> : <Package size={16} />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{request.materialName}</p>
            <StatusTimer status={request.status} startTime={currentStatusStartTime} />
          </div>
        </div>
        <ChevronRight size={16} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-[10px]">
            <div>
              <p className="text-slate-400 font-bold uppercase mb-1">Jumlah</p>
              <p className="text-slate-800 font-medium">{request.quantity} {request.unit.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase mb-1">Butuh tgl</p>
              <p className="text-slate-800 font-medium">{new Date(request.dateNeeded).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Update Status</p>
            
            <div className="flex items-center gap-2">
              {request.status === 'pending' && (
                <ActionButton 
                  label="Proses" 
                  icon={<Clock size={12} />} 
                  onClick={() => onStatusUpdate(request.id, 'processing')}
                  className="flex-1 bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-sm" 
                />
              )}
              {request.status === 'processing' && (
                <ActionButton 
                  label="Minta Bayar" 
                  icon={<CreditCard size={12} />} 
                  onClick={() => onRequestPayment(request)}
                  className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm" 
                />
              )}
              {request.status === 'paid' && (
                <ActionButton 
                  label="Kirim" 
                  icon={<Truck size={12} />} 
                  onClick={() => onStatusUpdate(request.id, 'delivered')}
                  className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-sm" 
                />
              )}
              {request.status === 'delivered' && (
                <div className="flex-1 py-2 text-center text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 rounded-xl">
                  Dalam Pengiriman
                </div>
              )}
              {request.status === 'awaiting_payment' && (
                <div className="flex-1 py-2 text-center text-[10px] font-bold text-blue-600 uppercase bg-blue-50 rounded-xl">
                  Menunggu Finance
                </div>
              )}

              {/* Hold/Indent Toggle in the same bar */}
              {['pending', 'processing', 'awaiting_payment', 'paid'].includes(request.status) ? (
                <ActionButton 
                  label="Hold" 
                  icon={<Pause size={12} />} 
                  onClick={() => onStatusUpdate(request.id, 'on_hold')}
                  className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 shadow-sm" 
                />
              ) : request.status === 'on_hold' ? (
                <ActionButton 
                  label="Lanjutkan" 
                  icon={<Play size={12} />} 
                  onClick={() => onStatusUpdate(request.id, getResumeStatus())}
                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10" 
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    
    // Construct WhatsApp message
    const message = `Lokasi : ${form.location}\nNama : ${form.accountName}\nNo Rekening : ${form.accountNumber}\nBank : ${form.bank}\n\nBismillah Saya Telah Mengorder *${request.materialName}* Mohon Lakukan Pembayaran Bu Terima Kasih`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    
    onConfirm(request.id);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900">
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
             <CreditCard size={24} />
           </div>
           <div>
             <h3 className="text-xl font-medium">Data Pembayaran</h3>
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Request Finance</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Lokasi</label>
            <input 
              readOnly
              type="text" 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-100 outline-none"
              value={form.location}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nama Rekening</label>
            <input 
              required
              type="text" 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-100 outline-none"
              value={form.accountName}
              onChange={e => setForm({...form, accountName: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nomor Rekening</label>
            <input 
              required
              type="text" 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-100 outline-none"
              value={form.accountNumber}
              onChange={e => setForm({...form, accountNumber: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Bank</label>
            <input 
              required
              type="text" 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-100 outline-none"
              value={form.bank}
              onChange={e => setForm({...form, bank: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
          >
            <Send size={16} />
            Kirim Permintaan
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
      case 'pending': return 'Antrian';
      case 'processing': return 'Diproses';
      case 'awaiting_payment': return 'Menunggu Bayar';
      case 'paid': return 'Sudah Dibayar';
      case 'delivered': return 'Diantarkan';
      case 'on_hold': return 'HOLD / INDENT';
      default: return s;
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
        status === 'pending' ? 'bg-slate-100 text-slate-500' :
        status === 'processing' ? 'bg-amber-50 text-amber-600' :
        status === 'awaiting_payment' ? 'bg-blue-50 text-blue-600' :
        status === 'paid' ? 'bg-indigo-50 text-indigo-600' :
        status === 'on_hold' ? 'bg-rose-100 text-rose-700' :
        'bg-emerald-50 text-emerald-600'
      }`}>
        {getStatusLabel(status)}
      </span>
      <span className={`text-[10px] font-mono ${status === 'on_hold' ? 'text-rose-400 italic' : 'text-slate-400'}`}>
        {status === 'on_hold' ? '(PAUSED)' : formatTime(elapsed)}
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
