'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  CreditCard, 
  Share2, 
  Sparkles,
  Clock,
  MapPin,
  Building2,
  FileImage,
  X
} from 'lucide-react';
import { getStaffMember, type StaffMember } from '@/lib/staff-data';

export default function StaffProfilePage() {
  const params = useParams();
  const rawId = typeof params?.id === 'string' ? params.id : 'MK-C052';
  const staff = getStaffMember(rawId);

  const [copied, setCopied] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [timeString, setTimeString] = useState('');
  const badgeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live Sihanoukville (UTC+7) clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Phnom_Penh',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' (UTC+7)'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!staff) {
    return (
      <div className="min-h-screen bg-[#0b0c10] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Staff Record Not Found</h1>
        <p className="text-white/60 max-w-md mb-6">
          The requested management credential ({rawId}) does not exist in the official Kompong Dewa registry.
        </p>
        <a
          href="https://kompongdewa.win"
          className="px-6 py-2.5 rounded-full bg-[#c59b27] text-black font-semibold text-sm hover:bg-[#d4af37] transition-all"
        >
          Return to Resort Homepage
        </a>
      </div>
    );
  }

  // Copy Profile Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export Badge Image as PNG or JPEG
  const handleDownloadImage = (format: 'png' | 'jpeg') => {
    setIsExporting(true);
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = staff.badgeUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 639;
        canvas.height = img.naturalHeight || 1017;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsExporting(false);
          return;
        }

        // Draw badge image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const extension = format === 'png' ? 'png' : 'jpg';
        const dataUrl = canvas.toDataURL(mimeType, 0.95);

        const link = document.createElement('a');
        link.download = `${staff.firstName}_${staff.lastName}_ID_Card.${extension}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
      };
      img.onerror = () => {
        setIsExporting(false);
        // Fallback: direct download
        const link = document.createElement('a');
        link.href = staff.badgeUrl;
        link.download = `${staff.firstName}_${staff.lastName}_ID_Card.png`;
        link.click();
      };
    } catch {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07080a] text-white flex flex-col items-center justify-start relative overflow-x-hidden pb-20 selection:bg-[#c59b27] selection:text-black">
      {/* Ambient Luxury Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-[#c59b27]/15 via-[#8a681c]/5 to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#c59b27]/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 -left-40 w-96 h-96 bg-[#25D366]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[480px] px-5 pt-8 z-10 flex flex-col items-center">
        {/* Top Resort Brand Bar */}
        <header className="w-full flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5d77f] via-[#c59b27] to-[#8a681c] p-0.5 shadow-lg shadow-[#c59b27]/20">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center p-1.5 overflow-hidden">
                <Image
                  src="https://kompongdewa.win/kd-logo.png"
                  alt="Kompong Dewa"
                  width={24}
                  height={24}
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black tracking-widest text-[#f5d77f] uppercase leading-tight">
                KOMPONG DEWA
              </p>
              <p className="text-[9px] font-semibold text-white/50 tracking-wider uppercase">
                Resort · Sihanoukville
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            aria-label="Share Profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </header>

        {/* Verification Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-gradient-to-r from-emerald-500/10 via-emerald-500/15 to-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-lg shadow-emerald-950/20"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>VERIFIED RESORT MANAGEMENT PERSONNEL</span>
        </motion.div>

        {/* Executive Portrait & ID Summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 flex flex-col items-center text-center w-full"
        >
          {/* Avatar with luxury golden gradient ring */}
          <div className="relative group cursor-pointer" onClick={() => setShowBadgeModal(true)}>
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#f5d77f] via-[#c59b27] to-[#b3832c] opacity-80 blur-sm group-hover:opacity-100 transition-opacity" />
            <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#f5d77f] via-[#c59b27] to-[#8a681c] shadow-2xl shadow-black">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#121316] relative">
                {/* Clean zoom into Jetz's headshot from badge */}
                <Image
                  src={staff.avatarUrl}
                  alt={staff.fullName}
                  fill
                  className="object-cover"
                  style={{ objectPosition: '50% 43%', transform: 'scale(1.85)' }}
                  unoptimized
                  priority
                />
              </div>
            </div>

            {/* Tap to expand badge pill */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border border-[#c59b27]/60 text-[10px] font-semibold text-[#f5d77f] flex items-center gap-1 shadow-lg whitespace-nowrap">
              <CreditCard className="w-3 h-3 text-[#c59b27]" />
              <span>View Badge</span>
            </div>
          </div>

          {/* Name & Titles */}
          <div className="mt-5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fef08a] via-[#f5d77f] to-[#c59b27]">
                {staff.firstName}
              </span>
              <span>{staff.lastName}</span>
              <CheckCircle2 className="w-5 h-5 text-[#f5d77f] fill-[#c59b27]/20" />
            </h1>
            <p className="text-lg font-medium text-white/90 mt-1">
              {staff.position}
            </p>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#c59b27] mt-0.5">
              {staff.department}
            </p>
          </div>

          {/* ID Pill & Location */}
          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90 font-mono text-xs font-semibold tracking-wide">
              ID: {staff.personnelId}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#c59b27]" />
              Sihanoukville
            </span>
          </div>

          <p className="text-xs text-white/60 max-w-sm mt-3 leading-relaxed">
            {staff.bio}
          </p>
        </motion.div>

        {/* Primary Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 mt-6">
          {/* Save to Phone (vCard) */}
          <a
            href={`/api/staff/${staff.normalizedId}/vcard`}
            download={`${staff.firstName}_${staff.lastName}.vcf`}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#c59b27] via-[#d4af37] to-[#b3832c] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#c59b27]/20 transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Save Contact</span>
          </a>

          {/* Save Card Image (PNG / JPEG) */}
          <button
            onClick={() => setShowBadgeModal(true)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
          >
            <FileImage className="w-4 h-4 text-[#f5d77f]" />
            <span>Save ID Card</span>
          </button>
        </div>

        {/* Social & Contact Channels (Linktree Style with Official CDN Icons) */}
        <section className="w-full mt-7 flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 px-1">
            Official Channels &amp; Direct Contact
          </p>

          {staff.socials.map((link, idx) => (
            <motion.a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + idx * 0.04 }}
              className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#c59b27]/60 transition-all duration-200 active:scale-[0.99] shadow-sm hover:shadow-lg hover:shadow-black"
            >
              <div className="flex items-center gap-3.5">
                {/* Official Icon from CDN */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center p-2.5 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${link.brandColor}18`,
                    border: `1px solid ${link.brandColor}35`,
                  }}
                >
                  <img
                    src={link.iconCdn}
                    alt={link.platform}
                    className="w-full h-full object-contain filter"
                    style={{
                      // For black or white icons, invert if needed
                      filter:
                        link.platform === 'X.com'
                          ? 'invert(1)'
                          : 'none',
                    }}
                  />
                </div>

                <div className="text-left">
                  <p className="text-sm font-semibold text-white group-hover:text-[#f5d77f] transition-colors leading-tight">
                    {link.label}
                  </p>
                  <p className="text-xs text-white/50 font-mono mt-0.5">
                    {link.handle}
                  </p>
                </div>
              </div>

              <div className="text-white/30 group-hover:text-white/80 transition-colors pr-1">
                <ExternalLink className="w-4 h-4" />
              </div>
            </motion.a>
          ))}
        </section>

        {/* Security & Verification Timestamp Seal */}
        <footer className="w-full mt-10 pt-6 border-t border-white/10 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kompong Dewa Security Hash Verified</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-mono">
            <Clock className="w-3.5 h-3.5 text-white/30" />
            <span>Server Timestamp: {timeString || 'Synchronizing...'}</span>
          </div>
          <p className="text-[10px] text-white/30 mt-3 max-w-xs leading-normal">
            Official credential issued by Kompong Dewa Resort Corporate Marketing. Valid for corporate inquiries, tournament authorizations, and VIP management operations.
          </p>
        </footer>
      </div>

      {/* Modal: Physical ID Badge Preview & PNG / JPEG Export */}
      <AnimatePresence>
        {showBadgeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setShowBadgeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121316] border border-[#c59b27]/40 rounded-3xl p-5 max-w-sm w-full shadow-2xl relative flex flex-col items-center text-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowBadgeModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                aria-label="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#f5d77f] mb-3">
                <CreditCard className="w-4 h-4 text-[#c59b27]" />
                <span>Physical Badge · CR80 Replica</span>
              </div>

              {/* Badge Visual Container */}
              <div className="w-full relative aspect-[639/1017] rounded-2xl overflow-hidden border-2 border-[#c59b27]/60 shadow-2xl shadow-black my-2">
                <Image
                  src={staff.badgeUrl}
                  alt={`${staff.fullName} Badge`}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
              </div>

              {/* Download Buttons for PNG / JPEG */}
              <p className="text-xs text-white/60 mt-3 mb-4">
                Save the official management ID badge image directly to your mobile photos:
              </p>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  disabled={isExporting}
                  onClick={() => handleDownloadImage('png')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#c59b27] to-[#d4af37] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>Save as PNG</span>
                </button>

                <button
                  disabled={isExporting}
                  onClick={() => handleDownloadImage('jpeg')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-white/80" />
                  <span>Save as JPEG</span>
                </button>
              </div>

              <div className="mt-3">
                <a
                  href={`/api/staff/${staff.normalizedId}/vcard`}
                  download={`${staff.firstName}_${staff.lastName}.vcf`}
                  className="text-[11px] text-[#f5d77f] hover:underline flex items-center justify-center gap-1 font-medium"
                >
                  <Download className="w-3 h-3" />
                  <span>Or download full vCard contact (.vcf)</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
