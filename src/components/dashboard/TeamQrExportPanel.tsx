'use client';

import { useMemo, useState } from 'react';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Download, FileArchive, FileText, QrCode } from 'lucide-react';
import { slugifyTeamProfileName } from '@/lib/teamProfileSlug';

interface TeamQrMember {
  id: string;
  profile_slug: string | null;
  full_name: string;
  designation: string | null;
  team_tag: string | null;
  avatar_url: string | null;
  is_published: boolean;
}

interface TeamQrExportPanelProps {
  members: TeamQrMember[];
}

const QR_OPTIONS = { width: 600, margin: 2, errorCorrectionLevel: 'H' as const };

function getProfileUrl(member: TeamQrMember): string {
  if (!member.profile_slug) {
    throw new Error(`Save a profile URL for ${member.full_name} before generating its QR code.`);
  }
  return `${window.location.origin}/team/${encodeURIComponent(member.profile_slug)}`;
}

function getFilename(member: TeamQrMember, allMembers: TeamQrMember[]): string {
  const baseName = slugifyTeamProfileName(member.full_name);
  const matchingNames = allMembers.filter(
    (candidate) => slugifyTeamProfileName(candidate.full_name) === baseName
  );
  const duplicateNumber = matchingNames.findIndex((candidate) => candidate.id === member.id);
  const suffix = matchingNames.length > 1 ? `-${duplicateNumber + 1}` : '';
  return `${baseName}${suffix}.png`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function createProfilePdf(members: TeamQrMember[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 24;
  const gap = 14;
  const cardWidth = (pageWidth - margin * 2 - gap) / 2;
  const cardHeight = (pageHeight - margin * 2 - gap) / 2;
  const green = rgb(0.02, 0.31, 0.23);

  for (let start = 0; start < members.length; start += 4) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    const pageMembers = members.slice(start, start + 4);

    for (let index = 0; index < pageMembers.length; index += 1) {
      const member = pageMembers[index];
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + column * (cardWidth + gap);
      const y = pageHeight - margin - cardHeight - row * (cardHeight + gap);
      const top = y + cardHeight;

      page.drawRectangle({
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.82, 0.88, 0.84),
        borderWidth: 1,
      });
      page.drawRectangle({
        x,
        y: top - 7,
        width: cardWidth,
        height: 7,
        color: green,
      });
      page.drawText('THE AI BRIDGE  |  IIUI FMS', {
        x: x + 14,
        y: top - 28,
        size: 8,
        font: bold,
        color: green,
      });

      const qrDataUrl = await QRCode.toDataURL(getProfileUrl(member), QR_OPTIONS);
      const qrBytes = await (await fetch(qrDataUrl)).arrayBuffer();
      const qrImage = await pdf.embedPng(qrBytes);
      const qrSize = 116;
      page.drawImage(qrImage, {
        x: x + (cardWidth - qrSize) / 2,
        y: top - 165,
        width: qrSize,
        height: qrSize,
      });

      let avatarDrawn = false;
      if (member.avatar_url) {
        try {
          const response = await fetch(member.avatar_url);
          if (response.ok) {
            const imageBytes = await response.arrayBuffer();
            const contentType = response.headers.get('content-type')?.toLowerCase() || '';
            const avatar = contentType.includes('png')
              ? await pdf.embedPng(imageBytes)
              : contentType.includes('jpeg') || contentType.includes('jpg')
                ? await pdf.embedJpg(imageBytes)
                : null;
            if (avatar) {
              page.drawImage(avatar, {
                x: x + 16,
                y: top - 104,
                width: 52,
                height: 52,
              });
              avatarDrawn = true;
            }
          }
        } catch {
          // Keep the printable card usable if the optional remote photo is unavailable.
        }
      }
      if (!avatarDrawn) {
        const initials = member.full_name
          .split(/\s+/)
          .map((part) => part[0] || '')
          .join('')
          .slice(0, 2)
          .toUpperCase();
        page.drawEllipse({
          x: x + 42,
          y: top - 78,
          xScale: 26,
          yScale: 26,
          color: green,
        });
        page.drawText(initials, {
          x: x + 28,
          y: top - 82,
          size: 12,
          font: bold,
          color: rgb(1, 1, 1),
          maxWidth: 28,
        });
      }

      const nameSize = member.full_name.length > 28 ? 12 : 15;
      page.drawText(member.full_name, {
        x: x + 14,
        y: top - 190,
        size: nameSize,
        font: bold,
        color: rgb(0.12, 0.16, 0.2),
        maxWidth: cardWidth - 28,
      });
      page.drawText(member.designation || 'AI Bridge team member', {
        x: x + 14,
        y: top - 210,
        size: 9,
        font,
        color: rgb(0.2, 0.42, 0.34),
        maxWidth: cardWidth - 28,
      });
      page.drawText(member.team_tag || 'AI Bridge', {
        x: x + 14,
        y: top - 228,
        size: 8,
        font: bold,
        color: rgb(0.55, 0.43, 0.22),
        maxWidth: cardWidth - 28,
      });
      page.drawText(getProfileUrl(member), {
        x: x + 14,
        y: y + 18,
        size: 7,
        font,
        color: green,
        maxWidth: cardWidth - 28,
      });
    }
  }

  return pdf.save();
}

