/**
 * GOOGLE APPS SCRIPT: WEB APP RECEIVER (VERSION 3 - FINAL)
 * Mendukung Sinkronisasi Realtime per Lokasi dari Web App.
 * 
 * Petunjuk:
 * 1. Tempel di Extensions > Apps Script.
 * 2. Deploy > New Deployment > Web App.
 * 3. Set "Who has access" ke "Anyone".
 * 4. Klik Deploy dan salin URL-nya.
 */

function doGet(e) {
  return handleRequest(e.parameter);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return handleRequest(data);
  } catch (err) {
    // Jika JSON gagal, coba ambil dari parameter
    return handleRequest(e.parameter);
  }
}

function handleRequest(data) {
  try {
    if (!data || Object.keys(data).length === 0) {
      return createResponse({"result": "error", "message": "No data received"});
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // Gunakan 'lokasi' dari payload sebagai nama sheet
    var sheetName = data.lokasi || "Umum";
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
    
    // Header sesuai permintaan Anda
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
    
    var nextNo = sheet.getLastRow();
    
    // Mapping data dari payload kirimKeDone
    sheet.appendRow([
      nextNo,
      data.tanggal_request || "-",
      data.nama_barang || "-",
      data.jumlah || 0,
      data.satuan || "-",
      data.tanggal_diperlukan || "-",
      data.tanggal_diterima || new Date().toLocaleDateString('id-ID'),
      data.penerima || "-",
      data.pengantar || "-",
      "Done"
    ]);
    
    return createResponse({"result": "success", "sheet": sheetName});
      
  } catch (err) {
    return createResponse({"result": "error", "error": err.toString()});
  }
}

function createResponse(output) {
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

