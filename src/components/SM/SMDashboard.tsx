import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { Plus, Package, MapPin, X, AlertTriangle, HardHat, FileSpreadsheet, CheckCircle2, Trash2, Edit2, Camera, UserCircle } from 'lucide-react';
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
    locations = [], 
    requests = [], 
    addRequest, 
    editRequest,
    deleteRequest,
    addLocation, 
    updateLocation,
    removeLocation, 
    updateRequestStatus, 
    updateStock,
    mainMaterials = []
  } = useApp();
  
  const [activeLocationId, setActiveLocationId] = useState<string | null>(locations?.[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMainRequestForm, setShowMainRequestForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaterialRequest | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showEditLocation, setShowEditLocation] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [view, setView] = useState<'main' | 'rap'>('main');
  const [activeTab, setActiveTab] = useState<'active' | 'riwayat' | 'total'>('active');
  const [receivingRequest, setReceivingRequest] = useState<MaterialRequest | null>(null);

  const activeLocation = locations.find(l => l.id === activeLocationId);
  const locationRequests = requests.filter(r => r.locationId === activeLocationId);
  
  // Tab filtered data
  const activeRequests = locationRequests.filter(r => r.status !== 'received' && r.status !== 'on_hold');
  const onHoldRequests = locationRequests.filter(r => r.status === 'on_hold');
  
  const historyRequests = locationRequests
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
    if (activeLocationId && !locations.find(l => l.id === activeLocationId)) {
      setActiveLocationId(locations?.[0]?.id || null);
    } else if (!activeLocationId && locations.length > 0) {
      setActiveLocationId(locations?.[0]?.id || null);
    }
  }, [locations, activeLocationId]);

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
        locationId={activeLocationId}
        stock={activeLocation?.stock || []}
      />
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-bg-base overflow-hidden">
      {/* Sidebar Locations */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-4 border-b border-border-ig overflow-x-auto custom-scrollbar bg-bg-base sticky top-0 z-20">
        <button 
          onClick={() => setShowAddLocation(true)}
          className="shrink-0 w-14 h-14 rounded-full border-2 border-dashed border-border-ig flex items-center justify-center text-ig-grey hover:text-ig-blue hover:border-ig-blue transition-all"
        >
          <Plus size={24} />
        </button>
        
        {locations.map(loc => (
          <button
            key={loc.id}
            onClick={() => setActiveLocationId(loc.id)}
            className="shrink-0 flex flex-col items-center gap-1 group"
          >
            <div className={`w-16 h-16 rounded-full p-0.5 border-2 transition-all ${
              activeLocationId === loc.id ? 'border-ig-blue' : 'border-transparent'
            }`}>
              <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-all ${
                activeLocationId === loc.id ? 'bg-ig-blue text-white' : 'bg-bg-alt text-ig-grey border border-border-ig'
              }`}>
                {loc.imageUrl ? (
                  <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                ) : (
                  <MapPin size={24} />
                )}
              </div>
            </div>
            <span className={`text-[10px] font-semibold tracking-tight truncate w-16 text-center ${
              activeLocationId === loc.id ? 'text-ig-black' : 'text-ig-grey'
            }`}>{loc.name}</span>
          </button>
        ))}
      </div>

      <section className="flex-1 flex flex-col overflow-hidden bg-bg-alt">
        {activeLocation ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="bg-bg-base border-b border-border-ig px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setShowEditLocation(true)}
                    className="relative group w-10 h-10 rounded-full bg-bg-alt flex items-center justify-center border border-border-ig overflow-hidden shrink-0 cursor-pointer"
                  >
                    {activeLocation.imageUrl ? (
                      <img src={activeLocation.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <HardHat size={20} className="text-ig-black" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setView('rap')}
                    className="p-2 text-ig-grey hover:text-ig-black transition-colors rounded-full hover:bg-bg-alt"
                    title="RAP"
                  >
                    <FileSpreadsheet size={20} strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-ig-black text-white px-3 py-1.5 rounded-md text-[10px] font-bold hover:opacity-90 transition-opacity uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Package size={14} />
                    <span>Material</span>
                  </button>
                  <button 
                    onClick={() => setShowMainRequestForm(true)}
                    className="bg-ig-blue text-white px-3 py-1.5 rounded-md text-[10px] font-bold hover:opacity-90 transition-opacity uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Utama</span>
                  </button>
                </div>
              </div>

              {/* Internal Inventory */}
              <div className="px-4 py-6 border-b border-border-ig flex gap-4 overflow-x-auto custom-scrollbar bg-bg-base">
                {activeLocation.stock.length > 0 ? (
                  activeLocation.stock.map((entry) => (
                    <button 
                      key={entry.id} 
                      onClick={() => {
                        setSelectedStock(entry);
                        setEditQuantity(entry.quantity.toString());
                      }}
                      className="shrink-0 ig-card px-4 py-3 min-w-[120px] flex flex-col gap-1 transition-all hover:bg-bg-alt"
                    >
                      <span className="text-[10px] font-bold text-ig-grey uppercase tracking-wider">{entry.materialName}</span>
                      <span className="text-lg font-bold">{entry.quantity} {entry.unit}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-ig-grey italic">Stok belum tersedia</div>
                )}
              </div>

              {/* Request Feed */}
              <div className="max-w-md mx-auto py-6 space-y-6 px-4">
                <div className="flex bg-white p-1 rounded-xl border border-border-ig shadow-sm mb-6">
                  {(['active', 'riwayat', 'total'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                        activeTab === tab 
                          ? 'bg-ig-black text-white shadow-md' 
                          : 'text-ig-grey hover:text-ig-black'
                      }`}
                    >
                      {tab === 'active' ? 'Request' : tab === 'riwayat' ? 'Riwayat' : 'Total Request'}
                    </button>
                  ))}
                </div>

                {activeTab === 'active' ? (
                  <>
                    {activeRequests.length === 0 && onHoldRequests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <Package size={64} strokeWidth={1} />
                        <p className="mt-4 font-medium uppercase text-[10px] tracking-widest">Tidak ada request aktif</p>
                      </div>
                    ) : (
                      [...activeRequests, ...onHoldRequests].map((req) => (
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
                              {req.pendingEdit && (
                                <span className="bg-yellow-50 text-yellow-700 border-yellow-100 px-2 py-0.5 rounded-full text-[10px] border font-bold">
                                  EDIT PENDING
                                </span>
                              )}
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
                                disabled={!!req.pendingEdit}
                                className={`p-2 rounded-md border border-border-ig text-ig-grey hover:bg-bg-alt transition-colors ${!!req.pendingEdit ? 'opacity-30' : ''}`}
                                title="Edit Request"
                              >
                                <Edit2 size={16} />
                              </button>
                              
                              <button 
                                onClick={() => {
                                  if(confirm('Batalkan permintaan ini?')) {
                                    deleteRequest(req.id);
                                  }
                                }}
                                className="p-2 rounded-md border border-border-ig text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Batalkan Request"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </>
                ) : activeTab === 'riwayat' ? (
                  <div className="space-y-3">
                    {historyRequests.length === 0 ? (
                      <div className="text-center py-20 opacity-40">
                         <FileSpreadsheet size={48} className="mx-auto mb-4" />
                         <p className="text-[10px] font-bold uppercase">Belum ada riwayat</p>
                      </div>
                    ) : (
                      historyRequests.map((req) => (
                        <div key={req.id} className="ig-card p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                               <Package size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-bold leading-tight">{req.materialName}</p>
                               <p className="text-[10px] text-ig-grey font-medium mt-0.5">
                                 Diterima: {new Date((req as any).receivedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-bold tracking-tighter leading-none">{req.quantity}</p>
                             <span className="text-[10px] text-ig-grey uppercase font-bold">{req.unit}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {totalsArray.length === 0 ? (
                      <div className="text-center py-20 opacity-40">
                         <CheckCircle2 size={48} className="mx-auto mb-4" />
                         <p className="text-[10px] font-bold uppercase">Belum ada data masuk</p>
                      </div>
                    ) : (
                      totalsArray.map((item, i) => (
                        <div key={i} className="ig-card p-5 flex items-center justify-between bg-white">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-ig-blue/5 text-ig-blue rounded-xl flex items-center justify-center border border-ig-blue/10">
                                 <Plus size={24} />
                              </div>
                              <div>
                                 <p className="text-sm font-bold uppercase">{item.materialName}</p>
                                 <p className="text-[10px] font-bold text-ig-grey uppercase tracking-widest mt-1">Total Akumulasi</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-bold tracking-tighter text-ig-blue">{item.quantity}</p>
                              <p className="text-[10px] font-bold text-ig-grey uppercase">{item.unit}</p>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
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

      {/* Modals */}
      {(showAddForm || editingRequest) && activeLocationId && (
        <RequestFormModal 
          onClose={() => {
            setShowAddForm(false);
            setEditingRequest(null);
          }} 
          locationId={activeLocationId}
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

      {showMainRequestForm && activeLocationId && (
        <MainRequestFormModal 
          onClose={() => setShowMainRequestForm(false)}
          locationId={activeLocationId}
          materials={mainMaterials}
          onSubmit={(data) => {
            addRequest(data);
            setShowMainRequestForm(false);
          }}
        />
      )}

      {showAddLocation && (
        <LocationFormModal 
          onClose={() => setShowAddLocation(false)}
          onSubmit={(name) => {
            addLocation(name);
            setShowAddLocation(false);
          }}
        />
      )}

      <AnimatePresence>
        {showEditLocation && activeLocation && (
          <EditLocationModal 
            location={activeLocation}
            onClose={() => setShowEditLocation(false)}
            onUpdate={(name, img) => {
              updateLocation(activeLocation.id, name, img);
              setShowEditLocation(false);
            }}
            onDelete={() => {
              setShowEditLocation(false);
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
                    if (activeLocationId && selectedStock) {
                      updateStock(activeLocationId, selectedStock.id, parseFloat(editQuantity) || 0);
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
        {showDeleteConfirm && activeLocation && (
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
              <h3 className="text-lg font-bold mb-2">Delete Location</h3>
              <p className="text-ig-grey text-xs mb-8">
                Are you sure you want to delete <span className="font-bold text-ig-black">{activeLocation.name}</span>? This action cannot be undone.
              </p>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    removeLocation(activeLocation.id);
                    setActiveLocationId(null);
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

function RequestFormModal({ onClose, locationId, onSubmit, initialData, isEdit, status }: { 
  onClose: () => void; 
  locationId: string;
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
    locationId
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

function MainRequestFormModal({ onClose, locationId, materials = [], onSubmit }: { 
  onClose: () => void; 
  locationId: string;
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
            locationId
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

function EditLocationModal({ location, onClose, onUpdate, onDelete }: { 
  location: any; 
  onClose: () => void; 
  onUpdate: (name: string, image: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(location.name);
  const [imageUrl, setImageUrl] = useState(location.imageUrl || '');
  const [showAvatars, setShowAvatars] = useState(false);

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl border border-border-ig flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-bold">Pengaturan Lokasi</h3>
          <button onClick={onClose} className="text-ig-grey">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
             <div className="w-24 h-24 rounded-full border-2 border-ig-blue p-1">
                <div className="w-full h-full rounded-full bg-bg-alt border border-border-ig flex items-center justify-center overflow-hidden">
                   {imageUrl ? (
                     <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <UserCircle size={48} className="text-ig-grey" />
                   )}
                </div>
             </div>
             <button 
              onClick={() => setShowAvatars(!showAvatars)}
              className="text-xs font-bold text-ig-blue"
             >
                Pilih Avatar Rumah
             </button>
          </div>

          {showAvatars && (
            <div className="grid grid-cols-3 gap-3 p-4 bg-bg-alt rounded-xl border border-border-ig animate-in fade-in zoom-in duration-200">
               {FUNNY_AVATARS.map(avatar => (
                 <button 
                  key={avatar} 
                  onClick={() => {
                    setImageUrl(avatar);
                    setShowAvatars(false);
                  }}
                  className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${imageUrl === avatar ? 'border-ig-blue scale-110' : 'border-transparent'}`}
                 >
                   <img src={avatar} alt="" className="w-full h-full object-cover" />
                 </button>
               ))}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Nama Lokasi</label>
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
              onClick={() => onUpdate(name, imageUrl)}
              className="w-full bg-ig-blue text-white py-3 rounded-md font-bold text-[14px]"
            >
              Simpan Perubahan
            </button>
            <button 
              onClick={onDelete}
              className="w-full py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-md flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Hapus Lokasi
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LocationFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string) => void }) {
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
              <h3 className="text-base font-bold">Lokasi Baru</h3>
              <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider">Node Proyek</p>
           </div>
        </div>
        <div className="space-y-1 mb-8">
          <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Nama Lokasi</label>
          <input 
            autoFocus
            required
            disabled={isSubmitting}
            type="text" 
            placeholder="Contoh: SEKTOR A"
            className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-base font-bold focus:ring-1 focus:ring-ig-blue outline-none placeholder:text-gray-400"
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
            {isSubmitting ? 'Menyimpan...' : 'Tambah Lokasi'}
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