export default function TeamQrExportPanel({ members }: TeamQrExportPanelProps) {
  const publishedMembers = useMemo(
    () => members.filter((member) => member.is_published),
    [members]
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<'png' | 'zip' | 'pdf' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedMembers = publishedMembers.filter((member) => selectedIds.has(member.id));

  const downloadPng = async (member: TeamQrMember) => {
    setBusy('png');
    setMessage(null);
    try {
      const dataUrl = await QRCode.toDataURL(getProfileUrl(member), QR_OPTIONS);
      const response = await fetch(dataUrl);
      downloadBlob(await response.blob(), getFilename(member, publishedMembers));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not generate the QR PNG.');
    } finally {
      setBusy(null);
    }
  };

  const downloadZip = async () => {
    if (!selectedMembers.length) return;
    setBusy('zip');
    setMessage(null);
    try {
      const zip = new JSZip();
      await Promise.all(selectedMembers.map(async (member) => {
        const dataUrl = await QRCode.toDataURL(getProfileUrl(member), QR_OPTIONS);
        const response = await fetch(dataUrl);
        zip.file(getFilename(member, publishedMembers), await response.blob());
      }));
      downloadBlob(await zip.generateAsync({ type: 'blob' }), 'team-member-qr-codes.zip');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the QR ZIP.');
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    if (!selectedMembers.length) return;
    setBusy('pdf');
    setMessage(null);
    try {
      const bytes = await createProfilePdf(selectedMembers);
      const pdfBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(pdfBuffer).set(bytes);
      downloadBlob(new Blob([pdfBuffer], { type: 'application/pdf' }), 'team-member-qr-cards.pdf');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the QR PDF.');
    } finally {
      setBusy(null);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5" aria-labelledby="team-qr-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="team-qr-heading" className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <QrCode className="h-4 w-4 text-emerald-700" />
            Team profile QR codes
          </h3>
          <p className="mt-1 text-[11px] text-slate-600">Export published profiles only. QR codes open each member’s public profile.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadZip} disabled={!selectedMembers.length || Boolean(busy)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">
            <FileArchive className="h-3.5 w-3.5" /> {busy === 'zip' ? 'Creating ZIP…' : 'Download PNG ZIP'}
          </button>
          <button type="button" onClick={downloadPdf} disabled={!selectedMembers.length || Boolean(busy)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[10px] font-bold text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">
            <FileText className="h-3.5 w-3.5" /> {busy === 'pdf' ? 'Creating PDF…' : 'Download 4-up PDF'}
          </button>
        </div>
      </div>

      {message && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{message}</p>}

      {publishedMembers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">Publish a team profile to make it available for QR export.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <span className="font-semibold text-slate-600">{selectedMembers.length} of {publishedMembers.length} selected</span>
            <div className="flex gap-3">
              <button type="button" onClick={() => setSelectedIds(new Set(publishedMembers.map((member) => member.id)))} className="font-bold text-emerald-800 hover:underline">Select all</button>
              <button type="button" onClick={() => setSelectedIds(new Set())} className="font-bold text-slate-500 hover:underline">Clear</button>
            </div>
          </div>
          <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {publishedMembers.map((member) => (
              <div key={member.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <input type="checkbox" checked={selectedIds.has(member.id)} onChange={() => toggleMember(member.id)} aria-label={`Select ${member.full_name} for QR export`} className="h-4 w-4 accent-emerald-700" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-slate-800">{member.full_name}</p>
                  <p className="truncate text-[10px] text-slate-500">{member.designation || member.team_tag || 'Team member'}</p>
                </div>
                <button type="button" onClick={() => downloadPng(member)} disabled={Boolean(busy)} title={`Download ${member.full_name} QR PNG`} aria-label={`Download ${member.full_name} QR PNG`} className="rounded-lg p-2 text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
