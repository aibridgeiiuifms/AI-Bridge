import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export interface StampingInput {
  certificateId: string;
  recipientName: string;
}

/**
 * Normalizes unicode strings to standard characters supported by WinAnsi / standard PDF fonts.
 * Converts smart quotes, special dashes, and decomposed unicode to prevent pdf-lib encoding errors.
 */
function normalizePdfText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKD')
    // Remove diacritical marks/accents
    .replace(/[\u0300-\u036f]/g, '')
    // Replace smart quotes and special characters
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    // Replace any remaining non-standard characters with safe equivalent
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

/**
 * Creates the official PDF certificate on the spot in RAM (~50-80ms).
 * No file is saved to disk or Supabase storage.
 */
export async function stampCertificatePdfOnTheSpot(input: StampingInput): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), 'Assets', 'AI_BRIDGE_Certificate_Cleaned.pdf');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Certificate template not found at: ${templatePath}`);
  }

  const templateBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];

  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSans = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 1. Clean and normalize the recipient name for PDF encoding
  const cleanName = normalizePdfText(input.recipientName) || 'Participant';

  // 2. Calculate dynamic font size (Base: 56pt, Max width: 700pt)
  const maxNameWidth = 700;
  let nameSize = 56;
  const initialWidth = fontBold.widthOfTextAtSize(cleanName, nameSize);
  if (initialWidth > maxNameWidth) {
    nameSize = Math.floor((maxNameWidth / initialWidth) * nameSize);
  }

  // 3. Stamp Clean Name in Deep Navy (#0a2756 -> rgb(0.0392, 0.1530, 0.3370))
  // Baseline position: x = 94.80, y = 515.47 (sits 13.4pt above gold underline rule at y=502.08)
  page.drawText(cleanName, {
    x: 94.80,
    y: 515.47,
    size: nameSize,
    font: fontBold,
    color: rgb(0.0392, 0.1530, 0.3370),
  });

  // 4. Generate QR Code targeting the live Vercel deployment (or custom production domain)
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const baseUrl = (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1'))
    ? envUrl.replace(/\/+$/, '')
    : 'https://ai-bridge-iiui.vercel.app';
  const verifyUrl = `${baseUrl}/verify/${input.certificateId}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 250,
    margin: 1,
    color: { dark: '#0a2756', light: '#ffffff' },
  });

  // 5. Stamp High-Contrast White Backing Card for QR code
  const qrX = 1143.08;
  const qrY = 150.00;
  const qrSize = 100.0;

  page.drawRectangle({
    x: qrX - 4,
    y: qrY - 4,
    width: qrSize + 8,
    height: qrSize + 8,
    color: rgb(1, 1, 1),
  });

  // 6. Embed and draw QR image
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // 7. Stamp White Sub-Labels below QR
  page.drawText('Scan to verify', {
    x: 1159.56,
    y: 130.94,
    size: 11.0,
    font: fontSans,
    color: rgb(1, 1, 1),
  });

  page.drawText('certificate', {
    x: 1168.94,
    y: 117.62,
    size: 11.0,
    font: fontSans,
    color: rgb(1, 1, 1),
  });

  // Return generated binary PDF directly
  return await pdfDoc.save();
}
