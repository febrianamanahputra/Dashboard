import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { CreditCard, CheckCircle2, Clock, ChevronRight, Landmark, Wallet, MapPin, X, ArrowLeft, MoreHorizontal, FileText, Trash2 } from 'lucide-react';
import { RequestStatus, MaterialRequest, FieldFundEntry } from '../../types';

export default function FinanceDashboard() {
  const { profiles = [], subs = [], requests = [], fieldFunds = [], updateRequestStatus, deleteFieldFundEntry } = useApp();
  const [activeTab, setActiveTab] = useState<'requests' | 'funds'>('requests');
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

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
    <div className="relative h-full flex flex-col bg-bg-base">
      <div className="relative z-10 flex flex-col h-full bg-bg-alt overflow-hidden mb-20">
        <header className="flex flex-col px-6 py-6 bg-bg-base border-b border-border-ig shrink-0 gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full border border-border-ig flex items-center justify-center transition-colors ${activeTab === 'requests' ? 'bg-ig-blue/5 border-ig-blue/20' : 'bg-green-50 border-green-200'}`}>
               {activeTab === 'requests' ? (
                 <CreditCard size={24} className="text-ig-blue" strokeWidth={2} />
               ) : (
                 <Landmark size={24} className="text-green-600" strokeWidth={2} />
               )}
            </div>
            <div>
               <h2 className="text-lg font-bold tracking-tight">
                 {activeTab === 'requests' ? 'Verification Requests' : 'Field Funds Audit'}
               </h2>
               <p className="text-ig-grey text-[11px] font-medium uppercase tracking-wider">Divisi Finance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 ig-card px-4 py-3 flex flex-col gap-1 border-ig-blue/10">
               <p className="text-[10px] font-bold text-ig-blue uppercase tracking-wider leading-none">Requests</p>
               <p className="text-xl font-bold">{relevantRequests.length}</p>
            </div>

            <div className="flex-1 ig-card px-4 py-3 flex flex-col gap-1 border-green-100">
               <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider leading-none">Field Funds</p>
               <p className="text-xl font-bold">{fieldFunds.length}</p>
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
                                <MapPin size={14} className="text-ig-blue" />
                                <h3 className="text-sm font-black tracking-tight">
                                  {profile?.name} <span className="text-ig-grey font-medium">/ {sub.name}</span>
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
                      <div className="pt-10 border-t border-border-ig">
                        <h3 className="text-xs font-bold text-ig-grey uppercase tracking-widest mb-6 px-2">Unassigned Requests</h3>
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
                    <h3 className="text-xs font-bold text-ig-grey uppercase tracking-widest ml-2 mb-4">Pilih Lokasi Audit</h3>
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
                              className="ig-card p-4 flex items-center justify-between bg-white hover:border-ig-blue/30 transition-all active:scale-95 group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-bg-alt flex items-center justify-center text-ig-grey group-hover:bg-ig-blue/5 group-hover:text-ig-blue transition-colors">
                                  <Landmark size={24} />
                                </div>
                                <div className="text-left">
                                  <h4 className="text-sm font-bold tracking-tight">{sub.name}</h4>
                                  <p className="text-[10px] text-ig-grey font-medium uppercase tracking-wider">{profile?.name}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black text-ig-blue bg-ig-blue/5 px-2 py-1 rounded">
                                  {sub.fundsCount} NOTA
                                </span>
                                <ChevronRight size={16} className="text-ig-grey" />
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

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-ig px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-pb">
        <button 
          onClick={() => { setActiveTab('requests'); setSelectedSubId(null); }}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'requests' ? 'text-ig-blue scale-110' : 'text-ig-grey opacity-40'}`}
        >
          <div className={`p-2 rounded-xl ${activeTab === 'requests' ? 'bg-ig-blue/10' : ''}`}>
            <CreditCard size={20} strokeWidth={activeTab === 'requests' ? 3 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Approval</span>
        </button>

        <button 
          onClick={() => setActiveTab('funds')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'funds' ? 'text-green-600 scale-110' : 'text-ig-grey opacity-40'}`}
        >
          <div className={`p-2 rounded-xl ${activeTab === 'funds' ? 'bg-green-600/10' : ''}`}>
            <Landmark size={20} strokeWidth={activeTab === 'funds' ? 3 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Dana Lapangan</span>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message, subMessage }: { message: string, subMessage: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
      <div className="w-20 h-20 rounded-full border-2 border-dashed border-ig-grey flex items-center justify-center mb-6">
         <CheckCircle2 size={40} strokeWidth={1} />
      </div>
      <h3 className="text-base font-bold italic">{message}</h3>
      <p className="text-ig-grey text-xs uppercase tracking-widest mt-1 font-bold">{subMessage}</p>
    </div>
  );
}

