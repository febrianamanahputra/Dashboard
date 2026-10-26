import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Edit3, 
  MessageCircle, 
  Check, 
  Copy, 
  Store, 
  User, 
  MapPin, 
  Package, 
  Building2, 
  X, 
  Plus, 
  Trash2, 
  History, 
  RotateCcw,
  CheckCircle2,
  Sparkles,
  BookmarkPlus,
  Camera,
  ArrowLeftRight,
  Search,
  ChevronDown,
  Paperclip,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { CharacterAvatar, CHARACTERS } from './CharacterAvatars';

export interface BankAccount {
  id: string;
  bank: string;
  noRekening: string;
  atasNama: string;
}

export interface VendorCard {
  id: string;
  namaToko: string;
  characterId: number; // 1 to 20
  bankAccounts: BankAccount[];
}

interface ReportHistory {
  id: string;
  timestamp: string;
  item: string;
  lokasi: string;
  namaToko: string;
  bankAccounts: BankAccount[];
}

const DEFAULT_LOCATIONS = [
  'Gudang Utama',
  'Workshop',
  'Proyek A',
  'Proyek B',
  'Site Lapangan'
];

const DEFAULT_CARDS: VendorCard[] = [
  {
    id: '1',
    namaToko: 'TB Rusnawati Jaya',
    characterId: 1,
    bankAccounts: [
      { id: 'b1', bank: 'BRI', noRekening: '707301021739533', atasNama: 'Rusnawati' },
      { id: 'b2', bank: 'BCA', noRekening: '707301021739533', atasNama: 'Ramli' }
    ]
  },
  {
    id: '2',
    namaToko: 'Pusat Pasir & Batu Alam',
    characterId: 5,
    bankAccounts: [
      { id: 'b1', bank: 'BCA', noRekening: '8690123456', atasNama: 'H. Rusli' }
    ]
  },
  {
    id: '3',
    namaToko: 'Depo Semen & Besi Mandiri',
    characterId: 7,
    bankAccounts: [
      { id: 'b1', bank: 'Mandiri', noRekening: '1370019827364', atasNama: 'Budi Santoso' }
    ]
  }
];

const POPULAR_BANKS = ['BRI', 'BCA', 'Mandiri', 'BNI', 'BSI', 'CIMB'];

