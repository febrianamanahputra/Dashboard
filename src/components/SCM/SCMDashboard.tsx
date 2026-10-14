import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Edit3, 
  MessageCircle, 
  Check, 
  Copy, 
  Store, 
  User, 
  Phone, 
  MapPin, 
  Package, 
  Building2, 
  X, 
  Plus, 
  Trash2, 
  History, 
  RotateCcw,
  Tag,
  CheckCircle2,
  FolderPlus,
  Layers
} from 'lucide-react';

export interface BankAccount {
  id: string;
  bank: string;
  noRekening: string;
}

export interface VendorCard {
  id: string;
  nama: string; // Penerima A/N
  nomorHp: string;
  namaToko: string;
  kategori: string;
  bankAccounts: BankAccount[];
}

interface ReportHistory {
  id: string;
  timestamp: string;
  item: string;
  lokasi: string;
  vendorNama: string;
  bankAccounts: BankAccount[];
  namaToko: string;
}

const DEFAULT_CATEGORIES = [
  'Material Pokok',
  'Bahan Bangunan',
  'Besi & Baja',
  'Cat & Finishing'
];

const DEFAULT_CARDS: VendorCard[] = [
  {
    id: '1',
    nama: 'Rusnawati',
    nomorHp: '08111949322',
    namaToko: 'TB Rusnawati Jaya',
    kategori: 'Material Pokok',
    bankAccounts: [
      { id: 'b1', bank: 'BRI', noRekening: '707301021739533' },
      { id: 'b2', bank: 'BCA', noRekening: '8690123456' }
    ]
  },
  {
    id: '2',
    nama: 'H. Rusli',
    nomorHp: '081298765432',
    namaToko: 'Pusat Pasir & Batu Alam',
    kategori: 'Material Pokok',
    bankAccounts: [
      { id: 'b1', bank: 'BCA', noRekening: '8690123456' }
    ]
  },
  {
    id: '3',
    nama: 'Budi Santoso',
    nomorHp: '081387654321',
    namaToko: 'Depo Semen & Besi Mandiri',
    kategori: 'Besi & Baja',
    bankAccounts: [
      { id: 'b1', bank: 'Mandiri', noRekening: '1370019827364' }
    ]
  }
];

const POPULAR_BANKS = ['BRI', 'BCA', 'Mandiri', 'BNI', 'BSI', 'CIMB'];

