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
    <div className="relative h-full flex flex-col bg-bg-alt overflow-hidden">
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between shrink-0 p-4 bg-bg-base border-b border-border-ig">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 text-ig-black hover:bg-bg-alt rounded-full transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={2} />
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
              className="text-ig-blue font-bold text-xs p-2"
            >
              Import
            </button>
            {currentRapData.length > 0 && (
              <button 
                onClick={clearRAP}
                className="text-red-500 font-bold text-xs p-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <header className="flex flex-col px-6 py-8 bg-bg-base border-b border-border-ig shrink-0 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-bg-alt border border-border-ig flex items-center justify-center">
               <FileSpreadsheet size={24} className="text-ig-black" strokeWidth={2} />
            </div>
            <div>
               <h2 className="text-lg font-bold tracking-tight">RAP Master</h2>
               <p className="text-ig-grey text-[11px] font-medium uppercase tracking-wider">Sector Resource Planning</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="ig-card px-4 py-2 flex flex-col gap-0.5">
                <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider leading-none">Data Points</p>
                <p className="text-base font-bold">{currentRapData.length}</p>
             </div>
          </div>
        </header>

        {currentRapData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-bg-base">
            <div className="w-20 h-20 rounded-full border border-border-ig flex items-center justify-center mb-6 opacity-30">
               <FileSpreadsheet size={40} strokeWidth={1} />
            </div>
            <h3 className="text-lg font-bold mb-1">No Vectors Defined</h3>
            <p className="text-ig-grey text-sm mb-8">Import your spreadsheet to begin planning</p>
            <div className="flex gap-2 text-[10px] font-bold text-ig-blue uppercase tracking-widest bg-bg-alt px-6 py-2 rounded-full border border-border-ig">
               <span>Material</span>
               <span className="opacity-30">•</span>
               <span>Quantity</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden bg-bg-alt flex flex-col">
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-bg-base z-20 border-b border-border-ig shadow-sm">
                  <tr>
                    <th className="py-4 px-6 text-[10px] font-bold text-ig-grey uppercase tracking-wider">Protocol</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-ig-grey uppercase tracking-wider text-center">Alloc</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-ig-grey uppercase tracking-wider text-center">Ord</th>
                    <th className="py-4 px-4 text-[10px] font-bold text-ig-grey uppercase tracking-wider text-center">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-ig">
                  {currentRapData.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => handleRequestEntry(item)}
                      className="group bg-bg-base hover:bg-bg-alt cursor-pointer transition-colors active:opacity-60"
                    >
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-ig-black uppercase tracking-tight">{item.materialName}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-medium text-ig-grey">{Math.floor(item.quantity)}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold text-ig-blue">{Math.floor(item.totalOrdered || 0)}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-xs font-bold ${getItemStock(item.materialName) > 0 ? 'text-green-600' : 'text-ig-grey italic opacity-30'}`}>
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
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-bg-base w-full max-w-sm rounded-[24px] p-8 shadow-2xl relative border border-border-ig flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-base font-bold">Request Deployment</h3>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-ig-grey"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-ig-blue text-white rounded-full flex items-center justify-center ">
                     <Plus size={24} strokeWidth={3} />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-ig-blue uppercase tracking-wider">Protocol Entry</p>
                     <h3 className="text-sm font-bold truncate max-w-[200px] uppercase">{selectedItem.materialName}</h3>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-bg-alt rounded-xl border border-border-ig">
                    <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider mb-1">RAP Target</p>
                    <p className="text-lg font-bold">{Math.floor(selectedItem.quantity)} <span className="text-[10px] text-ig-grey uppercase">{selectedItem.unit}</span></p>
                  </div>
                  <div className="p-4 bg-bg-alt rounded-xl border border-border-ig">
                    <p className="text-[10px] font-bold text-ig-grey uppercase tracking-wider mb-1">In Stock</p>
                    <p className="text-lg font-bold">{getItemStock(selectedItem.materialName)} <span className="text-[10px] text-ig-grey uppercase">{selectedItem.unit}</span></p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Quantity to Deploy</label>
                    <div className="relative">
                       <input 
                        type="number"
                        value={requestQty}
                        onChange={(e) => setRequestQty(e.target.value)}
                        placeholder="0"
                        className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-lg font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                        autoFocus
                      />
                      {requestQty && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-ig-blue text-white px-2 py-0.5 rounded text-[10px] font-bold">
                          {calculatePercentage()}%
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-ig-grey uppercase tracking-wider ml-1">Deadline Date</label>
                     <input 
                      type="date" 
                      className="w-full bg-bg-alt border border-border-ig rounded-md px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-ig-blue outline-none"
                      value={dateNeeded}
                      onChange={e => setDateNeeded(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={submitRequest}
                    disabled={!requestQty || Number(requestQty) <= 0 || isSubmitting}
                    className="w-full mt-4 bg-ig-blue text-white py-4 rounded-md font-bold text-sm shadow-lg shadow-ig-blue/20 disabled:opacity-30 transition-all active:scale-95"
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
