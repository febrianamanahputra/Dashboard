/**
 * GOOGLE APPS SCRIPT: WEB APP RECEIVER
 * Tempel kode ini di Extensions > Apps Script pada Google Sheet Kamu.
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Material_Selesai") || ss.insertSheet("Material_Selesai");
    
    // Setup Header jika sheet kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Tanggal Selesai", "ID Permintaan", "Lokasi", "Material", "Jumlah", "Satuan", "Status"]);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    // Tambahkan data ke baris baru
    sheet.appendRow([
      new Date().toLocaleString('id-ID'),
      data.id,
      data.locationName,
      data.materialName,
      data.quantity,
      data.unit.toUpperCase(),
      data.status.toUpperCase()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"result": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "error": err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
