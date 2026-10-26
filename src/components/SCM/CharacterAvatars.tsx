import React from 'react';

export interface CharacterItem {
  id: number;
  name: string;
  role: string;
}

export const CHARACTERS: CharacterItem[] = [
  { id: 1, name: 'Mandor Helm', role: 'Pengawas Lapangan' },
  { id: 2, name: 'Arsitek Desain', role: 'Perencana Proyek' },
  { id: 3, name: 'Insinyur Sipil', role: 'Spesialis Struktur' },
  { id: 4, name: 'Manajer Proyek', role: 'Koordinator Umum' },
  { id: 5, name: 'Pemilik Toko', role: 'Vendor Utama' },
  { id: 6, name: 'Supir Logistik', role: 'Armada Pengiriman' },
  { id: 7, name: 'Tukang Besi', role: 'Ahli Fabrikasi' },
  { id: 8, name: 'Pengawas Mutu', role: 'Quality Control' },
  { id: 9, name: 'Robot SCM', role: 'AI Assistant' },
  { id: 10, name: 'Beruang Mandor', role: 'Maskot Lapangan' },
  { id: 11, name: 'Kucing Arsitek', role: 'Maskot Desain' },
  { id: 12, name: 'Burung Hantu', role: 'Ahli Estimator' },
  { id: 13, name: 'Singa Pemimpin', role: 'Kepala Proyek' },
  { id: 14, name: 'Rubah Cerdik', role: 'Strategi Pengadaan' },
  { id: 15, name: 'Penguin Logistik', role: 'Manajemen Stok' },
  { id: 16, name: 'Surveyor Ukur', role: 'Pemetaan Lahan' },
  { id: 17, name: 'Ibu Bos Vendor', role: 'Distributor Pusat' },
  { id: 18, name: 'Teknisi Listrik', role: 'Instalasi Power' },
  { id: 19, name: 'Bintang Supplier', role: 'Vendor Terpercaya' },
  { id: 20, name: 'Maskot Renovki', role: 'Sistem Terpadu' }
];

