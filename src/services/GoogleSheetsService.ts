
export interface SpreadsheetRow {
  requestId: string;
  materialName: string;
  quantity: string;
  unit: string;
  dateRequested: string;
  dateNeeded: string;
  location: string;
  status: string;
  recipient: string;
  deliverer: string;
  timestamp: string;
}

export class GoogleSheetsService {
  private static SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;

  static async appendRequest(accessToken: string, row: SpreadsheetRow) {
    if (!this.SPREADSHEET_ID) {
      console.warn('VITE_SPREADSHEET_ID is not set. Data not synced to Google Sheets.');
      return;
    }

    try {
      const values = [[
        row.requestId,
        row.materialName,
        row.quantity,
        row.unit,
        row.dateRequested,
        row.dateNeeded,
        row.location,
        row.status,
        row.recipient,
        row.deliverer,
        row.timestamp
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Sheets API Error: ${error.error?.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to sync to Google Sheets:', error);
      throw error;
    }
  }

  static async initializeSheet(accessToken: string) {
    if (!this.SPREADSHEET_ID) return;

    try {
      const headers = [[
        'ID Request',
        'Nama Material',
        'Jumlah',
        'Satuan',
        'Tgl Request',
        'Tgl Dibutuhkan',
        'Lokasi',
        'Status',
        'Penerima',
        'Pengantar',
        'Update Terakhir'
      ]];

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/Sheet1!A1:K1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: headers
          })
        }
      );
    } catch (error) {
      console.error('Failed to initialize Sheet headers:', error);
    }
  }
}
