import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { Plus, Package, MapPin, Calendar, Clock, Trash2, X, AlertTriangle, HardHat, FileSpreadsheet, ArrowLeft, Download, CheckCircle2 } from 'lucide-react';
import { StockEntry, MaterialRequest } from '../../types';
import RAPDashboard from '../RAP/RAPDashboard';
import * as XLSX from 'xlsx';

const UNITS = ['zak', 'ret', 'dus', 'Pcs', 'galon', 'm2', 'm3', 'Liter', 'Roll', 'Lembar', 'Kaleng', 'Dll'];
const RECIPIENTS = ['Site Manager', 'Mandor', 'Tukang'];
const DELIVERERS = ['Kurir', 'SCM', 'Toko', 'Pick Up'];

export default function SMDashboard() {
  const { locations, requests, addRequest, addLocation, removeLocation, updateRequestStatus, updateStock } = useApp();
  const [activeLocationId, setActiveLocationId] = useState<string | null>(locations[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [view, setView] = useState<'main' | 'rap'>('main');
  const [showHistory, setShowHistory] = useState(false);
  const [receivingRequest, setReceivingRequest] = useState<MaterialRequest | null>(null);

  const activeLocation = locations.find(l => l.id === activeLocationId);
  const locationRequests = requests.filter(r => r.locationId === activeLocationId);
  const filteredRequests = showHistory 
    ? locationRequests 
    : locationRequests.filter(r => r.status !== 'received' && r.status !== 'on_hold');
  const onHoldRequests = locationRequests.filter(r => r.status === 'on_hold');

  const downloadRequests = () => {
    if (!activeLocation) return;
    
    const data = locationRequests.map((req, index) => ({
      'No': index + 1,
      'Tanggal Request': new Date(req.dateRequested).toLocaleDateString(),
      'Nama Barang': req.materialName,
      'Jumlah': req.quantity,
      'Satuan': req.unit.toUpperCase(),
      'Tanggal Diperlukan': new Date(req.dateNeeded).toLocaleDateString(),
      'Tanggal Sampai': req.status === 'received' ? new Date(req.history.find(h => h.status === 'received')?.timestamp || Date.now()).toLocaleDateString() : '-',
      'Penerima': req.recipient || '-',
      'Pengantar': req.deliverer || '-',
      'Status': req.status.toUpperCase()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Request History");
    XLSX.writeFile(wb, `Material_Requests_${activeLocation.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Sync activeLocationId if locations change and current one is invalid
  React.useEffect(() => {
    if (activeLocationId && !locations.find(l => l.id === activeLocationId)) {
      setActiveLocationId(locations[0]?.id || null);
    } else if (!activeLocationId && locations.length > 0) {
      setActiveLocationId(locations[0].id);
    }
  }, [locations, activeLocationId]);

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'pending': return 'Antrian';
      case 'processing': return 'Diproses';
      case 'awaiting_payment': return 'Menunggu Bayar';
      case 'paid': return 'Sudah Dibayar';
      case 'delivered': return 'Diantarkan';
      case 'received': return 'Diterima';
      case 'on_hold': return 'HOLD / INDENT';
      default: return s;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600';
      case 'on_hold': return 'bg-rose-50 text-rose-600';
      case 'pending': return 'bg-slate-50 text-slate-400';
      case 'paid': return 'bg-indigo-50 text-indigo-600';
      default: return 'bg-blue-50 text-blue-600';
    }
  };

  return (
    <div className="relative min-h-[80vh] bg-white p-4 md:p-12 border border-slate-100 shadow-sm rounded-[32px] md:rounded-3xl">
      {/* Subtle Background Accents */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-slate-50/50 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Locations */}
        <aside className="lg:col-span-3 space-y-6 lg:space-y-8">
          <div className="flex items-center justify-between group px-1">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daftar Lokasi</h3>
              <p className="text-xs text-slate-500">Proyek Aktif</p>
            </div>
            <button 
              onClick={() => setShowAddLocation(true)}
              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide px-1">
            {locations.map(loc => (
              <button
                key={loc.id}
                onClick={() => setActiveLocationId(loc.id)}
                className={`flex-shrink-0 lg:w-full text-left px-5 py-4 rounded-xl transition-all border-2 flex items-center justify-between group min-w-[160px] lg:min-w-0 ${
                  activeLocationId === loc.id 
                    ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-600/20 text-white' 
                    : 'bg-white border-slate-50 text-slate-400 hover:border-blue-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <MapPin size={18} className={activeLocationId === loc.id ? 'text-blue-200' : 'text-slate-200'} />
                  <span className="text-sm font-semibold tracking-tight whitespace-nowrap">{loc.name}</span>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full hidden lg:block ${activeLocationId === loc.id ? 'bg-white' : 'bg-transparent'}`} />
              </button>
            ))}
          </div>

          <div className="pt-6 lg:pt-8 border-t border-slate-100 space-y-6">
            <div className="px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ringkasan Stok</h3>
              <p className="text-xs text-slate-500">Material Tersedia</p>
            </div>
            {activeLocation ? (
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide px-1">
                {activeLocation.stock.length > 0 ? (
                  activeLocation.stock.map((entry, idx) => (
                    <motion.button 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      key={entry.id} 
                      onClick={() => {
                        setSelectedStock(entry);
                        setEditQuantity(entry.quantity.toString());
                      }}
                      className="flex-shrink-0 lg:w-full text-left bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-slate-200 transition-all min-w-[200px] lg:min-w-0"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">{entry.materialName}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 group-hover:animate-ping" />
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Status: Tersedia</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold bg-white px-2.5 py-1.5 rounded-lg text-slate-600 border border-slate-100 uppercase ml-2 shadow-sm">
                        {entry.quantity} {entry.unit.toUpperCase()}
                      </span>
                    </motion.button>
                  ))
                ) : (
                  <p className="w-full text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">Gudang kosong.</p>
                )}
              </div>
            ) : null}
          </div>
        </aside>

        {/* Main Content */}
        <section className="lg:col-span-9 space-y-12">
          {view === 'rap' ? (
            <RAPDashboard 
              onBack={() => setView('main')} 
              locationId={activeLocationId}
              stock={activeLocation?.stock || []}
            />
          ) : activeLocation ? (
            <>
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{activeLocation.name}</h2>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-slate-500 text-sm font-normal">Manajemen logistik dan stok material konstruksi.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={downloadRequests}
                    className="flex-1 md:flex-none justify-center bg-slate-100 text-slate-600 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-slate-200 transition-all flex items-center gap-2 shadow-sm"
                    title="Download Spreadsheet"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => setView('rap')}
                    className="flex-1 md:flex-none justify-center bg-slate-100 text-slate-600 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-slate-200 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <FileSpreadsheet size={18} /> <span className="whitespace-nowrap">Daftar RAP</span>
                  </button>
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="flex-1 md:flex-none justify-center bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Plus size={18} /> <span className="whitespace-nowrap">Order Material</span>
                  </button>
                </div>
              </header>

              {/* In Progress Area */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setShowHistory(false)}
                      className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${!showHistory ? 'text-slate-900 border-b-2 border-slate-900 pb-1' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Aktifitas Sekarang
                    </button>
                    <button 
                      onClick={() => setShowHistory(true)}
                      className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${showHistory ? 'text-slate-900 border-b-2 border-slate-900 pb-1' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Riwayat Permintaan
                    </button>
                  </div>
                  <div className="h-px flex-1 bg-slate-50 mx-6" />
                </div>

                {filteredRequests.length === 0 && onHoldRequests.length === 0 ? (
                  <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-24 text-center">
                    <Package size={64} strokeWidth={1} className="mx-auto text-slate-200 mb-6" />
                    <p className="text-slate-400 text-lg font-light italic">
                      {showHistory ? 'Belum ada riwayat permintaan.' : 'Belum ada pengiriman aktif.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Prepend on-hold if not in history view or just show everything in history view */}
                    {(showHistory ? filteredRequests : [...filteredRequests, ...onHoldRequests]).map(req => (
                      <div key={req.id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md mb-3 inline-block ${getStatusColor(req.status)}`}>
                              {getStatusLabel(req.status)}
                            </span>
                            <h4 className="text-xl font-bold text-slate-800 tracking-tight mb-1">{req.materialName}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Package size={12} className="text-slate-300" />
                              <span>{req.quantity} {req.unit.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl mb-6">
                          <div className="space-y-0.5">
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">Tanggal Request</p>
                            <p className="text-xs font-medium text-slate-600">{new Date(req.dateRequested).toLocaleDateString()}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">Target Kedatangan</p>
                            <p className="text-xs font-bold text-slate-900">{new Date(req.dateNeeded).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {req.status === 'delivered' && (
                          <button 
                            onClick={() => setReceivingRequest(req)}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
                          >
                            Konfirmasi Terima Barang
                          </button>
                        )}
                        {req.status === 'on_hold' && (
                          <div className="w-full bg-rose-50 text-rose-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-rose-100 italic">
                            Sedang Dalam Tahap Indent
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-8">
               <div className="relative">
                 <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />
                 <MapPin size={120} strokeWidth={0.5} className="text-blue-100 relative" />
               </div>
               <div>
                  <h3 className="text-3xl font-black text-slate-300 tracking-tighter italic">RENOVKI SM</h3>
                  <p className="text-slate-400 font-medium italic mt-2">Pilih atau buat lokasi proyek untuk mulai mengelola material.</p>
               </div>
            </div>
          )}
        </section>
      </div>

      {/* Add Request Modal */}
      {showAddForm && activeLocationId && (
        <RequestFormModal 
          onClose={() => setShowAddForm(false)} 
          locationId={activeLocationId}
          onSubmit={addRequest}
        />
      )}

      {/* Add Location Modal */}
      {showAddLocation && (
        <LocationFormModal 
          onClose={() => setShowAddLocation(false)}
          onSubmit={(name) => {
            addLocation(name);
            setShowAddLocation(false);
          }}
        />
      )}

      {/* Receiving Modal */}
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

      {/* Stock Detail Popup */}
      <AnimatePresence>
        {selectedStock && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedStock(null)}
                className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full text-slate-300 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-light text-slate-800">Detail Stok</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Informasi Inventaris</p>
                </div>
              </div>

              <div className="space-y-6">
                <DetailRow label="Nama Material" value={selectedStock.materialName} />
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Edit Jumlah Stok</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-100 outline-none transition-all"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                    />
                    <span className="text-xs font-bold text-slate-500 uppercase">{selectedStock.unit}</span>
                  </div>
                </div>
                <DetailRow label="Diterima Pada" value={new Date(selectedStock.dateReceived).toLocaleString()} />
              </div>

              <div className="flex gap-3 mt-10">
                <button 
                  onClick={() => setSelectedStock(null)}
                  className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Tutup
                </button>
                <button 
                  onClick={() => {
                    if (activeLocationId && selectedStock) {
                      updateStock(activeLocationId, selectedStock.id, parseFloat(editQuantity) || 0);
                      setSelectedStock(null);
                    }
                  }}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Location Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && activeLocation && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl"
            >
              <div className="p-5 bg-rose-50 text-rose-500 w-fit rounded-3xl mb-6 mx-auto shadow-sm">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-light text-slate-800 text-center mb-2">Hapus Lokasi?</h3>
              <p className="text-slate-400 text-sm text-center mb-10 px-4 leading-relaxed">
                Anda yakin ingin menghapus <span className="font-bold text-slate-600 underline decoration-rose-200 decoration-2">{activeLocation.name}</span>? 
                Seluruh data material terkait akan ikut terhapus.
              </p>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    removeLocation(activeLocation.id);
                    setActiveLocationId(null);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 bg-rose-500 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10 active:scale-95"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{label}</span>
      <span className="text-base font-medium text-slate-800">{value}</span>
    </div>
  );
}

function RequestFormModal({ onClose, locationId, onSubmit }: { 
  onClose: () => void; 
  locationId: string;
  onSubmit: (req: any) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    materialName: '',
    quantity: 1,
    unit: 'zak',
    dateRequested: new Date().toISOString().split('T')[0],
    dateNeeded: '',
    locationId
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl my-auto"
      >
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-light text-slate-800">Request Material</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-300 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (isSubmitting) return;
          setIsSubmitting(true);
          onSubmit(form);
          onClose();
        }} className="space-y-4 md:space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Nama Material</label>
            <input 
              required
              disabled={isSubmitting}
              type="text" 
              placeholder="Contoh: Semen Gresik"
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300 disabled:opacity-50"
              value={form.materialName}
              onChange={e => setForm({...form, materialName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Jumlah</label>
              <input 
                required
                disabled={isSubmitting}
                type="number" 
                min="1"
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-100 outline-none transition-all disabled:opacity-50"
                value={form.quantity}
                onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Satuan</label>
              <select 
                disabled={isSubmitting}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-100 outline-none transition-all cursor-pointer disabled:opacity-50"
                value={form.unit}
                onChange={e => setForm({...form, unit: e.target.value})}
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Tanggal Dibutuhkan</label>
            <input 
              required
              disabled={isSubmitting}
              type="date" 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-100 outline-none transition-all disabled:opacity-50"
              value={form.dateNeeded}
              onChange={e => setForm({...form, dateNeeded: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 mt-4 md:mt-8 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function LocationFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-[32px] md:rounded-[40px] p-8 md:p-10 shadow-2xl"
      >
        <h3 className="text-xl md:text-2xl font-light text-slate-800 mb-6 md:mb-8">Tambah Lokasi Baru</h3>
        <input 
          autoFocus
          required
          disabled={isSubmitting}
          type="text" 
          placeholder="Nama Lokasi..."
          className="w-full bg-slate-50 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-100 outline-none transition-all mb-6 md:mb-8 placeholder:text-slate-300 disabled:opacity-50"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="flex gap-4">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            disabled={!name || isSubmitting}
            onClick={() => {
              setIsSubmitting(true);
              onSubmit(name);
            }}
            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? '...' : 'Buat'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReceiveOrderModal({ onClose, request, onConfirm }: { 
  onClose: () => void; 
  request: MaterialRequest;
  onConfirm: (extra: { recipient: string; deliverer: string }) => void;
}) {
  const [recipient, setRecipient] = useState(RECIPIENTS[0]);
  const [deliverer, setDeliverer] = useState(DELIVERERS[0]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
             <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Terima Barang</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mt-1">Konfirmasi Kedatangan</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-1">Material</p>
            <p className="text-sm font-bold text-slate-800">{request.materialName}</p>
            <p className="text-xs text-slate-500 mt-1">{request.quantity} {request.unit.toUpperCase()}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Penerima di Site</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-100 outline-none transition-all cursor-pointer"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              >
                {RECIPIENTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Pengantar / Ekspedisi</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-100 outline-none transition-all cursor-pointer"
                value={deliverer}
                onChange={e => setDeliverer(e.target.value)}
              >
                {DELIVERERS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Batal
            </button>
            <button 
              onClick={() => onConfirm({ recipient, deliverer })}
              className="flex-1 bg-slate-900 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              Terima
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
