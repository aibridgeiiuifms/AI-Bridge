'use client';

import Image from 'next/image';
import QRCode from 'qrcode';
import {
  Check,
  Clipboard,
  Download,
  ExternalLink,
  Globe2,
  Instagram,
  Linkedin,
  Share2,
  Twitter,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const WEBSITE_URL = 'https://ai-bridge-iiui.vercel.app/';

const SOCIAL_LINKS = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/company/the-ai-bridge-iiui-fms/',
    color: '#0a66c2',
    icon: Linkedin,
    short: 'in',
  },
  {
    id: 'x',
    label: 'X',
    url: 'https://x.com/TheAIBridgeFMS',
    color: '#111827',
    icon: Twitter,
    short: 'X',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61594783725793',
    color: '#1877f2',
    icon: Share2,
    short: 'f',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/theaibridgefmsiiui/',
    color: '#c13584',
    icon: Instagram,
    short: 'ig',
  },
] as const;

type SocialId = (typeof SOCIAL_LINKS)[number]['id'];

function createShareText(selectedIds: SocialId[]) {
  const selectedLinks = SOCIAL_LINKS.filter((item) => selectedIds.includes(item.id));
  const socialText = selectedLinks
    .map((item) => `${item.label}: ${item.url}`)
    .join('\n');

  return [
    '*The AI Bridge | FMS IIUI*',
    'Explore how AI can support learning and teaching:',
    WEBSITE_URL,
    socialText ? `\nFollow us:\n${socialText}` : '',
  ].join('\n');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  circular = false,
) {
  context.save();
  if (circular) {
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    context.clip();
  }

  const scale = Math.max(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(image, x + (size - width) / 2, y + (size - height) / 2, width, height);
  context.restore();
}

async function buildShareCard(selectedIds: SocialId[]) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare the image.');

  const [bridgeLogo, iiuiLogo, sdgLogo, websiteQr, ...socialQrs] = await Promise.all([
    loadImage('/logo.webp'),
    loadImage('/iiui-logo.webp'),
    loadImage('/sdg-logo-wheel-transparent.webp'),
    QRCode.toDataURL(WEBSITE_URL, { width: 360, margin: 1, errorCorrectionLevel: 'H' }),
    ...SOCIAL_LINKS.filter((item) => selectedIds.includes(item.id)).map((item) =>
      QRCode.toDataURL(item.url, { width: 240, margin: 1, errorCorrectionLevel: 'H' }),
    ),
  ]);
  const socialQrImages = await Promise.all(socialQrs.map(loadImage));

  const background = context.createLinearGradient(0, 0, 1080, 1350);
  background.addColorStop(0, '#f8f5e8');
  background.addColorStop(0.55, '#fffdf6');
  background.addColorStop(1, '#e9f5ef');
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#220f38';
  context.beginPath();
  context.roundRect(28, 28, 1024, 1294, 44);
  context.fill();
  context.fillStyle = '#fffdf6';
  context.beginPath();
  context.roundRect(42, 42, 996, 1266, 34);
  context.fill();

  drawCoverImage(context, iiuiLogo, 76, 72, 74);
  drawCoverImage(context, sdgLogo, 930, 72, 74);
  context.textAlign = 'center';
  context.fillStyle = '#220f38';
  context.font = '700 19px Arial, sans-serif';
  context.fillText('INTERNATIONAL ISLAMIC UNIVERSITY', 540, 101);
  context.fillText('ISLAMABAD  •  FMS', 540, 128);

  context.save();
  context.shadowColor = 'rgba(34, 15, 56, 0.18)';
  context.shadowBlur = 18;
  context.beginPath();
  context.arc(540, 264, 86, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.fill();
  context.restore();
  context.save();
  context.beginPath();
  context.arc(540, 264, 78, 0, Math.PI * 2);
  context.clip();
  drawCoverImage(context, bridgeLogo, 462, 186, 156, true);
  context.restore();

  context.fillStyle = '#220f38';
  context.font = '800 47px Arial, sans-serif';
  context.fillText('The AI Bridge', 540, 386);
  context.fillStyle = '#536174';
  context.font = '600 22px Arial, sans-serif';
  context.fillText('Empowering educators and learners with AI', 540, 422);

  context.fillStyle = '#ffffff';
  context.beginPath();
  context.roundRect(348, 453, 384, 352, 24);
  context.fill();
  context.strokeStyle = '#e4e9e4';
  context.lineWidth = 2;
  context.stroke();
  const websiteQrImage = await loadImage(websiteQr);
  context.drawImage(websiteQrImage, 399, 475, 282, 282);
  context.fillStyle = '#220f38';
  context.font = '700 21px Arial, sans-serif';
  context.fillText('SCAN TO VISIT OUR WEBSITE', 540, 786);

  const activeLinks = SOCIAL_LINKS.filter((item) => selectedIds.includes(item.id));
  const columns = 3;
  const cellWidth = 290;
  const cardWidth = 272;
  const cardHeight = 224;
  const gridWidth = columns * cellWidth;
  const gridStartX = (1080 - gridWidth) / 2 + 9;
  const gridStartY = 838;
  const qrSize = activeLinks.length > 3 ? 132 : 150;

  activeLinks.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const x = gridStartX + column * cellWidth;
    const y = gridStartY + row * 226;
    const qrImage = socialQrImages[index];

    context.fillStyle = '#ffffff';
    context.beginPath();
    context.roundRect(x, y, cardWidth, cardHeight, 20);
    context.fill();
    context.strokeStyle = '#e4e9e4';
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = item.color;
    context.beginPath();
    context.arc(x + cardWidth / 2, y + 30, 17, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = '800 17px Arial, sans-serif';
    context.fillText(item.short, x + cardWidth / 2, y + 36);
    context.fillStyle = '#220f38';
    context.font = '700 17px Arial, sans-serif';
    context.fillText(item.label, x + cardWidth / 2, y + 66);
    context.drawImage(
      qrImage,
      x + (cardWidth - qrSize) / 2,
      y + 76,
      qrSize,
      qrSize,
    );
  });

  context.fillStyle = '#536174';
  context.font = '600 18px Arial, sans-serif';
  context.fillText('ai-bridge-iiui.vercel.app', 540, 1272);

  return canvas;
}

