import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../AppContext';
import { FileSpreadsheet, Download, Upload, Trash2, Package, ArrowLeft, Plus, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { RAPItem, StockEntry } from '../../types';

interface RAPDashboardProps {
  onBack?: () => void;
  subId: string;
  stock: StockEntry[];
}

export default function RAPDashboard({ onBack, subId, stock }: RAPDashboardProps) {
  const { rapData, setRapData, addRequest } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<RAPItem | null>(null);
  const [requestQty, setRequestQty] = useState<string>('');
  const [dateNeeded, setDateNeeded] = useState<string>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRapData = rapData.filter(item => item.locationId === subId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki sheet yang valid.');
      }
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const items: RAPItem[] = data
        .filter(row => row.length >= 3 && row[0] && row[1] !== undefined)
        .map((row) => ({
          id: Math.random().toString(36).substring(7),
          locationId: subId,
          materialName: String(row[0]),
          quantity: Math.floor(Number(row[1]) || 0),
          unit: row[2] ? String(row[2]) : 'pcs',
          totalOrdered: 0
        }));

      setRapData(subId, items);
    };
    reader.readAsBinaryString(file);
  };

  const clearRAP = () => {
    if (confirm('Hapus semua data RAP untuk lokasi ini?')) {
      setRapData(subId, []);
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
      subId: subId,
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
    setRapData(subId, updatedRapData.filter(i => i.locationId === subId));

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
    <div className="relative h-full flex flex-col bg-transparent overflow-hidden">
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between shrink-0 p-4 bg-white/10 backdrop-blur-md border-b border-white/10">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
          )}

          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx,.xls" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-white font-black text-[10px] uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-xl border border-white/20"
            >
              Import
            </button>
            {currentRapData.length > 0 && (
              <button 
                onClick={clearRAP}
                className="text-red-400 font-black text-[10px] uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/5"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <header className="flex flex-col px-6 py-8 bg-white/5 border-b border-white/5 shrink-0 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
               <FileSpreadsheet size={24} className="text-white" strokeWidth={2} />
            </div>
            <div>
               <h2 className="text-lg font-black tracking-tight text-white uppercase">RAP Master</h2>
               <p className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none mt-1">Sector Resource Planning</p>
            </div>
          </div>
        </header>

        {currentRapData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-transparent">
            <div className="w-20 h-20 rounded-3xl border border-white/10 flex items-center justify-center mb-6 opacity-30 text-white">
               <FileSpreadsheet size={40} strokeWidth={1} />
            </div>
            <h3 className="text-lg font-black mb-1 text-white uppercase">No Vectors Defined</h3>
            <p className="text-white/40 text-[11px] mb-8 font-medium">Import your spreadsheet to begin planning</p>
            <div className="flex gap-2 text-[9px] font-black text-white uppercase tracking-widest bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
               <span>Material</span>
               <span className="opacity-30">•</span>
               <span>Quantity</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden bg-transparent flex flex-col">
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/10 backdrop-blur-xl z-20 border-b border-white/10 shadow-xl">
                  <tr>
                    <th className="py-4 px-6 text-[9px] font-black text-white/40 uppercase tracking-widest">Protocol</th>
                    <th className="py-4 px-4 text-[9px] font-black text-white/40 uppercase tracking-widest text-center">Alloc</th>
                    <th className="py-4 px-4 text-[9px] font-black text-white/40 uppercase tracking-widest text-center">Ord</th>
                    <th className="py-4 px-4 text-[9px] font-black text-white/40 uppercase tracking-widest text-center">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentRapData.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => handleRequestEntry(item)}
                      className="group bg-transparent hover:bg-white/5 cursor-pointer transition-all active:opacity-60"
                    >
                      <td className="py-4 px-6">
                        <span className="text-xs font-black text-white uppercase tracking-tight">{item.materialName}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[11px] font-black text-white/40">{Math.floor(item.quantity)}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[11px] font-black text-white">{Math.floor(item.totalOrdered || 0)}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-[11px] font-black ${getItemStock(item.materialName) > 0 ? 'text-green-400' : 'text-white/20 italic'}`}>
                          {getItemStock(item.materialName)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-white/20 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-base font-black text-white uppercase">Request Deployment</h3>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 border border-white/20 text-white rounded-2xl flex items-center justify-center shadow-xl">
                     <Plus size={24} strokeWidth={4} />
                   </div>
                   <div>
                     <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Protocol Entry</p>
                     <h3 className="text-sm font-black text-white truncate max-w-[200px] uppercase leading-none">{selectedItem.materialName}</h3>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                     <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Alokasi</p>
                     <p className="text-sm font-black text-white uppercase italic">{selectedItem.quantity} <span className="text-[9px] text-white/40 font-black">{selectedItem.unit}</span></p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                     <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Stock Tersedia</p>
                     <p className="text-sm font-black text-white uppercase italic">{getItemStock(selectedItem.materialName)} <span className="text-[9px] text-white/40 font-black">{selectedItem.unit}</span></p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Jumlah Request Baru</label>
                    <div className="relative">
                       <input 
                        type="number"
                        value={requestQty}
                        onChange={(e) => setRequestQty(e.target.value)}
                        placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none focus:bg-white/10 transition-all"
                        autoFocus
                      />
                      {requestQty && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-ig-blue px-2 py-0.5 rounded-lg text-[9px] font-black">
                          {calculatePercentage()}%
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                     <label className="text-[9px] font-black text-white/50 uppercase tracking-widest ml-1">Target Kedatangan</label>
                     <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-black text-white outline-none focus:bg-white/10 transition-all color-scheme-dark"
                      value={dateNeeded}
                      onChange={e => setDateNeeded(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={submitRequest}
                    disabled={!requestQty || Number(requestQty) <= 0 || isSubmitting}
                    className="w-full mt-4 bg-white text-ig-blue py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
                  >
                    {isSubmitting ? 'Calibrating...' : 'Deploy Request'}
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
