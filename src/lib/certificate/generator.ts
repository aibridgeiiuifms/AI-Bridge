import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import * as opentype from 'opentype.js';

export interface StampingInput {
  certificateId: string;
  recipientName: string;
}

/**
 * In-memory font cache for opentype.js to avoid re-reading disk on every request
 */
let cachedTimesFont: opentype.Font | null = null;
let cachedArialFont: opentype.Font | null = null;

function getCachedFont(fileName: string, fallbackGetter: () => opentype.Font | null): opentype.Font | null {
  const fontPath = path.join(process.cwd(), 'Assets', 'fonts', fileName);
  if (!fs.existsSync(fontPath)) return null;
  const buf = fs.readFileSync(fontPath);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

function getTimesFont(): opentype.Font | null {
  if (!cachedTimesFont) {
    cachedTimesFont = getCachedFont('TimesBold.ttf', () => null);
  }
  return cachedTimesFont;
}

function getArialFont(): opentype.Font | null {
  if (!cachedArialFont) {
    cachedArialFont = getCachedFont('ArialBold.ttf', () => null);
  }
  return cachedArialFont;
}

import { normalizePdfText, formatCertificateName } from './name-formatter';
export { normalizePdfText, formatCertificateName };

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
  const cleanName = formatCertificateName(input.recipientName);

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

/**
 * Creates the official high-resolution PNG certificate on the spot in RAM using Sharp & OpenType.js.
 * Renders text as PURE VECTOR PATHS (<path d="..."/>) guaranteeing 100% font rendering on Linux/Vercel
 * with ZERO OS font dependency.
 */
export async function stampCertificatePngOnTheSpot(input: StampingInput): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'Assets', 'AI_BRIDGE_Certificate_Template.png');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Certificate PNG template not found at: ${templatePath}`);
  }

  // 1. Clean and normalize the recipient name (Title Case)
  const cleanName = formatCertificateName(input.recipientName);

  // 2. Load bundled vector fonts
  const timesFont = getTimesFont();
  const arialFont = getArialFont();

  // Dynamic font sizing (Base 112px, Max width 1400px)
  const maxPx = 1400;
  let fontSize = 112;

  let nameSvgFragment: string;
  let sublabelSvgFragment: string;

  if (timesFont) {
    const initialBbox = timesFont.getPath(cleanName, 0, 0, fontSize).getBoundingBox();
    const initialWidth = initialBbox.x2 - initialBbox.x1;
    if (initialWidth > maxPx) {
      fontSize = Math.floor((maxPx / initialWidth) * fontSize);
    }
    const namePathData = timesFont.getPath(cleanName, 190, 1006, fontSize).toPathData(2);
    nameSvgFragment = `<path d="${namePathData}" fill="#0a2756" />`;
  } else {
    // Fallback if font file fails to load
    const safeName = cleanName
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    nameSvgFragment = `<text x="190" y="1006" font-family="'Times New Roman', 'Liberation Serif', serif" font-weight="bold" font-size="${fontSize}" fill="#0a2756">${safeName}</text>`;
  }

  if (arialFont) {
    const sub1Path = arialFont.getPath('Scan to verify', 2319, 1775, 22).toPathData(2);
    const sub2Path = arialFont.getPath('certificate', 2338, 1802, 22).toPathData(2);
    sublabelSvgFragment = `
      <path d="${sub1Path}" fill="#ffffff" />
      <path d="${sub2Path}" fill="#ffffff" />
    `;
  } else {
    sublabelSvgFragment = `
      <text x="2319" y="1775" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="22" fill="#ffffff">Scan to verify</text>
      <text x="2338" y="1802" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="22" fill="#ffffff">certificate</text>
    `;
  }

  // 3. Generate QR code
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const baseUrl = (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1'))
    ? envUrl.replace(/\/+$/, '')
    : 'https://ai-bridge-iiui.vercel.app';
  const verifyUrl = `${baseUrl}/verify/${input.certificateId}`;

  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 200,
    margin: 1,
    color: { dark: '#0a2756', light: '#ffffff' },
  });

  // 4. Pure Vector SVG Overlay
  const svgOverlay = `
  <svg width="2880" height="2037" xmlns="http://www.w3.org/2000/svg">
    ${nameSvgFragment}
    <!-- White backing card for QR -->
    <rect x="2278" y="1529" width="216" height="216" fill="#ffffff" rx="4" />
    ${sublabelSvgFragment}
  </svg>
  `;

  // 5. Composite Sharp layers in memory and return high-res PNG buffer
  return await sharp(templatePath)
    .composite([
      { input: Buffer.from(svgOverlay), top: 0, left: 0 },
      { input: qrBuffer, top: 1537, left: 2286 },
    ])
    .png({ quality: 95 })
    .toBuffer();
}
