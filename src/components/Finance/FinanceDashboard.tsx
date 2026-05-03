import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { CreditCard, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { RequestStatus, MaterialRequest } from '../../types';

export default function FinanceDashboard() {
  const { locations = [], requests = [], updateRequestStatus } = useApp();

  // Finance only cares about requests that are 'awaiting_payment' or 'paid'
  const relevantRequests = requests.filter(r => r.status === 'awaiting_payment' || r.status === 'paid');

  const locationsWithRequests = locations.map(loc => ({
    ...loc,
    requests: relevantRequests.filter(r => r.locationId === loc.id)
  })).filter(loc => loc.requests.length > 0);

  // For debugging/safety: find requests that don't match any location
  const orphanedRequests = relevantRequests.filter(r => !locations.some(l => l.id === r.locationId));

  return (
    <div className="relative h-full flex flex-col bg-bg-base">
      <div className="relative z-10 flex flex-col h-full bg-bg-alt overflow-hidden">
        <header className="flex flex-col px-6 py-6 bg-bg-base border-b border-border-ig shrink-0 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-bg-alt border border-border-ig flex items-center justify-center">
               <CreditCard size={24} className="text-ig-black" strokeWidth={2} />
            </div>
            <div>
               <h2 className="text-lg font-bold tracking-tight">Financial Ledger</h2>
               <p className="text-ig-grey text-[11px] font-medium uppercase tracking-wider">Transaction Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 ig-card px-4 py-3 flex flex-col gap-1 border-red-100">
               <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider leading-none">Outstanding</p>
               <p className="text-xl font-bold">{relevantRequests.filter(r => r.status === 'awaiting_payment').length}</p>
            </div>

            <div className="flex-1 ig-card px-4 py-3 flex flex-col gap-1">
               <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider leading-none">Cleared</p>
               <p className="text-xl font-bold">{relevantRequests.filter(r => r.status === 'paid').length}</p>
            </div>
          </div>
        </header>

        {locationsWithRequests.length === 0 && orphanedRequests.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 rounded-full border border-border-ig flex items-center justify-center mb-6 opacity-30">
               <CheckCircle2 size={48} strokeWidth={1} />
            </div>
            <h3 className="text-lg font-bold mb-1">Ledger Balanced</h3>
            <p className="text-ig-grey text-sm">All transaction vectors verified</p>
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
                    <span className="text-[10px] font-bold text-ig-grey uppercase">
                      {loc.requests.filter(r => r.status === 'awaiting_payment').length} Pending
                    </span>
                  </div>

                  <div className="space-y-4">
                    {loc.requests.map(req => (
                      <FinanceRequestItem key={req.id} request={req} onApprove={updateRequestStatus} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {orphanedRequests.length > 0 && (
              <div className="pt-10 border-t border-border-ig">
                <h3 className="text-xs font-bold text-ig-grey uppercase tracking-widest mb-6 px-2">Unknown Origins</h3>
                <div className="space-y-4">
                  {orphanedRequests.map(req => (
                    <FinanceRequestItem 
                      key={req.id}
                      request={req} 
                      onApprove={updateRequestStatus} 
                    />
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
    <div className={`ig-card overflow-hidden transition-all ${
      request.status === 'awaiting_payment' ? 'bg-bg-base border-ig-blue/30' : 'bg-bg-alt opacity-60'
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
              {request.status === 'awaiting_payment' ? 'Menunggu Pembayaran' : 'Pembayaran Berhasil'}
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
            <div className="grid grid-cols-2 gap-3 p-3 bg-bg-alt rounded-lg border border-border-ig">
               <div>
                 <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider mb-1">Requested</p>
                 <p className="text-xs font-bold">{new Date(request.dateRequested).toLocaleDateString()}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider mb-1">Deadline</p>
                 <p className="text-xs font-bold">{new Date(request.dateNeeded).toLocaleDateString()}</p>
               </div>
            </div>

            {request.status === 'awaiting_payment' && (
              <button 
                onClick={() => onApprove(request.id, 'paid')}
                className="w-full bg-ig-blue text-white py-3 rounded-md font-bold text-sm shadow-lg shadow-ig-blue/20 flex items-center justify-center gap-3 hover:bg-blue-600 transition-colors"
              >
                <CreditCard size={16} />
                Approve Payment
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