export default function SCMDashboard() {
  // 1. Saved Locations State (Persisted)
  const [savedLocations, setSavedLocations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('scm_saved_locations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved locations', e);
    }
    return DEFAULT_LOCATIONS;
  });

  // 2. Cards State (With atasNama per bank, characterId, no HP, no category)
  const [cards, setCards] = useState<VendorCard[]>(() => {
    try {
      const saved = localStorage.getItem('scm_vendor_cards');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((card: any, idx: number) => {
            const defaultAtasNama = card.nama || 'Penerima';
            const bankAccounts = Array.isArray(card.bankAccounts) && card.bankAccounts.length > 0
              ? card.bankAccounts.map((b: any, bIdx: number) => ({
                  id: b.id || 'b_' + idx + '_' + bIdx,
                  bank: b.bank || 'BRI',
                  noRekening: b.noRekening || '707301021739533',
                  atasNama: b.atasNama || defaultAtasNama
                }))
              : [{ id: 'b_' + idx, bank: card.bank || 'BRI', noRekening: card.noRekening || '707301021739533', atasNama: defaultAtasNama }];

            return {
              id: card.id || String(Date.now() + idx),
              namaToko: card.namaToko || 'Toko Vendor',
              characterId: Number(card.characterId) || (idx % 20 + 1),
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

  // 3. Detail Pembayaran Inputs (Lokasi & Item - Default item kosong)
  const [lokasi, setLokasi] = useState('Gudang Utama');
  const [item, setItem] = useState('');

  // 4. Modals & UI Controls
  const [isPaymentDetailModalOpen, setIsPaymentDetailModalOpen] = useState(false);
  const [isSelectorModalOpen, setIsSelectorModalOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCardData, setEditCardData] = useState<VendorCard>(currentCard);
  const [isCreatingNewCard, setIsCreatingNewCard] = useState(false);

  // Character Picker Modal (20 Options)
  const [isCharacterPickerOpen, setIsCharacterPickerOpen] = useState(false);
  const [characterPickerTarget, setCharacterPickerTarget] = useState<'current' | 'edit'>('current');

  const [copied, setCopied] = useState(false);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [locationSavedFeedback, setLocationSavedFeedback] = useState(false);

  // 5. History Log
  const [history, setHistory] = useState<ReportHistory[]>(() => {
    try {
      const saved = localStorage.getItem('scm_report_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load history', e);
    }
    return [];
  });

  // Persist Saved Locations
  useEffect(() => {
    try {
      localStorage.setItem('scm_saved_locations', JSON.stringify(savedLocations));
    } catch (e) {
      console.error('Failed to save locations', e);
    }
  }, [savedLocations]);

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

  // Primary Bank Account for the Card Display
  const primaryBank = currentCard.bankAccounts?.[0] || {
    id: 'b1',
    bank: 'BRI',
    noRekening: '707301021739533',
    atasNama: 'Rusnawati'
  };

  // Generate WhatsApp message caption as requested:
  // Quote Text WhatsApp formatting for Bank, No Rek, and A/N
  const buildWaCaption = (
    c: VendorCard = currentCard, 
    loc: string = lokasi, 
    itm: string = item
  ) => {
    const accounts = c.bankAccounts && c.bankAccounts.length > 0 
      ? c.bankAccounts 
      : [{ id: 'b1', bank: 'BRI', noRekening: '707301021739533', atasNama: 'Rusnawati' }];

    // Full separator line for mobile WhatsApp
    const separator = '------------------------------------';

    // Quote blocks formatted with "> " for Bank & A/N
    // No rekening is placed on its own line without "> " (raw digits) so WhatsApp on Android & iOS detects it as a number and turns it BLUE for instant tap/long-press to copy!
    const bankQuotes = accounts.map((acc) => {
      const bankLine = `> Bank : ${acc.bank || '-'}`;
      const anLine = `> A/N : ${acc.atasNama || '-'}`;
      const rekLine = `${acc.noRekening || '-'}`;
      return `${bankLine}\n${anLine}\n${rekLine}`;
    }).join('\n\n');

    return `Bismillah 
@08111949322
Berikut Nota Pembayaran Project ${loc || '-'}
${separator}
${bankQuotes}

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

  // Receipt Photo State & Refs (Foto Bukti / Nota Pembayaran)
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState<string | null>(null);
  const [isSharingPhoto, setIsSharingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (receiptPhotoPreview) {
        URL.revokeObjectURL(receiptPhotoPreview);
      }
      setReceiptPhoto(file);
      const url = URL.createObjectURL(file);
      setReceiptPhotoPreview(url);
    }
  };

  const handleRemovePhoto = () => {
    setReceiptPhoto(null);
    if (receiptPhotoPreview) {
      URL.revokeObjectURL(receiptPhotoPreview);
    }
    setReceiptPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Direct to WhatsApp after detail input (Supports sending along with receipt photo via Web Share API)
  const handleConfirmDirectWa = async () => {
    const caption = buildWaCaption(currentCard, lokasi, item);
    setIsSharingPhoto(true);

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
      namaToko: currentCard.namaToko,
      bankAccounts: currentCard.bankAccounts
    };
    setHistory(prev => [newEntry, ...prev.slice(0, 19)]);

    // 1. Mobile Native Web Share API (Android Chrome & iOS Safari support files + text)
    if (receiptPhoto && navigator.canShare && navigator.canShare({ files: [receiptPhoto] })) {
      try {
        await navigator.share({
          files: [receiptPhoto],
          text: caption,
          title: `Nota Pembayaran - ${item || 'Material'}`
        });
        setIsSharingPhoto(false);
        setIsPaymentDetailModalOpen(false);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User closed the share sheet
          setIsSharingPhoto(false);
          return;
        }
        console.warn('Web Share failed or cancelled, falling back to direct URL', err);
      }
    }

    // 2. Direct WhatsApp URL fallback (e.g. desktop browsers or when share isn't supported)
    // Automatically copy caption to clipboard so user can paste it immediately
    try {
      await navigator.clipboard.writeText(caption);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`;
    const win = window.open(waUrl, '_blank');
    if (!win) {
      window.location.href = waUrl;
    }
    setIsSharingPhoto(false);
    setIsPaymentDetailModalOpen(false);
  };

  // Save current typed location
  const handleSaveCurrentLocation = () => {
    const trimmed = lokasi.trim();
    if (!trimmed) return;
    if (!savedLocations.includes(trimmed)) {
      setSavedLocations(prev => [trimmed, ...prev]);
      setLocationSavedFeedback(true);
      setTimeout(() => setLocationSavedFeedback(false), 2000);
    }
  };

  // Add new location directly from inside the dropdown
  const handleAddLocationFromDropdown = () => {
    const trimmed = newLocationInput.trim();
    if (!trimmed) return;
    if (!savedLocations.includes(trimmed)) {
      setSavedLocations(prev => [...prev, trimmed]);
    }
    setLokasi(trimmed);
    setNewLocationInput('');
    setIsLocationDropdownOpen(false);
    setLocationSavedFeedback(true);
    setTimeout(() => setLocationSavedFeedback(false), 2000);
  };

  const handleDeleteSavedLocation = (locToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedLocations.length <= 1) return;
    setSavedLocations(prev => prev.filter(l => l !== locToDelete));
  };

  // Delete Card
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
  const handleOpenCreateModal = () => {
    setIsCreatingNewCard(true);
    const newCard: VendorCard = {
      id: Date.now().toString(),
      namaToko: '',
      characterId: 1,
      bankAccounts: [
        { id: 'b_' + Date.now(), bank: 'BRI', noRekening: '', atasNama: '' }
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

  // Select character from picker modal
  const handleSelectCharacter = (charId: number) => {
    if (characterPickerTarget === 'current') {
      setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, characterId: charId } : c));
    } else {
      setEditCardData(prev => ({ ...prev, characterId: charId }));
    }
    setIsCharacterPickerOpen(false);
  };

  // Bank accounts in Edit form
  const handleAddBankAccount = () => {
    const newBank: BankAccount = {
      id: 'b_' + Date.now(),
      bank: 'BCA',
      noRekening: '',
      atasNama: primaryBank.atasNama || ''
    };
    setEditCardData(prev => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, newBank]
    }));
  };

  const handleUpdateBankAccount = (index: number, field: keyof BankAccount, value: string) => {
    const updated = [...editCardData.bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setEditCardData(prev => ({ ...prev, bankAccounts: updated }));
  };

  const handleRemoveBankAccount = (index: number) => {
    if (editCardData.bankAccounts.length <= 1) return;
    const updated = editCardData.bankAccounts.filter((_, i) => i !== index);
    setEditCardData(prev => ({ ...prev, bankAccounts: updated }));
  };

  // Format account digits with spacing
  const formatCardDigits = (digits: string) => {
    if (!digits) return '---- ---- ---- ----';
    const clean = digits.replace(/\s+/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  };

  const isCurrentLocationSaved = savedLocations.includes(lokasi.trim());

  // Interactive real-time search filter for List Supplier
  const filteredCards = cards.filter((card) => {
    if (!supplierSearchQuery.trim()) return true;
    const q = supplierSearchQuery.toLowerCase();
    const matchToko = card.namaToko?.toLowerCase().includes(q);
    const matchBank = card.bankAccounts?.some(b => 
      b.bank?.toLowerCase().includes(q) || 
      b.noRekening?.toLowerCase().includes(q) || 
      b.atasNama?.toLowerCase().includes(q)
    );
    return Boolean(matchToko || matchBank);
  });

  return (
    <div className="min-h-full bg-[#f0f2f5] text-slate-800 flex flex-col px-4 py-5 lg:px-8 max-w-2xl mx-auto custom-scrollbar safe-area-pb">
      {/* Facebook Style Header Navigation */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1877f2]" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Pelaporan SCM
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Format laporan pembayaran material WhatsApp
          </p>
        </div>

        {/* Action Buttons: Riwayat & Ganti Kartu (Logo Change Saja) */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 text-slate-700 hover:text-[#1877f2] transition-all text-xs flex items-center shadow-xs"
              title="Riwayat Pelaporan"
              aria-label="Riwayat Pelaporan"
            >
              <History size={17} />
            </button>
          )}

          {/* Tombol List Supplier: Logo Change Saja */}
          <button
            onClick={() => setIsSelectorModalOpen(true)}
            className="p-2.5 rounded-xl bg-[#1877f2] hover:bg-blue-700 text-white font-semibold shadow-xs transition-all flex items-center justify-center"
            title="List Supplier"
            aria-label="List Supplier"
          >
            <ArrowLeftRight size={17} />
          </button>
        </div>
      </div>

      {/* 1. CARD DISPLAY (Nomor Rekening di atas, Nama Toko di pampang di tengah) */}
      <div className="relative group mb-5">
        <div
          onClick={() => handleOpenEditModal(currentCard)}
          className="relative w-full rounded-2xl p-5 sm:p-6 cursor-pointer select-none bg-white border border-slate-200 hover:border-blue-300 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-md transition-all duration-200 transform active:scale-[0.99]"
        >
          {/* Top Bar: Character Avatar + Nomor Rekening & Bank Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3.5">
              {/* Interactive Character Avatar */}
              <div 
                className="relative group/avatar cursor-pointer shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setCharacterPickerTarget('current');
                  setIsCharacterPickerOpen(true);
                }}
                title="Klik untuk ganti karakter (20 opsi)"
              >
                <CharacterAvatar id={currentCard.characterId || 1} className="w-13 h-13 sm:w-14 sm:h-14" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1877f2] text-white flex items-center justify-center shadow-md border-2 border-white group-hover/avatar:scale-110 transition-transform">
                  <Camera size={10} />
                </div>
              </div>

              {/* Nomor Rekening di Atas (Menggantikan Nama Toko sebelumnya) */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Rekening {primaryBank.bank || 'Utama'}
                  </span>
                  {currentCard.bankAccounts && currentCard.bankAccounts.length > 1 && (
                    <span className="text-[10px] text-[#1877f2] font-semibold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                      +{currentCard.bankAccounts.length - 1} Bank
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm sm:text-base font-bold text-slate-800 tracking-wider">
                    {formatCardDigits(primaryBank.noRekening)}
                  </span>
                  <button
                    onClick={handleCopyRekening}
                    className="p-1 text-[#1877f2] hover:bg-blue-50 rounded transition-colors"
                    title="Salin No Rekening"
                  >
                    {copiedRekening ? <Check size={13} className="text-[#1877f2]" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bank Badge */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="px-3 py-1 rounded-full bg-[#1877f2] text-white text-xs font-black tracking-wider uppercase shadow-xs">
                {primaryBank.bank || 'BANK'}
              </span>
            </div>
          </div>

          {/* Center Box: NAMA TOKO / VENDOR (Di pampang di bagian utama kartu) */}
          <div className="my-3 p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
              <Store size={12} className="text-[#1877f2]" />
              <span>Nama Toko / Vendor</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              {currentCard.namaToko || 'Nama Toko / Vendor'}
            </h3>
          </div>

          {/* Bottom Row: Penerima A/N */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              <User size={13} className="text-[#1877f2] shrink-0" />
              <span>A/N:</span>
              <strong className="text-slate-800 truncate">
                {primaryBank.atasNama || '-'}
              </strong>
            </div>
            <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Edit3 size={11} /> Ketuk untuk edit
            </span>
          </div>
        </div>
      </div>

      {/* 2. TOMBOL KIRIM PESAN KE WHATSAPP (Memicu Popup Detail Pembayaran Terlebih Dahulu) */}
      <div className="space-y-2.5 mb-5">
        <button
          onClick={() => setIsPaymentDetailModalOpen(true)}
          className="w-full py-4 px-6 rounded-xl bg-[#1877f2] hover:bg-blue-700 text-white font-bold text-base shadow-sm flex items-center justify-center gap-2.5 transition-all duration-200 transform active:scale-[0.99] cursor-pointer"
        >
          <MessageCircle size={20} />
          <span>Kirim Pesan ke WhatsApp</span>
        </button>

        <button
          onClick={handleCopyCaption}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-[#1877f2] hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          {copied ? (
            <>
              <Check size={15} className="text-[#1877f2]" />
              <span className="font-bold">Format Caption Berhasil Disalin!</span>
            </>
          ) : (
            <>
              <Copy size={15} />
              <span>Salin Format Caption WA</span>
            </>
          )}
        </button>
      </div>



      {/* 4. RIWAYAT PELAPORAN (If available) */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-xs"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <History size={14} className="text-[#1877f2]" /> Riwayat Pelaporan Nota
              </h4>
              <button
                onClick={() => setHistory([])}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Hapus Riwayat
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{h.item}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[#1877f2] font-semibold">{h.lokasi}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {h.namaToko} ({h.bankAccounts?.[0]?.bank} - {h.bankAccounts?.[0]?.noRekening}) • {h.timestamp}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setItem(h.item);
                      setLokasi(h.lokasi);
                      setIsPaymentDetailModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-[#1877f2]"
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

      {/* POPUP: DETAIL PEMBAYARAN (MUNCUL SEBELUM DIRECT KE WHATSAPP) */}
      <AnimatePresence>
        {isPaymentDetailModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentDetailModalOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[120]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-lg bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 z-[130] shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1877f2]">
                    <Package size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Detail Pembayaran Material
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tentukan lokasi proyek dan item sebelum kirim ke WhatsApp
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPaymentDetailModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 mb-5">
                {/* 1. Lokasi */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#1877f2]" />
                      <span>Lokasi Project :</span>
                    </label>

                    {/* Tombol Simpan Lokasi Baru */}
                    {lokasi.trim() && !isCurrentLocationSaved && (
                      <button
                        type="button"
                        onClick={handleSaveCurrentLocation}
                        className="text-xs text-[#1877f2] hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 transition-colors"
                      >
                        <BookmarkPlus size={12} />
                        <span>+ Simpan Lokasi</span>
                      </button>
                    )}

                    {locationSavedFeedback && (
                      <span className="text-xs text-[#1877f2] font-semibold flex items-center gap-1">
                        <Check size={12} /> Tersimpan!
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    placeholder="Contoh: Gudang Utama / Workshop"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#1877f2] focus:bg-white rounded-xl text-slate-900 text-sm focus:outline-none transition-colors"
                  />

                  {/* Dropdown: Pilih Lokasi Cepat */}
                  <div className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl text-xs text-slate-700 transition-all font-medium"
                    >
                      <span className="flex items-center gap-1.5 text-slate-600 truncate">
                        <MapPin size={13} className="text-[#1877f2] shrink-0" />
                        <span>Pilih Lokasi Cepat:</span>
                        <span className="text-slate-900 font-bold truncate">
                          {lokasi || 'Belum dipilih'}
                        </span>
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                          isLocationDropdownOpen ? 'rotate-180 text-[#1877f2]' : ''
                        }`}
                      />
                    </button>

                    {/* Isi Dropdown */}
                    <AnimatePresence>
                      {isLocationDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-2 text-xs flex flex-col"
                        >
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 mb-1">
                            <span>Lokasi Tersimpan ({savedLocations.length})</span>
                          </div>

                          {/* List Lokasi Tersimpan */}
                          <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1 py-1">
                            {savedLocations.map((loc) => {
                              const isSelected = lokasi === loc;
                              return (
                                <div
                                  key={loc}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors group cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50 text-[#1877f2] font-bold'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                  onClick={() => {
                                    setLokasi(loc);
                                    setIsLocationDropdownOpen(false);
                                  }}
                                >
                                  <span className="flex items-center gap-2 truncate flex-1">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isSelected ? 'bg-[#1877f2]' : 'bg-slate-300'
                                      }`}
                                    />
                                    <span className="truncate">{loc}</span>
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {isSelected && <Check size={13} className="text-[#1877f2]" />}
                                    {savedLocations.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSavedLocation(loc, e);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all ml-1"
                                        title="Hapus lokasi ini"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Divider */}
                          <div className="border-t border-slate-100 my-1.5" />

                          {/* Form Tambah Lokasi Tersimpan di dalam Dropdown */}
                          <div className="pt-1">
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1 px-1">
                              + Tambah Lokasi Tersimpan:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={newLocationInput}
                                onChange={(e) => setNewLocationInput(e.target.value)}
                                placeholder="Nama lokasi baru..."
                                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#1877f2] focus:bg-white rounded-lg text-xs text-slate-900 focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddLocationFromDropdown();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={!newLocationInput.trim()}
                                onClick={handleAddLocationFromDropdown}
                                className="px-3 py-1.5 rounded-lg bg-[#1877f2] hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1 shadow-xs"
                              >
                                <Plus size={12} />
                                <span>Simpan</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 2. Item Material (Default Kosong) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Package size={14} className="text-[#1877f2]" />
                    <span>Item Pembelian :</span>
                  </label>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    placeholder="Contoh: Pasir, Semen, Besi, Cat..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#1877f2] focus:bg-white rounded-xl text-slate-900 text-sm focus:outline-none transition-colors"
                  />
                </div>

                {/* 3. Foto Nota / Bukti Pembayaran */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Camera size={14} className="text-[#1877f2]" />
                      <span>Foto Bukti / Nota Pembayaran :</span>
                    </label>
                    {receiptPhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                      >
                        <Trash2 size={11} /> Hapus Foto
                      </button>
                    )}
                  </div>

                  {/* Hidden inputs for Camera and File Picker */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                  {!receiptPhotoPreview ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-3 px-3 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200 border-dashed rounded-xl text-xs font-semibold text-[#1877f2] flex flex-col items-center justify-center gap-1.5 transition-all group active:scale-[0.98]"
                      >
                        <div className="w-8 h-8 rounded-full bg-white text-[#1877f2] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <Camera size={16} />
                        </div>
                        <span className="font-bold">Foto Kamera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-3 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl text-xs font-semibold text-slate-700 flex flex-col items-center justify-center gap-1.5 transition-all group active:scale-[0.98]"
                      >
                        <div className="w-8 h-8 rounded-full bg-white text-slate-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <Paperclip size={16} />
                        </div>
                        <span className="font-bold">Pilih Galeri</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={receiptPhotoPreview}
                          alt="Foto Nota"
                          className="w-13 h-13 object-cover rounded-lg border border-white shadow-xs shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {receiptPhoto?.name || 'Foto Nota'}
                            </p>
                          </div>
                          <p className="text-[11px] text-[#1877f2] font-semibold mt-0.5">
                            {receiptPhoto ? (receiptPhoto.size / 1024).toFixed(0) + ' KB' : ''} • Siap dikirim
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-[#1877f2] text-xs font-bold shadow-xs transition-colors"
                        >
                          Ganti
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                    *Pada HP (Android & iOS), foto & caption nota akan langsung terkirim bersamaan ke WhatsApp.
                  </p>
                </div>
              </div>

              {/* Action buttons in modal */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentDetailModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSharingPhoto}
                  onClick={handleConfirmDirectWa}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#1877f2] hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  {isSharingPhoto ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menyiapkan...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle size={15} />
                      <span>{receiptPhoto ? 'Kirim Foto & Caption' : 'Kirim ke WhatsApp'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* POPUP: GANTI KARTU (TANPA KATEGORI) */}
      <AnimatePresence>
        {isSelectorModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSelectorModalOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[140]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-lg bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 z-[150] shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Modal Header: List Supplier */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1877f2]">
                    <ArrowLeftRight size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      List Supplier
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pilih supplier aktif untuk pelaporan nota pembayaran
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSelectorModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Kotak Search Supplier Interaktif (Per huruf langsung menyesuaikan) */}
              <div className="relative mt-3 mb-1 shrink-0">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={supplierSearchQuery}
                  onChange={(e) => setSupplierSearchQuery(e.target.value)}
                  placeholder="Cari nama supplier, bank, no rek, A/N..."
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 focus:border-[#1877f2] focus:bg-white rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none transition-colors"
                />
                {supplierSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSupplierSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
                    title="Hapus pencarian"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Status Hasil Pencarian */}
              <div className="flex items-center justify-between px-1 py-1 text-[11px] text-slate-500 shrink-0">
                <span>
                  {supplierSearchQuery.trim() ? (
                    <span>
                      Ditemukan <strong className="text-[#1877f2] font-bold">{filteredCards.length}</strong> supplier
                    </span>
                  ) : (
                    <span>
                      Total <strong className="text-slate-700 font-bold">{cards.length}</strong> supplier terdaftar
                    </span>
                  )}
                </span>
                {supplierSearchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSupplierSearchQuery('')}
                    className="text-[#1877f2] hover:underline font-semibold text-[11px]"
                  >
                    Reset pencarian
                  </button>
                )}
              </div>

              {/* Cards List (Hasil Filter Interaktif) */}
              <div className="flex-1 overflow-y-auto py-2 space-y-2.5 custom-scrollbar min-h-[160px]">
                {filteredCards.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center">
                    <Store size={32} className="text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="text-xs font-semibold text-slate-700">
                      Tidak ada supplier yang cocok dengan "{supplierSearchQuery}"
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Coba ketik kata kunci lain atau daftarkan sebagai supplier baru
                    </p>
                    <button
                      onClick={() => setSupplierSearchQuery('')}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 text-[#1877f2] font-bold text-xs hover:bg-blue-100 transition-colors"
                    >
                      Bersihkan Pencarian
                    </button>
                  </div>
                ) : (
                  filteredCards.map((card) => {
                    const isActive = card.id === activeCardId;
                    const primary = card.bankAccounts?.[0] || { bank: 'BRI', noRekening: '-', atasNama: '-' };
                    const extraBanksCount = (card.bankAccounts?.length || 1) - 1;

                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          setActiveCardId(card.id);
                          setIsSelectorModalOpen(false);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                          isActive
                            ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <CharacterAvatar id={card.characterId || 1} className="w-11 h-11 shrink-0 mt-0.5" />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                {isActive && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#1877f2] text-white flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Aktif
                                  </span>
                                )}
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1877f2] uppercase tracking-wider">
                                  {primary.bank}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {card.namaToko}
                              </h4>

                              <p className="text-xs text-slate-500 mt-0.5">
                                A/N: <strong className="text-slate-700">{primary.atasNama}</strong>
                              </p>

                              <div className="mt-1 text-xs font-mono text-[#1877f2] flex items-center gap-2 flex-wrap font-semibold">
                                <span>
                                  {primary.bank}: {primary.noRekening}
                                </span>
                                {extraBanksCount > 0 && (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-sans">
                                    +{extraBanksCount} Bank lain
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEditModal(card)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#1877f2] transition-colors"
                              title="Edit Supplier"
                            >
                              <Edit3 size={15} />
                            </button>
                            {cards.length > 1 && (
                              <button
                                onClick={(e) => handleDeleteCard(card.id, e)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                title="Hapus Supplier"
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

              {/* Modal Footer: Add Supplier Button */}
              <div className="pt-3 border-t border-slate-100 shrink-0">
                <button
                  onClick={handleOpenCreateModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1877f2] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Plus size={16} /> Tambah Supplier Baru
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* POPUP: EDIT / TAMBAH KARTU (TANPA KATEGORI & TANPA NOMOR HP) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[160]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-md bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 z-[170] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1877f2]">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {isCreatingNewCard ? 'Tambah Supplier Baru' : 'Edit Data Supplier'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Atur nama toko, karakter, dan rekening bank
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveCard} className="space-y-4 text-xs">
                {/* Character Avatar Picker */}
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CharacterAvatar id={editCardData.characterId || 1} className="w-12 h-12 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {CHARACTERS.find(c => c.id === (editCardData.characterId || 1))?.name || 'Karakter Kartu'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {CHARACTERS.find(c => c.id === (editCardData.characterId || 1))?.role || 'Avatar'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCharacterPickerTarget('edit');
                      setIsCharacterPickerOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-blue-100 text-[#1877f2] border border-blue-200 font-bold rounded-lg text-xs transition-colors"
                  >
                    Ganti Karakter (20 Opsi)
                  </button>
                </div>

                {/* 1. Nama Toko/Vendor */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Store size={13} className="text-[#1877f2]" />
                    <span>Nama Toko / Vendor :</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editCardData.namaToko}
                    onChange={(e) => setEditCardData({ ...editCardData, namaToko: e.target.value })}
                    placeholder="Contoh: TB Rusnawati Jaya"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#1877f2] focus:bg-white rounded-xl text-slate-900 text-sm focus:outline-none"
                  />
                </div>

                {/* 2. DAFTAR REKENING BANK & A/N (Bisa Banyak Bank) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                      <Building2 size={13} className="text-[#1877f2]" />
                      <span>Daftar Rekening Bank ({editCardData.bankAccounts.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddBankAccount}
                      className="text-xs text-[#1877f2] hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      <Plus size={13} /> + Tambah Bank
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Setiap bank dapat memiliki nomor rekening dan A/N masing-masing.
                  </p>

                  <div className="space-y-3">
                    {editCardData.bankAccounts.map((account, idx) => (
                      <div 
                        key={account.id || idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 relative space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#1877f2] uppercase tracking-wider">
                            Bank #{idx + 1} {idx === 0 ? '(Utama)' : ''}
                          </span>
                          {editCardData.bankAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBankAccount(idx)}
                              className="text-slate-400 hover:text-red-500 p-1"
                              title="Hapus Bank Ini"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Bank Name */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Nama Bank:</label>
                          <input
                            type="text"
                            required
                            value={account.bank}
                            onChange={(e) => handleUpdateBankAccount(idx, 'bank', e.target.value.toUpperCase())}
                            placeholder="Nama Bank (BRI, BCA, dll)"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold uppercase text-xs focus:outline-none focus:border-[#1877f2]"
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
                                    ? 'bg-[#1877f2] text-white border-[#1877f2]'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Account Number */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Nomor Rekening:</label>
                          <input
                            type="text"
                            required
                            value={account.noRekening}
                            onChange={(e) => handleUpdateBankAccount(idx, 'noRekening', e.target.value)}
                            placeholder="Nomor Rekening"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-[#1877f2]"
                          />
                        </div>

                        {/* Atas Nama (A/N) */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Penerima A/N :</label>
                          <input
                            type="text"
                            required
                            value={account.atasNama}
                            onChange={(e) => handleUpdateBankAccount(idx, 'atasNama', e.target.value)}
                            placeholder="Contoh: Rusnawati"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-[#1877f2]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div className="flex items-center gap-3 pt-3 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#1877f2] hover:bg-blue-700 text-white font-bold shadow-xs transition-all"
                  >
                    {isCreatingNewCard ? 'Simpan Kartu' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* POPUP: CHARACTER PICKER MODAL (20 OPSI KARAKTER) */}
      <AnimatePresence>
        {isCharacterPickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCharacterPickerOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[180]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94%] max-w-lg bg-white border border-slate-200 rounded-2xl p-5 z-[190] shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#1877f2]" />
                  <h3 className="text-base font-bold text-slate-900">
                    Pilih Karakter Kartu (20 Opsi)
                  </h3>
                </div>
                <button
                  onClick={() => setIsCharacterPickerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 custom-scrollbar">
                {CHARACTERS.map((char) => {
                  const currentSelectedId = characterPickerTarget === 'current' 
                    ? (currentCard.characterId || 1) 
                    : (editCardData.characterId || 1);
                  const isSelected = char.id === currentSelectedId;

                  return (
                    <button
                      key={char.id}
                      onClick={() => handleSelectCharacter(char.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-[#1877f2] shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <CharacterAvatar id={char.id} className="w-14 h-14 mb-2" />
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">
                        {char.name}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {char.role}
                      </span>
                      {isSelected && (
                        <span className="mt-1 text-[9px] font-bold text-[#1877f2] bg-blue-100 px-1.5 py-0.5 rounded-full">
                          ✓ Terpilih
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 shrink-0 text-right">
                <button
                  onClick={() => setIsCharacterPickerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
