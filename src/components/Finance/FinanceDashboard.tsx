import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../AppContext';
import { CreditCard, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { RequestStatus, MaterialRequest } from '../../types';

export default function FinanceDashboard() {
  const { locations, requests, updateRequestStatus } = useApp();

  // Finance only cares about requests that are 'awaiting_payment' or 'paid'
  const relevantRequests = requests.filter(r => r.status === 'awaiting_payment' || r.status === 'paid');

  const locationsWithRequests = locations.map(loc => ({
    ...loc,
    requests: relevantRequests.filter(r => r.locationId === loc.id)
  })).filter(loc => loc.requests.length > 0);

  // For debugging/safety: find requests that don't match any location
  const orphanedRequests = relevantRequests.filter(r => !locations.some(l => l.id === r.locationId));

  return (
    <div className="relative min-h-[80vh] bg-white p-4 md:p-12 border border-slate-100 shadow-sm rounded-[32px] md:rounded-3xl">
      <div className="relative z-10 space-y-8 md:space-y-16">
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-8 gap-8">
          <div className="space-y-1">
             <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Manajemen Keuangan</h2>
             <p className="text-slate-500 text-sm">Persetujuan pembayaran dan verifikasi dana proyek.</p>
          </div>
          <div className="flex items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
             <div className="text-center px-8 border-r border-rose-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
                <p className="text-3xl font-black text-rose-500 tracking-tighter leading-none">{relevantRequests.filter(r => r.status === 'awaiting_payment').length}</p>
             </div>
             <div className="text-center px-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sudah Di Bayar</p>
                <p className="text-3xl font-black text-emerald-500 tracking-tighter leading-none">{relevantRequests.filter(r => r.status === 'paid').length}</p>
             </div>
          </div>
        </header>

        {locationsWithRequests.length === 0 && orphanedRequests.length === 0 ? (
          <div className="h-[50vh] flex flex-col items-center justify-center text-center bg-rose-50/10 rounded-[40px] border-4 border-dashed border-rose-50">
             <div className="relative mb-8">
                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-3xl opacity-30 animate-ping" />
                <CheckCircle2 size={100} strokeWidth={0.5} className="text-emerald-200 relative" />
             </div>
             <h3 className="text-3xl font-black text-slate-300 tracking-tight italic">FINANCE CLEAR</h3>
             <p className="text-slate-400 font-medium italic mt-2">Semua invoice material telah diselesaikan hari ini.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {locationsWithRequests.map(loc => (
                <div key={loc.id} className="bg-slate-50/20 border border-slate-100 rounded-2xl p-8 hover:border-slate-200 transition-all group">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
                    <div className="space-y-0.5">
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight uppercase group-hover:text-slate-600 transition-colors">{loc.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Finance Dept</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-[12px] font-bold text-slate-600 uppercase">
                        {loc.requests.filter(r => r.status === 'awaiting_payment').length} Pending
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {loc.requests.map(req => (
                      <FinanceRequestItem key={req.id} request={req} onApprove={updateRequestStatus} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {orphanedRequests.length > 0 && (
              <div className="pt-12 border-t border-slate-100">
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-slate-800">Pembayaran Campuran / Tanpa Lokasi</h3>
                  <p className="text-sm text-slate-500">Invoice yang lokasi asalnya tidak ditemukan.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {orphanedRequests.map(req => (
                    <div key={req.id} className="bg-rose-50/10 border border-rose-100 rounded-2xl p-6">
                      <FinanceRequestItem 
                        request={req} 
                        onApprove={updateRequestStatus} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const FinanceRequestItem: React.FC<{ request: MaterialRequest; onApprove: (id: string, s: RequestStatus) => void }> = ({ request, onApprove }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      request.status === 'awaiting_payment' ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-60'
    }`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">{request.materialName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
              request.status === 'awaiting_payment' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {request.status === 'awaiting_payment' ? 'Menunggu Bayar' : 'Lunas'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {request.quantity} {request.unit.toUpperCase()}
            </span>
          </div>
        </div>
        <ChevronRight size={16} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-[10px]">
             <div>
               <p className="text-slate-400 font-bold uppercase mb-1">Tanggal Request</p>
               <p className="text-slate-800 font-medium">{new Date(request.dateRequested).toLocaleDateString()}</p>
             </div>
             <div>
               <p className="text-slate-400 font-bold uppercase mb-1">Dibutuhkan</p>
               <p className="text-slate-800 font-medium">{new Date(request.dateNeeded).toLocaleDateString()}</p>
             </div>
          </div>

          {request.status === 'awaiting_payment' && (
            <button 
              onClick={() => onApprove(request.id, 'paid')}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2"
            >
              <CreditCard size={14} />
              Konfirmasi Lunas
            </button>
          )}
        </div>
      )}
    </div>
  );
}
