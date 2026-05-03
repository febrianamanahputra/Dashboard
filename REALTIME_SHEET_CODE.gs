/**
 * GOOGLE APPS SCRIPT UNTUK SINKSORISASI REALTIME FIRESTORE -> GOOGLE SHEETS
 * 
 * Petunjuk Penggunaan:
 * 1. Buka Google Sheet Anda.
 * 2. Klik Extensions > Apps Script.
 * 3. Hapus semua kode dan tempel kode di bawah ini.
 * 4. Tambahkan Library "FirestoreGoogleAppsScript":
 *    - Klik "+" di samping "Libraries".
 *    - Masukkan Script ID: 1VUSl4b1Ah9vH_SNozdf967D6Fv-7p9oA8C9Xn2vE9rR1s-p37nGo
 *    - Pilih versi terbaru, lalu klik Add.
 * 5. Buka Firebase Console > Project Settings > Service Accounts.
 * 6. Klik "Generate New Private Key" dan simpan file JSON-nya.
 * 7. Isi variabel 'config' di bawah dengan data dari file JSON tersebut.
 */

const config = {
  "project_id": "MASUKKAN_PROJECT_ID_DISINI",
  "client_email": "MASUKKAN_CLIENT_EMAIL_DISINI",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMASUKKAN_PRIVATE_KEY_DISINI\n-----END PRIVATE KEY-----\n"
};

function syncFirestoreToSheet() {
  const firestore = FirestoreApp.getFirestore(config.client_email, config.private_key, config.project_id);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Requests") || ss.insertSheet("Requests");
  
  // Ambil data dari koleksi 'requests'
  const documents = firestore.getDocuments("requests");
  
  // Header
  const rows = [["ID", "Material", "Jumlah", "Status", "Lokasi ID", "Batas", "Dibuat"]];
  
  documents.forEach(function(doc) {
    const data = doc.fields;
    rows.push([
      doc.name.split('/').pop(),
      data.materialName || "",
      data.quantity || 0,
      data.status || "",
      data.locationId || "",
      data.dateNeeded || "",
      new Date(data.createdAt || 0).toLocaleString()
    ]);
  });
  
  // Update Sheet
  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

// SETUP TRIGGER OTOMATIS:
// Klik ikon jam (Triggers) di sebelah kiri Apps Script.
// Klik "+ Add Trigger".
// Pilih fungsi 'syncFirestoreToSheet'.
// Pilih event source 'Time-driven'.
// Pilih interval 'Every minute' (agar realtime).