export default function SCMDashboard() {
  // 1. Categories State (Stored in localStorage)
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('scm_vendor_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
    return DEFAULT_CATEGORIES;
  });

  // 2. Cards State (Stored in localStorage, with backward compatibility)
  const [cards, setCards] = useState<VendorCard[]>(() => {
    try {
      const saved = localStorage.getItem('scm_vendor_cards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize older card formats if they had single bank/noRekening
          return parsed.map((card: any, idx: number) => {
            const bankAccounts = Array.isArray(card.bankAccounts) && card.bankAccounts.length > 0
              ? card.bankAccounts
              : [{ id: 'b_' + idx, bank: card.bank || 'BRI', noRekening: card.noRekening || '707301021739533' }];
            return {
              id: card.id || String(Date.now() + idx),
              nama: card.nama || 'Nama Penerima',
              nomorHp: card.nomorHp || '',
              namaToko: card.namaToko || 'Toko Vendor',
              kategori: card.kategori || DEFAULT_CATEGORIES[0],
              bankAccounts
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load vendor cards', e);
    }
    return DEFAULT_CARDS;
  });

  const [activeCardId, setActiveCardId] = useState<string>(() => {
    return cards[0]?.id || '1';
  });

  const currentCard = cards.find(c => c.id === activeCardId) || cards[0] || DEFAULT_CARDS[0];

  // 3. Detail Pembayaran Inputs (Lokasi & Item)
  const [lokasi, setLokasi] = useState('Workshop');
  const [item, setItem] = useState('Pasir');

  // 4. Modals & UI Controls
  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Semua');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCardData, setEditCardData] = useState<VendorCard>(currentCard);
  const [isCreatingNewCard, setIsCreatingNewCard] = useState(false);

  const [copied, setCopied] = useState(false);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // 5. Reporting History
  const [history, setHistory] = useState<ReportHistory[]>(() => {
    try {
      const saved = localStorage.getItem('scm_report_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load history', e);
    }
    return [];
  });

  // Persist Categories
  useEffect(() => {
    try {
      localStorage.setItem('scm_vendor_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }, [categories]);

  // Persist Cards
  useEffect(() => {
    try {
      localStorage.setItem('scm_vendor_cards', JSON.stringify(cards));
    } catch (e) {
      console.error('Failed to save cards', e);
    }
  }, [cards]);

  // Persist History
  useEffect(() => {
    try {
      localStorage.setItem('scm_report_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  // Primary Bank Account for the Card Display (only 1 displayed on card)
  const primaryBank = currentCard.bankAccounts?.[0] || {
    id: 'b1',
    bank: 'BRI',
    noRekening: '707301021739533'
  };

  // Generate WhatsApp message caption including ALL entered banks
  const buildWaCaption = (
    c: VendorCard = currentCard, 
    loc: string = lokasi, 
    itm: string = item
  ) => {
    const accounts = c.bankAccounts && c.bankAccounts.length > 0 
      ? c.bankAccounts 
      : [{ id: 'b1', bank: 'BRI', noRekening: '707301021739533' }];

    let bankLines = '';
    if (accounts.length === 1) {
      bankLines = `No Rekening : ${accounts[0].noRekening || '-'}\nBank : ${accounts[0].bank || '-'}`;
    } else {
      bankLines = accounts.map((acc, idx) => {
        const suffix = idx === 0 ? '' : ` ${idx + 1}`;
        return `No Rekening${suffix} : ${acc.noRekening || '-'}\nBank${suffix} : ${acc.bank || '-'}`;
      }).join('\n');
    }

    return `Bismillah @08111949322

- Nota Pembayaran
${bankLines}
Penerima A/N : ${c.nama || '-'}
Item Pembelian : ${itm || '-'}
Lokasi :${loc || '-'}`;
  };

  const currentWaMessage = buildWaCaption();

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(currentWaMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRekening = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(primaryBank.noRekening);
    setCopiedRekening(true);
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  // Direct to WhatsApp without target number (allows user to select recipient in WA)
  const handleDirectWa = () => {
    // Record into history
    const newEntry: ReportHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      item,
      lokasi,
      vendorNama: currentCard.nama,
      bankAccounts: currentCard.bankAccounts,
      namaToko: currentCard.namaToko
    };
    setHistory(prev => [newEntry, ...prev.slice(0, 19)]);

    // Construct WA universal share link without specific phone number
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(currentWaMessage)}`;
    
    const win = window.open(waUrl, '_blank');
    if (!win) {
      window.location.href = waUrl;
    }
  };

  // Categories helper
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
      setSelectedCategoryFilter(trimmed);
    }
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (categories.length <= 1) return;
    setCategories(prev => prev.filter(c => c !== catToDelete));
    if (selectedCategoryFilter === catToDelete) {
      setSelectedCategoryFilter('Semua');
    }
  };

  // Card selector helpers
  const filteredCards = selectedCategoryFilter === 'Semua'
    ? cards
    : cards.filter(c => c.kategori === selectedCategoryFilter);

  const handleDeleteCard = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cards.length <= 1) return;
    const remaining = cards.filter(c => c.id !== cardId);
    setCards(remaining);
    if (activeCardId === cardId) {
      setActiveCardId(remaining[0].id);
    }
  };

  // Open Edit modal for existing card
  const handleOpenEditModal = (card: VendorCard = currentCard) => {
    setIsCreatingNewCard(false);
    setEditCardData(JSON.parse(JSON.stringify(card)));
    setIsEditModalOpen(true);
  };

  // Open Create modal for new card
  const handleOpenCreateModal = (presetCategory?: string) => {
    setIsCreatingNewCard(true);
    const newCard: VendorCard = {
      id: Date.now().toString(),
      nama: '',
      nomorHp: '',
      namaToko: '',
      kategori: presetCategory && presetCategory !== 'Semua' ? presetCategory : (categories[0] || 'Material Pokok'),
      bankAccounts: [
        { id: 'b_' + Date.now(), bank: 'BRI', noRekening: '' }
      ]
    };
    setEditCardData(newCard);
    setIsEditModalOpen(true);
  };

  // Save Card (Edit or Create)
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingNewCard) {
      setCards(prev => [...prev, editCardData]);
      setActiveCardId(editCardData.id);
    } else {
      setCards(prev => prev.map(c => c.id === editCardData.id ? editCardData : c));
    }
    setIsEditModalOpen(false);
  };

  // Bank accounts in Edit form
  const handleAddBankAccount = () => {
    const newBank: BankAccount = {
      id: 'b_' + Date.now(),
      bank: 'BCA',
      noRekening: ''
    };
    setEditCardData(prev => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, newBank]
    }));
  };

  const handleUpdateBankAccount = (index: number, field: 'bank' | 'noRekening', value: string) => {
    const updated = [...editCardData.bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setEditCardData(prev => ({ ...prev, bankAccounts: updated }));
  };

  const handleRemoveBankAccount = (index: number) => {
    if (editCardData.bankAccounts.length <= 1) return;
    const updated = editCardData.bankAccounts.filter((_, i) => i !== index);
    setEditCardData(prev => ({ ...prev, bankAccounts: updated }));
  };

  // Format account digits with spacing for credit-card look
  const formatCardDigits = (digits: string) => {
    if (!digits) return '---- ---- ---- ----';
    const clean = digits.replace(/\s+/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto px-4 py-5 lg:px-8 max-w-2xl mx-auto custom-scrollbar safe-area-pb">
      {/* Header Info & Action Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Pelaporan SCM
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Pelaporan pembayaran material via WhatsApp
          </p>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all text-xs flex items-center gap-1.5"
              title="Riwayat Pelaporan"
            >
              <History size={15} />
              <span className="hidden sm:inline">Riwayat ({history.length})</span>
            </button>
          )}

          {/* Tombol Ganti Kartu: Opens Category & Saved Cards Modal */}
          <button
            onClick={() => setIsSelectorModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
            title="Pilih & Ganti Kartu Vendor"
          >
            <Layers size={15} className="text-amber-400" />
            <span>Ganti Kartu</span>
          </button>
        </div>
      </div>

      {/* 1. CARD DISPLAY (Interactive Payment Card - Only 1 Bank Displayed) */}
      <div className="relative group mb-6">
        {/* Ambient Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-90 transition duration-500 pointer-events-none" />

        <div
          onClick={() => handleOpenEditModal(currentCard)}
          className="relative w-full rounded-3xl p-6 cursor-pointer select-none bg-gradient-to-br from-zinc-900 via-neutral-900 to-black border border-white/20 shadow-2xl overflow-hidden hover:border-amber-400/50 hover:shadow-amber-500/10 transition-all duration-300 transform active:scale-[0.985]"
        >
          {/* Subtle Card Background Texture Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-white/5 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Top Bar: Chip + Nama Toko/Vendor + Bank badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* EMV Metallic Golden Chip Accent */}
              <div className="relative shrink-0">
                <svg 
                  className="w-12 h-9 rounded-md overflow-hidden shadow-md shadow-black/50 border border-amber-300/40" 
                  viewBox="0 0 48 36" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="48" height="36" rx="4" fill="url(#chipGoldGradient)" />
                  <rect x="1" y="1" width="46" height="34" rx="3" stroke="#FDE68A" strokeWidth="0.8" strokeOpacity="0.8" fill="none" />
                  {/* Chip Tracings */}
                  <path d="M 0 12 H 16 M 0 24 H 16 M 32 12 H 48 M 32 24 H 48 M 16 0 V 36 M 32 0 V 36 M 16 12 H 32 M 16 24 H 32" stroke="#78350F" strokeWidth="1" strokeOpacity="0.75" />
                  <circle cx="24" cy="18" r="4.5" fill="#F59E0B" stroke="#92400E" strokeWidth="0.8" />
                  <defs>
                    <linearGradient id="chipGoldGradient" x1="0" y1="0" x2="48" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FDE68A" />
                      <stop offset="0.25" stopColor="#F59E0B" />
                      <stop offset="0.75" stopColor="#D97706" />
                      <stop offset="1" stopColor="#B45309" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Nama Toko / Vendor */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Store size={13} className="text-amber-400 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 truncate">
                    {currentCard.kategori || 'Vendor'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[190px] sm:max-w-[280px]">
                  {currentCard.namaToko || 'Nama Toko / Vendor'}
                </h3>
              </div>
            </div>

            {/* Display only 1 Bank on Card Face */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-black tracking-widest text-white shadow-inner uppercase">
                {primaryBank.bank || 'BANK'}
              </span>
              {currentCard.bankAccounts && currentCard.bankAccounts.length > 1 && (
                <span className="text-[9px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  +{currentCard.bankAccounts.length - 1} Bank Lain
                </span>
              )}
            </div>
          </div>

          {/* Center: Nomor Rekening (Primary Bank only on card face) */}
          <div className="my-5">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1.5">
              <span>Nomor Rekening ({primaryBank.bank})</span>
              <button
                onClick={handleCopyRekening}
                className="text-white/60 hover:text-white flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10"
              >
                {copiedRekening ? (
                  <>
                    <Check size={11} className="text-emerald-400" />
                    <span className="text-emerald-400">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-[0.16em] text-white text-shadow-sm select-all">
              {formatCardDigits(primaryBank.noRekening)}
            </div>
          </div>

          {/* Bottom Row: (Nama) & (Nomor Hp) */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10 mt-4">
            {/* Nama Penerima A/N */}
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-white/50 mb-0.5">
                <User size={12} className="text-white/60" />
                <span>Penerima A/N</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                {currentCard.nama || '-'}
              </p>
            </div>

            {/* Nomor HP Vendor */}
            <div className="min-w-0 text-right">
              <div className="flex items-center justify-end gap-1 text-[10px] uppercase font-bold tracking-wider text-white/50 mb-0.5">
                <Phone size={12} className="text-white/60" />
                <span>Nomor HP</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-amber-200/90 tracking-tight font-mono truncate">
                {currentCard.nomorHp || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DETAIL PEMBAYARAN (Inputs Lokasi & Item - Tanpa Bar Pilihan) */}
      <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 mb-5 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Package size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Detail Pembayaran
            </h3>
            <p className="text-[11px] text-white/40">
              Input lokasi dan item material untuk nota pembayaran
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Input 1: Lokasi : */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-400" />
              <span>Lokasi :</span>
            </label>
            <input
              type="text"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Masukkan lokasi (contoh: Workshop)"
              className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 focus:border-emerald-500 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none transition-colors"
            />
          </div>

          {/* Input 2: Item */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5 flex items-center gap-1.5">
              <Package size={14} className="text-amber-400" />
              <span>Item :</span>
            </label>
            <input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Masukkan item material (contoh: Pasir)"
              className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 focus:border-emerald-500 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 3. TOMBOL DIRECT KE WHATSAPP (Buka WA & Pilih Kontak) */}
      <div className="space-y-3 mb-6">
        <button
          onClick={handleDirectWa}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all duration-200 transform active:scale-[0.98] cursor-pointer"
        >
          <MessageCircle size={22} className="fill-white/20" />
          <span>Kirim Pesan ke WhatsApp</span>
        </button>

        <button
          onClick={handleCopyCaption}
          className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? (
            <>
              <Check size={16} className="text-emerald-400" />
              <span className="text-emerald-400">Format Caption Berhasil Disalin!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Salin Format Caption WA</span>
            </>
          )}
        </button>
      </div>

      {/* 4. PREVIEW CAPTION WA (Semua Bank Dimasukkan) */}
      <div className="bg-black/60 border border-white/10 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between text-xs text-white/50 mb-2 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live Preview Format WA:
          </span>
          <span className="text-[10px] text-white/40">
            {currentCard.bankAccounts?.length || 1} Bank Terdaftar
          </span>
        </div>
        <div className="p-3.5 bg-zinc-950/90 border border-emerald-500/20 rounded-xl font-mono text-xs sm:text-sm text-emerald-300/90 whitespace-pre-wrap leading-relaxed shadow-inner">
          {currentWaMessage}
        </div>
      </div>

      {/* 5. RIWAYAT PELAPORAN (If available) */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <History size={14} className="text-white/60" /> Riwayat Pelaporan Nota
              </h4>
              <button
                onClick={() => setHistory([])}
                className="text-[11px] text-red-400 hover:text-red-300"
              >
                Hapus Riwayat
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{h.item}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-emerald-400 font-medium">{h.lokasi}</span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      {h.vendorNama} ({h.bankAccounts?.[0]?.bank} - {h.bankAccounts?.[0]?.noRekening}) • {h.timestamp}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setItem(h.item);
                      setLokasi(h.lokasi);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                    title="Gunakan item & lokasi ini"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP 1: GANTI KARTU & KELOLA KATEGORI */}
      <AnimatePresence>
        {isSelectorModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSelectorModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-lg bg-zinc-950 border border-white/20 rounded-3xl p-5 sm:p-6 z-[130] shadow-2xl flex flex-col max-h-[88vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Pilih & Kelola Kartu Vendor
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Kelompokkan kartu berdasarkan kategori
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSelectorModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Kategori Bar (Tabs + Buat Kategori Manual) */}
              <div className="py-3 border-b border-white/10 shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
                    <Tag size={12} className="text-amber-400" /> Kategori Vendor
                  </span>
                  <button
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <FolderPlus size={13} /> + Kategori Baru
                  </button>
                </div>

                {/* Inline form to add category manually */}
                {isAddingCategory && (
                  <form onSubmit={handleAddCategory} className="flex gap-2 mb-2.5">
                    <input
                      type="text"
                      autoFocus
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nama kategori baru..."
                      className="flex-1 px-3 py-1.5 bg-black/60 border border-emerald-500/50 rounded-xl text-white text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl"
                    >
                      Tambah
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="px-2 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs rounded-xl"
                    >
                      Batal
                    </button>
                  </form>
                )}

                {/* Category Pills list */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedCategoryFilter('Semua')}
                    className={`text-xs px-3 py-1.5 rounded-xl border whitespace-nowrap font-medium transition-all ${
                      selectedCategoryFilter === 'Semua'
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-sm'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Semua ({cards.length})
                  </button>
                  {categories.map((cat) => {
                    const count = cards.filter(c => c.kategori === cat).length;
                    return (
                      <div key={cat} className="flex items-center shrink-0">
                        <button
                          onClick={() => setSelectedCategoryFilter(cat)}
                          className={`text-xs px-3 py-1.5 rounded-l-xl border-y border-l whitespace-nowrap font-medium transition-all ${
                            selectedCategoryFilter === cat
                              ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-sm'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {cat} ({count})
                        </button>
                        {categories.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteCategory(cat, e)}
                            className={`text-xs px-1.5 py-1.5 rounded-r-xl border-y border-r transition-all ${
                              selectedCategoryFilter === cat
                                ? 'bg-amber-400 text-black/60 hover:text-black border-amber-400'
                                : 'bg-white/5 border-white/10 text-white/30 hover:text-red-400'
                            }`}
                            title={`Hapus kategori ${cat}`}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar min-h-[160px]">
                {filteredCards.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-xs">
                    <Store size={28} className="mx-auto mb-2 text-white/20" />
                    <p>Belum ada kartu di kategori ini.</p>
                    <button
                      onClick={() => handleOpenCreateModal(selectedCategoryFilter)}
                      className="mt-2 text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      + Tambah kartu sekarang
                    </button>
                  </div>
                ) : (
                  filteredCards.map((card) => {
                    const isActive = card.id === activeCardId;
                    const primary = card.bankAccounts?.[0] || { bank: 'BRI', noRekening: '-' };
                    const extraBanksCount = (card.bankAccounts?.length || 1) - 1;

                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          setActiveCardId(card.id);
                          setIsSelectorModalOpen(false);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                          isActive
                            ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {/* Category & Store */}
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-amber-300 uppercase tracking-wider">
                                {card.kategori || 'Umum'}
                              </span>
                              {isActive && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 size={10} /> Aktif
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-white truncate">
                              {card.namaToko}
                            </h4>

                            <p className="text-xs text-white/60 mt-0.5">
                              A/N: <strong className="text-white/80">{card.nama}</strong> • HP: {card.nomorHp || '-'}
                            </p>

                            <div className="mt-2 text-xs font-mono text-emerald-300/90 flex items-center gap-2 flex-wrap">
                              <span>
                                {primary.bank}: {primary.noRekening}
                              </span>
                              {extraBanksCount > 0 && (
                                <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded font-sans">
                                  +{extraBanksCount} Bank lain
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                handleOpenEditModal(card);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                              title="Edit Kartu"
                            >
                              <Edit3 size={15} />
                            </button>
                            {cards.length > 1 && (
                              <button
                                onClick={(e) => handleDeleteCard(card.id, e)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                                title="Hapus Kartu"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer: Add Card Button */}
              <div className="pt-3 border-t border-white/10 shrink-0">
                <button
                  onClick={() => handleOpenCreateModal(selectedCategoryFilter)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Plus size={16} /> Tambah Kartu Baru
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* POPUP 2: EDIT / TAMBAH KARTU (Dengan Input Multi Bank) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[140]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-md bg-zinc-950 border border-white/20 rounded-3xl p-5 sm:p-6 z-[150] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {isCreatingNewCard ? 'Tambah Kartu Vendor' : 'Edit Data Kartu Display'}
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Bisa input lebih dari 1 bank (masuk ke laporan WA)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveCard} className="space-y-4 text-xs">
                {/* 1. Kategori Selection */}
                <div>
                  <label className="block font-semibold text-white/80 mb-1 flex items-center gap-1.5">
                    <Tag size={13} className="text-amber-400" />
                    <span>Kategori Kartu :</span>
                  </label>
                  <select
                    value={editCardData.kategori}
                    onChange={(e) => setEditCardData({ ...editCardData, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-white text-sm focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c} className="bg-zinc-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Nama Toko/Vendor */}
                <div>
                  <label className="block font-semibold text-white/80 mb-1 flex items-center gap-1.5">
                    <Store size={13} className="text-amber-400" />
                    <span>Nama Toko / Vendor :</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCardData.namaToko}
                    onChange={(e) => setEditCardData({ ...editCardData, namaToko: e.target.value })}
                    placeholder="Contoh: TB Rusnawati Jaya"
                    className="w-full px-3 py-2 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-white text-sm focus:outline-none"
                  />
                </div>

                {/* 3. Nama Penerima A/N */}
                <div>
                  <label className="block font-semibold text-white/80 mb-1 flex items-center gap-1.5">
                    <User size={13} className="text-white/60" />
                    <span>Penerima A/N (Nama) :</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCardData.nama}
                    onChange={(e) => setEditCardData({ ...editCardData, nama: e.target.value })}
                    placeholder="Contoh: Rusnawati"
                    className="w-full px-3 py-2 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-white text-sm focus:outline-none"
                  />
                </div>

                {/* 4. Nomor HP */}
                <div>
                  <label className="block font-semibold text-white/80 mb-1 flex items-center gap-1.5">
                    <Phone size={13} className="text-emerald-400" />
                    <span>Nomor HP :</span>
                  </label>
                  <input
                    type="text"
                    value={editCardData.nomorHp}
                    onChange={(e) => setEditCardData({ ...editCardData, nomorHp: e.target.value })}
                    placeholder="Contoh: 08111949322"
                    className="w-full px-3 py-2 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-white text-sm focus:outline-none font-mono"
                  />
                </div>

                {/* 5. MULTIPLE BANK ACCOUNTS */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                      <Building2 size={13} className="text-blue-400" />
                      <span>Daftar Rekening Bank ({editCardData.bankAccounts.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddBankAccount}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <Plus size={13} /> + Tambah Bank
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 mb-3">
                    Bank pertama akan jadi display di kartu, namun seluruh bank akan masuk ke laporan WA.
                  </p>

                  <div className="space-y-3">
                    {editCardData.bankAccounts.map((account, idx) => (
                      <div 
                        key={account.id || idx}
                        className="p-3 rounded-2xl bg-black/50 border border-white/10 relative space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                            Bank #{idx + 1} {idx === 0 ? '(Utama / Display)' : ''}
                          </span>
                          {editCardData.bankAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBankAccount(idx)}
                              className="text-white/40 hover:text-red-400 p-1"
                              title="Hapus Bank Ini"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Bank Name */}
                        <div>
                          <input
                            type="text"
                            required
                            value={account.bank}
                            onChange={(e) => handleUpdateBankAccount(idx, 'bank', e.target.value.toUpperCase())}
                            placeholder="Nama Bank (BRI, BCA, dll)"
                            className="w-full px-2.5 py-1.5 bg-black/70 border border-white/15 rounded-lg text-white font-bold uppercase text-xs focus:outline-none focus:border-amber-400"
                          />
                          {/* Quick Bank chips */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {POPULAR_BANKS.map(b => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => handleUpdateBankAccount(idx, 'bank', b)}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                                  account.bank === b
                                    ? 'bg-blue-500/20 border-blue-500/60 text-blue-300'
                                    : 'bg-white/5 border-white/10 text-white/50'
                                }`}
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Account Number */}
                        <div>
                          <input
                            type="text"
                            required
                            value={account.noRekening}
                            onChange={(e) => handleUpdateBankAccount(idx, 'noRekening', e.target.value)}
                            placeholder="Nomor Rekening"
                            className="w-full px-2.5 py-1.5 bg-black/70 border border-white/15 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div className="flex items-center gap-3 pt-3 mt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-lg shadow-amber-500/20 transition-all"
                  >
                    {isCreatingNewCard ? 'Simpan Kartu' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