function FundsDetailView({ subId, subs, fieldFunds, onBack, onDelete }: any) {
  const sub = subs.find((s: any) => s.id === subId);
  const funds = fieldFunds.filter((f: any) => f.subId === subId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white rounded-full border border-border-ig text-ig-grey">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-sm font-bold tracking-tight">Dana Lapangan: {sub?.name}</h3>
          <p className="text-[10px] text-ig-grey font-bold uppercase tracking-widest">Field Audit Logs</p>
        </div>
      </div>

      <div className="space-y-8 pb-32">
        {funds.map((nota: FieldFundEntry) => (
          <div key={nota.id} className="ig-card bg-white border border-border-ig overflow-hidden">
            <div className="px-4 py-3 bg-bg-alt flex items-center justify-between border-b border-border-ig">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-ig-black text-white flex items-center justify-center">
                   <FileText size={16} />
                 </div>
                 <div>
                   <p className="text-xs font-black">{nota.notaNo}</p>
                   <p className="text-[9px] text-ig-grey font-bold uppercase">{nota.tanggal}</p>
                 </div>
               </div>
               <button 
                  onClick={() => onDelete(nota.id)}
                  className="p-2 text-red-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-bg-alt/50 border-b border-border-ig">
                  <tr className="text-[8px] font-bold text-ig-grey uppercase tracking-widest">
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2">Klas</th>
                    <th className="px-4 py-2">Qty</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {nota.items?.map((item, i) => (
                    <tr key={i} className="text-[10px] font-medium">
                      <td className="px-4 py-3 font-bold">{item.uraian}</td>
                      <td className="px-4 py-3 opacity-50">{item.klasifikasi}</td>
                      <td className="px-4 py-3">{item.jumlah} {item.satuan}</td>
                      <td className="px-4 py-3 text-right font-black">{(item.hargaTotal || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-ig-blue/5">
                  <tr className="text-[10px] font-black">
                    <td colSpan={3} className="px-4 py-3 uppercase tracking-widest text-ig-grey">Total Nota</td>
                    <td className="px-4 py-3 text-right text-ig-blue text-xs">Rp {(nota.totalNota || 0).toLocaleString()}</td>
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
    <div className={`ig-card overflow-hidden transition-all ${
      request.status === 'awaiting_payment' ? 'bg-bg-base border-ig-blue/30 shadow-md' : 'bg-bg-alt opacity-60'
    }`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold tracking-tight truncate">{request.materialName}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              request.status === 'awaiting_payment' ? 'text-ig-blue' : 'text-green-600'
            }`}>
              {request.status === 'awaiting_payment' ? 'Pending Payment' : 'Settled'}
            </span>
            <span className="text-ig-grey opacity-30">•</span>
            <span className="text-[10px] font-medium text-ig-grey">
              {request.quantity} {request.unit.toUpperCase()}
            </span>
          </div>
        </div>
        <div className={`text-ig-grey transition-all ${isExpanded ? 'rotate-90 text-ig-blue' : ''}`}>
           <ChevronRight size={20} strokeWidth={2} />
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
            <div className="grid grid-cols-2 gap-3 p-3 bg-bg-alt rounded-xl border border-border-ig shadow-inner">
               <div>
                 <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider mb-1">Entry Date</p>
                 <p className="text-xs font-bold">{new Date(request.dateRequested).toLocaleDateString()}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider mb-1">Target Date</p>
                 <p className="text-xs font-bold">{new Date(request.dateNeeded || request.createdAt).toLocaleDateString()}</p>
               </div>
            </div>

            {request.status === 'awaiting_payment' && (
              <button 
                onClick={() => onApprove(request.id, 'paid')}
                className="w-full bg-ig-blue text-white py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-ig-blue/20 flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-95"
              >
                <CreditCard size={18} />
                Confirm Payment
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