export function CharacterAvatar({ 
  id, 
  className = "w-12 h-12" 
}: { 
  id: number; 
  className?: string;
}) {
  const charId = (id >= 1 && id <= 20) ? id : 1;

  // Render SVG based on charId using clean Facebook Blue, Light Blue, White & Slate
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-2xl bg-blue-50 border border-blue-200 overflow-hidden shadow-sm ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background base */}
        <rect width="64" height="64" rx="16" fill="#EFF6FF" />
        <circle cx="32" cy="32" r="28" fill="#DBEAFE" fillOpacity="0.5" />

        {/* 1. Mandor Helm (Safety Hardhat) */}
        {charId === 1 && (
          <g>
            <circle cx="32" cy="36" r="14" fill="#BFDBFE" />
            <path d="M18 28 C18 17, 46 17, 46 28 Z" fill="#1877F2" />
            <rect x="14" y="27" width="36" height="4" rx="2" fill="#1D4ED8" />
            <rect x="29" y="19" width="6" height="5" rx="1" fill="#FFFFFF" />
            <circle cx="27" cy="36" r="2" fill="#1E293B" />
            <circle cx="37" cy="36" r="2" fill="#1E293B" />
            <path d="M28 42 Q32 45 36 42" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
            <path d="M20 54 Q32 50 44 54" fill="#1877F2" />
          </g>
        )}

        {/* 2. Arsitek Desain (Glasses & Blueprint) */}
        {charId === 2 && (
          <g>
            <circle cx="32" cy="34" r="14" fill="#BFDBFE" />
            <path d="M20 25 C24 18, 40 18, 44 25" fill="#1877F2" />
            <rect x="22" y="31" width="8" height="6" rx="2" stroke="#1D4ED8" strokeWidth="2" fill="none" />
            <rect x="34" y="31" width="8" height="6" rx="2" stroke="#1D4ED8" strokeWidth="2" fill="none" />
            <line x1="30" y1="34" x2="34" y2="34" stroke="#1D4ED8" strokeWidth="2" />
            <circle cx="26" cy="34" r="1.5" fill="#1E293B" />
            <circle cx="38" cy="34" r="1.5" fill="#1E293B" />
            <path d="M29 41 Q32 43 35 41" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="18" y="48" width="28" height="12" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 3. Insinyur Sipil (Tech Cap) */}
        {charId === 3 && (
          <g>
            <circle cx="32" cy="35" r="14" fill="#BFDBFE" />
            <path d="M19 25 C23 19, 41 19, 45 25" fill="#1D4ED8" />
            <path d="M20 25 L48 24 L46 29 L20 29 Z" fill="#1877F2" />
            <circle cx="27" cy="35" r="2" fill="#1E293B" />
            <circle cx="37" cy="35" r="2" fill="#1E293B" />
            <path d="M28 41 Q32 44 36 41" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
            <path d="M43 33 C46 33, 46 39, 43 39" stroke="#1877F2" strokeWidth="2" fill="none" />
            <rect x="20" y="49" width="24" height="12" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 4. Manajer Proyek (Executive Collar & Tie) */}
        {charId === 4 && (
          <g>
            <circle cx="32" cy="32" r="13" fill="#BFDBFE" />
            <path d="M20 24 C23 18, 41 18, 44 24" fill="#1E293B" />
            <circle cx="27" cy="32" r="1.8" fill="#1E293B" />
            <circle cx="37" cy="32" r="1.8" fill="#1E293B" />
            <path d="M29 38 Q32 40 35 38" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 52 C16 46, 48 46, 48 52 L48 64 L16 64 Z" fill="#1877F2" />
            <polygon points="28,47 32,54 36,47 32,45" fill="#FFFFFF" />
            <polygon points="31,52 33,52 34,60 30,60" fill="#1D4ED8" />
          </g>
        )}

        {/* 5. Pemilik Toko (Vendor Apron & Smile) */}
        {charId === 5 && (
          <g>
            <circle cx="32" cy="33" r="14" fill="#BFDBFE" />
            <path d="M21 23 C25 18, 39 18, 43 23" fill="#1D4ED8" />
            <circle cx="26" cy="33" r="2" fill="#1E293B" />
            <circle cx="38" cy="33" r="2" fill="#1E293B" />
            <path d="M26 39 Q32 45 38 39" stroke="#1877F2" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="18" y="47" width="28" height="15" rx="3" fill="#1877F2" />
            <circle cx="32" cy="53" r="3" fill="#FFFFFF" />
          </g>
        )}

        {/* 6. Supir Logistik (Trucker Cap) */}
        {charId === 6 && (
          <g>
            <circle cx="32" cy="35" r="13" fill="#BFDBFE" />
            <path d="M18 26 C20 18, 44 18, 46 26 Z" fill="#1877F2" />
            <rect x="16" y="25" width="34" height="4" rx="2" fill="#1D4ED8" />
            <circle cx="27" cy="36" r="2" fill="#1E293B" />
            <circle cx="37" cy="36" r="2" fill="#1E293B" />
            <path d="M28 42 Q32 44 36 42" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
            <rect x="18" y="49" width="28" height="13" rx="4" fill="#1D4ED8" />
            <line x1="28" y1="53" x2="36" y2="53" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )}

        {/* 7. Tukang Besi (Welder Visor) */}
        {charId === 7 && (
          <g>
            <circle cx="32" cy="35" r="13" fill="#BFDBFE" />
            <path d="M19 24 C23 16, 41 16, 45 24 Z" fill="#1E293B" />
            <rect x="20" y="27" width="24" height="10" rx="3" fill="#1877F2" stroke="#1E293B" strokeWidth="1.5" />
            <rect x="25" y="30" width="14" height="4" rx="1" fill="#FFFFFF" />
            <path d="M28 43 Q32 45 36 43" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
            <rect x="18" y="49" width="28" height="13" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 8. Pengawas Mutu (QC Inspector) */}
        {charId === 8 && (
          <g>
            <circle cx="32" cy="33" r="14" fill="#BFDBFE" />
            <path d="M21 23 C24 17, 40 17, 43 23 Z" fill="#1877F2" />
            <circle cx="27" cy="33" r="2" fill="#1E293B" />
            <circle cx="37" cy="33" r="2" fill="#1E293B" />
            <path d="M29 39 Q32 41 35 39" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            {/* Magnifying glass badge */}
            <circle cx="43" cy="43" r="5" stroke="#1D4ED8" strokeWidth="2" fill="#FFFFFF" />
            <line x1="47" y1="47" x2="52" y2="52" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="18" y="48" width="28" height="14" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 9. Robot SCM (High-Tech Mascot) */}
        {charId === 9 && (
          <g>
            <rect x="20" y="22" width="24" height="20" rx="6" fill="#1877F2" />
            <line x1="32" y1="22" x2="32" y2="15" stroke="#1877F2" strokeWidth="2.5" />
            <circle cx="32" cy="14" r="3" fill="#60A5FA" />
            <rect x="24" y="27" width="6" height="5" rx="1.5" fill="#FFFFFF" />
            <rect x="34" y="27" width="6" height="5" rx="1.5" fill="#FFFFFF" />
            <circle cx="27" cy="29.5" r="1.5" fill="#1D4ED8" />
            <circle cx="37" cy="29.5" r="1.5" fill="#1D4ED8" />
            <rect x="26" y="36" width="12" height="2.5" rx="1" fill="#FFFFFF" />
            <rect x="18" y="44" width="28" height="16" rx="5" fill="#1D4ED8" />
            <circle cx="32" cy="51" r="3" fill="#60A5FA" />
          </g>
        )}

        {/* 10. Beruang Mandor (Cute Bear with Hardhat) */}
        {charId === 10 && (
          <g>
            {/* Bear ears */}
            <circle cx="21" cy="21" r="6" fill="#1E293B" />
            <circle cx="43" cy="21" r="6" fill="#1E293B" />
            <circle cx="32" cy="35" r="15" fill="#BFDBFE" />
            <path d="M19 25 C19 16, 45 16, 45 25 Z" fill="#1877F2" />
            <rect x="16" y="24" width="32" height="4" rx="2" fill="#1D4ED8" />
            <circle cx="27" cy="34" r="2" fill="#1E293B" />
            <circle cx="37" cy="34" r="2" fill="#1E293B" />
            <ellipse cx="32" cy="40" rx="5" ry="3.5" fill="#FFFFFF" />
            <circle cx="32" cy="39" r="1.5" fill="#1E293B" />
            <rect x="20" y="50" width="24" height="12" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 11. Kucing Arsitek (Cute Cat) */}
        {charId === 11 && (
          <g>
            {/* Cat ears */}
            <polygon points="18,17 26,27 16,27" fill="#1877F2" />
            <polygon points="46,17 48,27 38,27" fill="#1877F2" />
            <circle cx="32" cy="36" r="14" fill="#BFDBFE" />
            <circle cx="26" cy="35" r="2" fill="#1E293B" />
            <circle cx="38" cy="35" r="2" fill="#1E293B" />
            <polygon points="32,39 30,37 34,37" fill="#1D4ED8" />
            <path d="M29 41 Q32 43 35 41" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            {/* Whiskers */}
            <line x1="17" y1="37" x2="23" y2="38" stroke="#1877F2" strokeWidth="1.5" />
            <line x1="41" y1="38" x2="47" y2="37" stroke="#1877F2" strokeWidth="1.5" />
            <rect x="20" y="50" width="24" height="12" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 12. Burung Hantu (Wise Owl) */}
        {charId === 12 && (
          <g>
            <circle cx="32" cy="36" r="15" fill="#BFDBFE" />
            {/* Large owl eyes */}
            <circle cx="25" cy="33" r="6" fill="#FFFFFF" stroke="#1877F2" strokeWidth="2" />
            <circle cx="39" cy="33" r="6" fill="#FFFFFF" stroke="#1877F2" strokeWidth="2" />
            <circle cx="25" cy="33" r="2.5" fill="#1E293B" />
            <circle cx="39" cy="33" r="2.5" fill="#1E293B" />
            <polygon points="32,37 29,42 35,42" fill="#1D4ED8" />
            <polygon points="20,18 32,24 44,18 32,15" fill="#1877F2" />
            <rect x="20" y="51" width="24" height="11" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 13. Singa Pemimpin (Leader Lion) */}
        {charId === 13 && (
          <g>
            {/* Lion Mane */}
            <circle cx="32" cy="34" r="18" fill="#1877F2" />
            <circle cx="32" cy="35" r="12" fill="#DBEAFE" />
            <circle cx="28" cy="33" r="1.8" fill="#1E293B" />
            <circle cx="36" cy="33" r="1.8" fill="#1E293B" />
            <polygon points="32,38 30,36 34,36" fill="#1D4ED8" />
            <path d="M29 40 Q32 42 35 40" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="20" y="51" width="24" height="11" rx="4" fill="#1D4ED8" />
          </g>
        )}

        {/* 14. Rubah Cerdik (Smart Fox) */}
        {charId === 14 && (
          <g>
            <polygon points="17,16 26,28 15,28" fill="#1D4ED8" />
            <polygon points="47,16 49,28 38,28" fill="#1D4ED8" />
            <circle cx="32" cy="36" r="14" fill="#BFDBFE" />
            <circle cx="26" cy="34" r="2" fill="#1E293B" />
            <circle cx="38" cy="34" r="2" fill="#1E293B" />
            <polygon points="32,41 29,38 35,38" fill="#1877F2" />
            <rect x="42" y="24" width="3" height="10" rx="1" fill="#60A5FA" transform="rotate(30 42 24)" />
            <rect x="20" y="50" width="24" height="12" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 15. Penguin Logistik (Cute Penguin) */}
        {charId === 15 && (
          <g>
            <ellipse cx="32" cy="37" rx="14" ry="16" fill="#1E293B" />
            <ellipse cx="32" cy="38" rx="9" ry="12" fill="#FFFFFF" />
            <circle cx="28" cy="33" r="2" fill="#1E293B" />
            <circle cx="36" cy="33" r="2" fill="#1E293B" />
            <polygon points="32,36 29,39 35,39" fill="#1877F2" />
            <rect x="22" y="47" width="20" height="9" rx="3" fill="#1877F2" />
          </g>
        )}

        {/* 16. Surveyor Ukur (Laser Scope) */}
        {charId === 16 && (
          <g>
            <circle cx="32" cy="34" r="13" fill="#BFDBFE" />
            <path d="M19 24 C23 18, 41 18, 45 24 Z" fill="#1877F2" />
            <circle cx="27" cy="34" r="2" fill="#1E293B" />
            <circle cx="37" cy="34" r="2" fill="#1E293B" />
            <path d="M28 40 Q32 42 36 40" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="43" y="27" width="10" height="12" rx="2" fill="#1D4ED8" />
            <circle cx="48" cy="33" r="3" fill="#60A5FA" />
            <rect x="18" y="48" width="28" height="14" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 17. Ibu Bos Vendor (Distributor Utama) */}
        {charId === 17 && (
          <g>
            <circle cx="32" cy="34" r="13" fill="#BFDBFE" />
            {/* Hair */}
            <path d="M17 32 C17 20, 47 20, 47 32 L47 38 C44 36, 40 38, 40 33 C38 23, 26 23, 24 33 C24 38, 20 36, 17 38 Z" fill="#1877F2" />
            <circle cx="27" cy="33" r="2" fill="#1E293B" />
            <circle cx="37" cy="33" r="2" fill="#1E293B" />
            <path d="M29 39 Q32 42 35 39" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" />
            <rect x="18" y="48" width="28" height="14" rx="5" fill="#1D4ED8" />
            <circle cx="32" cy="53" r="2" fill="#FFFFFF" />
          </g>
        )}

        {/* 18. Teknisi Listrik (Power Badge) */}
        {charId === 18 && (
          <g>
            <circle cx="32" cy="36" r="14" fill="#BFDBFE" />
            <path d="M18 26 C18 16, 46 16, 46 26 Z" fill="#1D4ED8" />
            <polygon points="33,18 30,22 33,22 31,26 35,21 32,21" fill="#FFFFFF" />
            <circle cx="27" cy="36" r="2" fill="#1E293B" />
            <circle cx="37" cy="36" r="2" fill="#1E293B" />
            <path d="M28 42 Q32 44 36 42" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="18" y="50" width="28" height="12" rx="4" fill="#1877F2" />
          </g>
        )}

        {/* 19. Bintang Supplier (Star Hero) */}
        {charId === 19 && (
          <g>
            <circle cx="32" cy="34" r="13" fill="#BFDBFE" />
            <path d="M20 23 C24 17, 40 17, 44 23 Z" fill="#1877F2" />
            <circle cx="27" cy="33" r="2" fill="#1E293B" />
            <circle cx="37" cy="33" r="2" fill="#1E293B" />
            <path d="M28 39 Q32 42 36 39" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
            <rect x="18" y="48" width="28" height="14" rx="4" fill="#1877F2" />
            <polygon points="32,49 33.5,53 37.5,53 34,55.5 35.5,59.5 32,57 28.5,59.5 30,55.5 26.5,53 30.5,53" fill="#FFFFFF" />
          </g>
        )}

        {/* 20. Maskot Renovki (Rocket Shield) */}
        {charId === 20 && (
          <g>
            <path d="M22 18 C22 18, 32 14, 42 18 C42 34, 32 46, 32 46 C32 46, 22 34, 22 18 Z" fill="#1877F2" />
            <path d="M26 22 C26 22, 32 19, 38 22 C38 32, 32 40, 32 40 C32 40, 26 32, 26 22 Z" fill="#FFFFFF" />
            {/* Rocket */}
            <path d="M32 24 C34 27, 34 32, 32 34 C30 32, 30 27, 32 24 Z" fill="#1877F2" />
            <circle cx="32" cy="27" r="1.5" fill="#FFFFFF" />
            <polygon points="30,33 27,35 29,31" fill="#1D4ED8" />
            <polygon points="34,33 37,35 35,31" fill="#1D4ED8" />
            <rect x="20" y="50" width="24" height="12" rx="4" fill="#1D4ED8" />
          </g>
        )}
      </svg>
    </div>
  );
}
