import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { CreditCard, CheckCircle2, Clock, ChevronRight, Landmark, Wallet, MapPin, X, ArrowLeft, MoreHorizontal, FileText, Trash2 } from 'lucide-react';
import { RequestStatus, MaterialRequest, FieldFundEntry } from '../../types';

export default function FinanceDashboard() {
  const { profiles = [], subs = [], requests = [], fieldFunds = [], updateRequestStatus, deleteFieldFundEntry } = useApp();
  const [activeTab, setActiveTab] = useState<'requests' | 'funds'>('requests');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && !e.state.isSubNav && e.state.role === null) return;
      
      if (selectedSubId) {
        setSelectedSubId(null);
      } else if (activeTab !== 'requests') {
        setActiveTab('requests');
      }
    };

    if (selectedSubId || activeTab !== 'requests') {
      window.history.pushState({ role: 'FINANCE', isSubNav: true }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedSubId, activeTab]);

  // Finance only cares about requests that are 'awaiting_payment' or 'paid'
  const relevantRequests = requests.filter(r => r.status === 'awaiting_payment' || r.status === 'paid');

  const subsWithRequests = subs.map(sub => ({
    ...sub,
    requests: relevantRequests.filter(r => r.subId === sub.id)
  })).filter(sub => sub.requests.length > 0);

  const orphanedRequests = relevantRequests.filter(r => !subs.some(s => s.id === r.subId));

  const subsWithFunds = subs.map(sub => ({
    ...sub,
    fundsCount: fieldFunds.filter(f => f.subId === sub.id).length
  })).filter(s => s.fundsCount > 0);

  return (
    <div className="relative h-full flex flex-col pt-[env(safe-area-inset-top)]">
      <div className="relative z-10 flex flex-col h-full overflow-hidden mb-20">
        <header className="flex flex-col px-6 py-6 bg-black/40 backdrop-blur-md border-b border-white/10 shrink-0 gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center transition-colors ${activeTab === 'requests' ? 'bg-white text-black shadow-lg shadow-black/10' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'}`}>
               {activeTab === 'requests' ? (
                 <CreditCard size={24} strokeWidth={2.5} />
               ) : (
                 <Landmark size={24} strokeWidth={2.5} />
               )}
            </div>
            <div>
               <h2 className="text-xl font-black italic tracking-tight text-white leading-none mb-1">
                 {activeTab === 'requests' ? 'APPROVED REQ' : 'FUNDS AUDIT'}
               </h2>
               <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] leading-none">Divisi Finance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 flex flex-col gap-1 shadow-inner">
               <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Requests</p>
               <p className="text-xl font-black italic text-white leading-none">{relevantRequests.length}</p>
            </div>

            <div className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-3.5 flex flex-col gap-1 shadow-2xl">
               <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Field Funds</p>
               <p className="text-xl font-black italic text-white leading-none">{fieldFunds.length}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
          <AnimatePresence mode="wait">
            {activeTab === 'requests' ? (
              <motion.div 
                key="requests"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-4 space-y-6"
              >
                {subsWithRequests.length === 0 && orphanedRequests.length === 0 ? (
                  <EmptyState message="No pending approvals" subMessage="All material payments are cleared" />
                ) : (
                  <>
                    <div className="space-y-6">
                      {subsWithRequests.map((sub, idx) => {
                        const profile = profiles.find(p => p.id === sub.profileId);
                        return (
                          <div key={sub.id} className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                                <h3 className="text-xs font-black tracking-widest text-white uppercase">
                                  {profile?.name} <span className="text-white/30 font-black">/ {sub.name}</span>
                                </h3>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {sub.requests.map(req => (
                                <FinanceRequestItem key={req.id} request={req} onApprove={updateRequestStatus} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {orphanedRequests.length > 0 && (
                      <div className="pt-10 border-t border-black/10">
                        <h3 className="text-xs font-black text-black/40 uppercase tracking-widest mb-6 px-2">Unassigned Requests</h3>
                        <div className="space-y-4">
                          {orphanedRequests.map(req => (
                            <FinanceRequestItem key={req.id} request={req} onApprove={updateRequestStatus} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="funds"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-4"
              >
                {selectedSubId ? (
                  <FundsDetailView 
                    subId={selectedSubId} 
                    subs={subs} 
                    fieldFunds={fieldFunds} 
                    onBack={() => setSelectedSubId(null)}
                    onDelete={deleteFieldFundEntry}
                  />
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-widest ml-2 mb-4">Pilih Lokasi Audit</h3>
                    {subsWithFunds.length === 0 ? (
                      <EmptyState message="No reports found" subMessage="Field fund reports will appear here" />
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {subsWithFunds.map((sub) => {
                          const profile = profiles.find(p => p.id === sub.profileId);
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setSelectedSubId(sub.id)}
                              className="bg-white/5 backdrop-blur-md border border-white/10 p-4 flex items-center justify-between rounded-2xl hover:bg-white/10 transition-all active:scale-[0.98] group shadow-sm"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all border border-white/10">
                                  <Landmark size={24} />
                                </div>
                                <div className="text-left">
                                  <h4 className="text-sm font-black text-white italic tracking-tight">{sub.name}</h4>
                                  <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{profile?.name}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[8px] font-black text-white bg-white/10 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-white/10 shadow-sm">
                                  {sub.fundsCount} NOTA
                                </span>
                                <ChevronRight size={16} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-2xl border-t border-white/10 px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-around z-50 shadow-2xl safe-area-pb">
        <button 
          onClick={() => { setActiveTab('requests'); setSelectedSubId(null); }}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'requests' ? 'text-white scale-110' : 'text-white/30 opacity-40'}`}
        >
          <div className={`p-2.5 rounded-2xl ${activeTab === 'requests' ? 'bg-white shadow-lg border border-white/10 text-black' : ''}`}>
            <CreditCard size={20} strokeWidth={activeTab === 'requests' ? 3 : 2} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[.2em]">Approval</span>
        </button>

        <button 
          onClick={() => setActiveTab('funds')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'funds' ? 'text-emerald-400 scale-110' : 'text-white/30 opacity-40'}`}
        >
          <div className={`p-2.5 rounded-2xl ${activeTab === 'funds' ? 'bg-emerald-500/10 shadow-lg border border-emerald-500/10' : ''}`}>
            <Landmark size={20} strokeWidth={activeTab === 'funds' ? 3 : 2} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[.2em]">Dana Lapangan</span>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message, subMessage }: { message: string, subMessage: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
      <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center mb-6">
         <CheckCircle2 size={40} strokeWidth={1} className="text-white" />
      </div>
      <h3 className="text-base font-black text-white italic uppercase tracking-tight">{message}</h3>
      <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 font-black">{subMessage}</p>
    </div>
  );
}

function FundsDetailView({ subId, subs, fieldFunds, onBack, onDelete }: any) {
  const sub = subs.find((s: any) => s.id === subId);
  const funds = fieldFunds.filter((f: any) => f.subId === subId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-sm font-black text-white tracking-tight uppercase">Audit: {sub?.name}</h3>
          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Field Audit Logs</p>
        </div>
      </div>

      <div className="space-y-8 pb-32">
        {funds.map((nota: FieldFundEntry) => (
          <div key={nota.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-white/5 flex items-center justify-between border-b border-white/10">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-lg">
                   <FileText size={18} />
                 </div>
                 <div>
                   <p className="text-sm font-black text-white uppercase tracking-tight">{nota.notaNo}</p>
                   <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-none mt-1">{nota.tanggal}</p>
                 </div>
               </div>
               <button 
                  onClick={() => onDelete(nota.id)}
                  className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/10 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                   <Trash2 size={16} />
                </button>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3">Klas</th>
                    <th className="px-6 py-3">Qty</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {nota.items?.map((item, i) => (
                    <tr key={i} className="text-[11px] font-bold text-white/80">
                      <td className="px-6 py-4 font-black uppercase text-white">{item.uraian}</td>
                      <td className="px-6 py-4 text-[9px] font-black text-white/30 uppercase">{item.klasifikasi}</td>
                      <td className="px-6 py-4">{item.jumlah} {item.satuan}</td>
                      <td className="px-6 py-4 text-right font-black text-white">{(item.hargaTotal || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-white/5">
                  <tr className="text-[11px] font-black">
                    <td colSpan={3} className="px-6 py-4 uppercase tracking-widest text-white/40">Total Nota</td>
                    <td className="px-6 py-4 text-right text-white text-sm italic font-black">RP {(nota.totalNota || 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const FinanceRequestItem: React.FC<{ request: MaterialRequest; onApprove: (id: string, s: RequestStatus) => void }> = ({ request, onApprove }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className={`backdrop-blur-md rounded-[28px] overflow-hidden transition-all border ${
      request.status === 'awaiting_payment' 
      ? 'bg-white/10 border-white/10 shadow-2xl' 
      : 'bg-white/5 border-white/5 opacity-40 grayscale'
    }`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white tracking-tight truncate uppercase italic">{request.materialName}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              request.status === 'awaiting_payment' ? 'text-white' : 'text-emerald-400'
            }`}>
              {request.status === 'awaiting_payment' ? 'Pending Approval' : 'Paid'}
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-black text-white/40 uppercase">
              {request.quantity} {request.unit.toUpperCase()}
            </span>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white transition-all ${isExpanded ? 'rotate-90 bg-white text-black shadow-lg' : ''}`}>
           <ChevronRight size={18} strokeWidth={3} />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
               <div>
                 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5 leading-none">Entry Date</p>
                 <p className="text-xs font-black text-white">{new Date(request.dateRequested).toLocaleDateString()}</p>
               </div>
               <div className="text-right">
                 <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5 leading-none">Target Date</p>
                 <p className="text-xs font-black text-white">{new Date(request.dateNeeded || request.createdAt).toLocaleDateString()}</p>
               </div>
            </div>

            {request.status === 'awaiting_payment' && (
              <button 
                onClick={() => onApprove(request.id, 'paid')}
                className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest"
              >
                <CreditCard size={18} strokeWidth={3} />
                APPROVE PAYMENT
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
