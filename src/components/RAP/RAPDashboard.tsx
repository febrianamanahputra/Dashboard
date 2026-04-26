import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { FileSpreadsheet, Download, Upload, Trash2, Package, ArrowLeft, Plus, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { RAPItem, StockEntry } from '../../types';

interface RAPDashboardProps {
  onBack?: () => void;
  locationId: string;
  stock: StockEntry[];
}

export default function RAPDashboard({ onBack, locationId, stock }: RAPDashboardProps) {
  const { rapData, setRapData, addRequest } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<RAPItem | null>(null);
  const [requestQty, setRequestQty] = useState<string>('');
  const [dateNeeded, setDateNeeded] = useState<string>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRapData = rapData.filter(item => item.locationId === locationId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const items: RAPItem[] = data
        .filter(row => row.length >= 3 && row[0] && row[1] !== undefined)
        .map((row) => ({
          id: Math.random().toString(36).substring(7),
          locationId: locationId,
          materialName: String(row[0]),
          quantity: Math.floor(Number(row[1]) || 0),
          unit: row[2] ? String(row[2]) : 'pcs',
          totalOrdered: 0
        }));

      setRapData(locationId, items);
    };
    reader.readAsBinaryString(file);
  };

  const clearRAP = () => {
    if (confirm('Hapus semua data RAP untuk lokasi ini?')) {
      setRapData(locationId, []);
    }
  };

  const handleRequestEntry = (item: RAPItem) => {
    setSelectedItem(item);
    setRequestQty('');
    setDateNeeded(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  };

  const submitRequest = () => {
    if (!selectedItem || !requestQty || isSubmitting) return;
    const qty = Number(requestQty);
    if (isNaN(qty) || qty <= 0) return;

    setIsSubmitting(true);
    addRequest({
      materialName: selectedItem.materialName,
      quantity: qty,
      unit: selectedItem.unit,
      locationId: locationId,
      dateRequested: new Date().toISOString(),
      dateNeeded: dateNeeded
    });

    // Update total ordered in RAP data
    const updatedRapData = rapData.map(item => {
      if (item.id === selectedItem.id) {
        return { ...item, totalOrdered: (item.totalOrdered || 0) + qty };
      }
      return item;
    });
    setRapData(locationId, updatedRapData.filter(i => i.locationId === locationId));

    setSelectedItem(null);
    setRequestQty('');
    setIsSubmitting(false);
  };

  const getItemStock = (name: string) => {
    const found = stock.find(s => s.materialName.toLowerCase() === name.toLowerCase());
    return found ? Math.floor(found.quantity) : 0;
  };

  const calculatePercentage = () => {
    if (!selectedItem || !requestQty) return 0;
    const qty = parseFloat(requestQty);
    if (isNaN(qty) || selectedItem.quantity === 0) return 0;
    return Math.floor((qty / selectedItem.quantity) * 100);
  };

  return (
    <div className="relative min-h-[80vh] bg-white p-8 border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
      {/* Watermark Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.01] pointer-events-none select-none overflow-hidden h-full w-full flex items-center justify-center">
        <FileSpreadsheet size={600} strokeWidth={1} className="text-slate-900" />
      </div>

      <div className="relative z-10 space-y-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase text-[10px] tracking-widest"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        )}
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-6">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">RAP Lokasi</h2>
            <p className="text-slate-500 text-xs">Perencanaan material khusus untuk lokasi aktif.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx,.xls" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Upload size={14} /> Import
            </button>
            {currentRapData.length > 0 && (
              <button 
                onClick={clearRAP}
                className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex items-center gap-2"
              >
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </header>

        {currentRapData.length === 0 ? (
          <div className="bg-slate-50/30 border border-dashed border-slate-100 rounded-2xl p-16 text-center">
            <p className="font-medium text-slate-400 text-sm">Belum ada data RAP untuk lokasi ini.</p>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-2">Struktur Excel: Nama Material | Jumlah | Satuan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="py-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Material</th>
                  <th className="py-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">RAP Qty</th>
                  <th className="py-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Total</th>
                  <th className="py-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Stock</th>
                  <th className="py-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentRapData.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRequestEntry(item)}
                    className="group hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-4">
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{item.materialName}</span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className="text-sm font-bold text-slate-900">{Math.floor(item.quantity)}</span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className="text-xs font-bold text-blue-600">{Math.floor(item.totalOrdered || 0)}</span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={`text-xs font-bold ${getItemStock(item.materialName) > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                        {getItemStock(item.materialName)}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Request Material dari RAP</p>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedItem.materialName}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target RAP</p>
                    <p className="text-xl font-bold text-slate-900">{Math.floor(selectedItem.quantity)} <span className="text-xs uppercase">{selectedItem.unit}</span></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock Sekarang</p>
                    <p className="text-xl font-bold text-slate-900">{getItemStock(selectedItem.materialName)} <span className="text-xs uppercase">{selectedItem.unit}</span></p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Jumlah yang Diminta</label>
                    <input 
                      type="number"
                      value={requestQty}
                      onChange={(e) => setRequestQty(e.target.value)}
                      placeholder="Masukkan jumlah..."
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {requestQty && (
                      <div className="absolute top-10 right-4 flex items-center gap-1.5 bg-blue-600 text-white px-2 py-1 rounded-lg text-[10px] font-black">
                        {calculatePercentage()}% <span className="opacity-60">DARI RAP</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Tanggal Dibutuhkan</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-slate-100 outline-none transition-all"
                      value={dateNeeded}
                      onChange={e => setDateNeeded(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={submitRequest}
                    disabled={!requestQty || Number(requestQty) <= 0}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
                  >
                    Ajukan Permintaan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