export default function SharePage() {
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<SocialId[]>(SOCIAL_LINKS.map((item) => item.id));
  const [activeQr, setActiveQr] = useState<SocialId | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [copyFallback, setCopyFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      QRCode.toDataURL(WEBSITE_URL, { width: 320, margin: 1, errorCorrectionLevel: 'H' })
        .then((dataUrl) => ({ id: 'website', dataUrl })),
      ...SOCIAL_LINKS.map((item) =>
        QRCode.toDataURL(item.url, { width: 240, margin: 1, errorCorrectionLevel: 'H' })
          .then((dataUrl) => ({ id: item.id, dataUrl })),
      ),
    ])
      .then((codes) => {
        if (!cancelled) {
          setQrCodes(Object.fromEntries(codes.map(({ id, dataUrl }) => [id, dataUrl])));
        }
      })
      .catch((error: unknown) => {
        console.error('Could not generate share QR codes:', error);
        if (!cancelled) setFeedback('QR codes could not be generated. Please refresh and try again.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const shareText = useMemo(() => createShareText(selectedIds), [selectedIds]);

  const togglePlatform = (id: SocialId) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id],
    );
  };

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setFeedback('WhatsApp-ready text copied. Paste it into your message.');
      setCopyFallback(false);
    } catch (error) {
      console.error('Could not copy the share text:', error);
      setFeedback('Clipboard access is blocked. Select and copy the message below.');
      setCopyFallback(true);
    }
  };

  const downloadCard = async () => {
    setBusy(true);
    setFeedback('');
    setCopyFallback(false);
    try {
      const canvas = await buildShareCard(selectedIds);
      const imageData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'The-AI-Bridge-Share-Card.png';
      link.href = imageData;
      link.click();

      try {
        await navigator.clipboard.writeText(shareText);
        setFeedback('PNG downloaded and WhatsApp-ready text copied.');
      } catch (error) {
        console.error('PNG downloaded, but copying the share text failed:', error);
        setFeedback('PNG downloaded. Clipboard access was blocked; use Copy text below.');
        setCopyFallback(true);
      }
    } catch (error) {
      console.error('Could not create the share card:', error);
      setFeedback('The image could not be created. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-[#f7f5e9] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#220f38] via-[#31164b] to-[#075b50] p-6 text-white shadow-2xl sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <Image src="/iiui-logo.webp" alt="IIUI" width={54} height={54} className="h-12 w-12 rounded-full bg-white p-1 object-contain" />
            <Image src="/sdg-logo-wheel-transparent.webp" alt="United Nations Sustainable Development Goals" width={58} height={58} className="h-14 w-14 object-contain" />
          </div>

          <div className="mx-auto mt-2 max-w-2xl text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-white shadow-xl">
              <Image src="/logo.webp" alt="The AI Bridge logo" width={92} height={92} className="h-full w-full object-cover" priority />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-emerald-200">FMS · IIUI</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">The AI Bridge</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              Empowering educators and learners through practical, source-grounded AI.
              Scan the code or connect with us on your favorite platform.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-sm rounded-3xl bg-white p-4 text-center text-[#220f38] shadow-xl">
            <p className="text-xs font-extrabold uppercase tracking-wider">Scan to visit our website</p>
            {qrCodes.website ? (
              <Image src={qrCodes.website} alt="QR code to open The AI Bridge website" width={240} height={240} className="mx-auto mt-2 h-52 w-52 sm:h-60 sm:w-60" unoptimized />
            ) : (
              <div className="mx-auto mt-2 flex h-52 w-52 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">Creating QR code…</div>
            )}
            <a href={WEBSITE_URL} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:underline">
              ai-bridge-iiui.vercel.app <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-[#eadccf] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-emerald-700" />
              <h2 className="text-xl font-extrabold text-[#220f38]">Connect with us</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">Hover, focus, or tap a platform to reveal its QR code.</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {SOCIAL_LINKS.map((item) => {
                const Icon = item.icon;
                const isActive = activeQr === item.id;
                return (
                  <div
                    key={item.id}
                    className={`group relative min-h-36 overflow-hidden rounded-2xl border p-3 transition ${
                      isActive ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-emerald-300'
                    }`}
                    onMouseEnter={() => setActiveQr(item.id)}
                    onMouseLeave={() => setActiveQr((current) => current === item.id ? null : current)}
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center gap-3 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                      onFocus={() => setActiveQr(item.id)}
                      onBlur={() => setActiveQr((current) => current === item.id ? null : current)}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: item.color }}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-bold text-[#220f38]">{item.label}</span>
                      <ExternalLink className="ml-auto h-4 w-4 text-slate-400" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveQr((current) => current === item.id ? null : item.id)}
                      aria-label={`${isActive ? 'Hide' : 'Show'} ${item.label} QR code`}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1 text-xs font-semibold text-emerald-800 sm:hidden"
                    >
                      <span>{isActive ? 'Hide QR' : 'Show QR'}</span>
                    </button>
                    {isActive && qrCodes[item.id] && (
                      <div className="mt-2 flex items-center justify-center gap-3 rounded-xl bg-white p-2 shadow-sm">
                        <Image src={qrCodes[item.id]} alt={`${item.label} QR code`} width={92} height={92} className="h-20 w-20" unoptimized />
                        <span className="max-w-28 break-all text-[11px] leading-relaxed text-slate-500">Scan to open our {item.label} page</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-[#eadccf] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-700" />
              <h2 className="text-xl font-extrabold text-[#220f38]">Make your share card</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Choose which social QR codes to include. The website QR code is always included.
              Your PNG will be portrait-sized for sharing or presenting.
            </p>

            <div className="mt-5 space-y-2">
              {SOCIAL_LINKS.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/50">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => togglePlatform(item.id)}
                    className="h-4 w-4 accent-emerald-700"
                  />
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ backgroundColor: item.color }}>
                    <span className="text-xs font-black">{item.short}</span>
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                  <span className="ml-auto text-xs text-slate-400">{selectedIds.includes(item.id) ? 'Included' : 'Not included'}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={downloadCard}
              disabled={busy || !qrCodes.website}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef6959] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#dc5748] disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? <Globe2 className="h-4 w-4 animate-pulse" /> : <Download className="h-4 w-4" />}
              {busy ? 'Preparing your PNG…' : 'Download PNG and copy share text'}
            </button>

            <div className="mt-4 rounded-xl bg-[#f7f5e9] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">WhatsApp message</p>
              <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-slate-700">{shareText}</pre>
              <button type="button" onClick={copyShareText} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline">
                <Clipboard className="h-3.5 w-3.5" /> Copy text
              </button>
            </div>

            {feedback && (
              <p role="status" className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
                {copyFallback ? <Clipboard className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{feedback}</span>
              </p>
            )}
          </div>
        </section>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <Globe2 className="h-4 w-4" /> QR codes open the selected official AI Bridge pages.
        </p>
      </div>
    </main>
  );
}
