import { google } from 'googleapis';

export async function getGoogleSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // Replace escaped newline characters from the env string
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: 'v4', auth: client as any });

    return googleSheets;
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error);
    return null;
  }
}

export async function checkMemberStatus(name: string) {
  const sheets = await getGoogleSheetsClient();
  if (!sheets) return { isMember: false, memberId: null, error: 'Google Sheets client not initialized' };

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:B', // Searching in Sheet1 based on user input
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return { isMember: false, memberId: null };

    // Find the row where the name matches (case-insensitive)
    const normalizedSearchName = name.trim().toLowerCase();
    
    // Skip header row usually, so start from 1, or just search all
    for (let i = 1; i < rows.length; i++) {
      const rowName = rows[i][0];
      const memberId = rows[i][1];
      
      if (rowName && rowName.trim().toLowerCase() === normalizedSearchName) {
        return { isMember: true, memberId: memberId || 'UNKNOWN_ID' };
      }
    }

    return { isMember: false, memberId: null };
  } catch (error) {
    console.error('Error reading member list:', error);
    return { isMember: false, memberId: null, error: 'Failed to read Google Sheet' };
  }
}

export async function recordRegistration(data: {
  name: string;
  contact?: string;
  isMember: boolean;
  memberId?: string | null;
}) {
  const sheets = await getGoogleSheetsClient();
  if (!sheets) return false;

  try {
    const tabName = data.isMember ? 'Member' : 'None-Register';
    
    // Format: Member Name | Member ID | Contact | Register Date
    const dateStr = new Date().toISOString();
    
    const rowData = [
      data.name,
      data.memberId || 'N/A',
      data.contact || 'N/A',
      dateStr
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${tabName}!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return true;
  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    return false;
  }
}
