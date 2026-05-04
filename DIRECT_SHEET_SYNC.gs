/**
 * GOOGLE APPS SCRIPT: WEB APP RECEIVER (VERSION 2)
 * Hubungkan data dari Web App langsung ke Spreadsheet per Lokasi
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Gunakan nama lokasi sebagai nama sheet (misal: "Proyek A")
    var sheetName = data.locationName || "Umum";
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    
    // Setup Header jika sheet baru/kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "No", 
        "Tanggal Request", 
        "Nama Barang", 
        "Jumlah", 
        "Satuan", 
        "Tanggal Diperlukan", 
        "Tanggal Diterima", 
        "Penerima", 
        "Pengantar", 
        "Status"
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f3f3f3");
    }
    
    var nextNo = sheet.getLastRow(); // Anggap baris 1 adalah header
    
    // Tambahkan data ke baris baru
    sheet.appendRow([
      nextNo,
      data.dateRequested,
      data.materialName,
      data.quantity,
      data.unit,
      data.dateNeeded,
      data.dateReceived,
      data.recipient || "-",
      data.deliverer || "-",
      "Done"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"result": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "error": err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
