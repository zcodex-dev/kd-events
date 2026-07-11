import QRCode from 'qrcode';

/**
 * Generate a QR code as a data URL (PNG format, base64-encoded).
 * Uses plain black-and-white styling.
 */
export async function generateQRCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generate a QR code as a Buffer (PNG format).
 * Useful for downloading the QR code as a file.
 */
export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
    type: 'png',
  });
}
