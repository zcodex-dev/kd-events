'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  CreditCard, 
  FileImage,
  Sun,
  Moon,
  X,
  Share2,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Sparkles
} from 'lucide-react';
import { getStaffMember } from '@/lib/staff-data';

export default function StaffProfilePage() {
  const params = useParams();
  const rawId = typeof params?.id === 'string' ? params.id : 'MK-C052';
  const staff = getStaffMember(rawId);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync theme with system or previous choice
  useEffect(() => {
    const saved = localStorage.getItem('kd_staff_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('kd_staff_theme', next);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!staff) {
    return (
      <div className="min-h-screen bg-[#0a0b0e] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Staff Record Not Found</h1>
        <p className="text-white/60 text-sm max-w-sm mb-6">
          The requested management credential ({rawId}) does not exist in the official directory.
        </p>
        <a
          href="https://kompongdewa.win"
          className="px-5 py-2.5 rounded-xl bg-[#c59b27] text-black font-semibold text-xs"
        >
          Return to Homepage
        </a>
      </div>
    );
  }

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
        const link = document.createElement('a');
        link.href = staff.badgeUrl;
        link.download = `${staff.firstName}_${staff.lastName}_ID_Card.png`;
        link.click();
      };
    } catch {
      setIsExporting(false);
    }
  };

  const isDark = theme === 'dark';

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.06,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <main
      className={`min-h-screen w-full relative overflow-x-hidden flex flex-col items-center justify-start pt-5 pb-16 px-4 transition-colors duration-300 ${
        isDark ? 'bg-[#090a0f] text-[#f4f4f6]' : 'bg-[#f7f8fb] text-[#0f172a]'
      }`}
    >
      {/* ── Ambient Flashlight & Gradient Light Leak System ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Flashlight Spotlight Cone - Top Center */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[90vw] max-w-[620px] h-[780px] opacity-75"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.25) 0%, rgba(212, 175, 55, 0.18) 35%, transparent 72%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.95) 0%, rgba(245, 215, 140, 0.40) 40%, transparent 72%)',
            filter: 'blur(36px)',
          }}
        />

        {/* Gradient Light Leak - Top Right (Warm Gold / Champagne Amber) */}
        <div
          className="absolute -top-24 -right-16 w-[340px] h-[340px] rounded-full opacity-60"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, rgba(245, 158, 11, 0.10) 42%, transparent 70%)'
              : 'radial-gradient(circle, rgba(251, 191, 36, 0.30) 0%, rgba(245, 158, 11, 0.10) 45%, transparent 70%)',
            filter: 'blur(48px)',
          }}
        />

        {/* Gradient Light Leak - Top Left (Soft Rose / Amethyst) */}
        <div
          className="absolute -top-20 -left-16 w-[320px] h-[320px] rounded-full opacity-55"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.16) 0%, rgba(217, 119, 6, 0.10) 45%, transparent 70%)'
              : 'radial-gradient(circle, rgba(244, 114, 182, 0.22) 0%, rgba(251, 146, 60, 0.12) 48%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Floor Ambient Reflection */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-[260px] opacity-25"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at 50% 100%, rgba(212, 175, 55, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 100%, rgba(245, 215, 140, 0.25) 0%, transparent 70%)',
            filter: 'blur(55px)',
          }}
        />
      </div>

      {/* ── Main Mobile Container ── */}
      <div className="w-full max-w-[440px] flex flex-col items-center relative z-10">
        
        {/* Top Header Bar: Resort Branding + Theme Switcher */}
        <div className="w-full flex items-center justify-between py-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 relative rounded-lg border border-white/10 dark:border-white/10 flex items-center justify-center p-1 bg-white/5 dark:bg-white/5">
              <Image
                src="/kd-logo.png"
                alt="Kompong Dewa"
                width={20}
                height={20}
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#c59b27]">
                Kompong Dewa
              </span>
              <span className={`text-[9px] tracking-tight ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                Resort & VIP Management
              </span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`p-2 rounded-xl transition-all duration-200 border ${
              isDark
                ? 'bg-[#14161f] border-[#252834] text-amber-300 hover:bg-[#1a1d28]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Executive Profile Card ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center text-center"
        >
          {/* Avatar with luxury micro-ring & flashlight backlight */}
          <motion.div variants={itemVariants} className="relative cursor-pointer" onClick={() => setShowBadgeModal(true)}>
            {/* Flashlight aura directly behind headshot */}
            <div
              className="absolute -inset-2.5 rounded-full opacity-60 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(212,175,55,0.30) 45%, transparent 75%)',
                filter: 'blur(12px)',
              }}
            />

            {/* Circular Headshot Container */}
            <div className="w-32 h-32 rounded-full p-[2.5px] bg-gradient-to-tr from-[#997316] via-[#f5d77f] to-[#c59b27] transition-transform duration-200 hover:scale-[1.03]">
              <div className={`w-full h-full rounded-full overflow-hidden relative border-2 ${isDark ? 'border-[#090a0f] bg-[#12141c]' : 'border-white bg-white'}`}>
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

            {/* Active Verified Status Pip */}
            <div
              className="absolute bottom-1 right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#090a0f] flex items-center justify-center text-black"
              title="Active Verified Management"
            >
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </div>
          </motion.div>

          {/* Clean Executive Name & Position Hierarchy */}
          <motion.div variants={itemVariants} className="mt-5 w-full flex flex-col items-center">
            {/* Name */}
            <div className="flex items-center justify-center gap-2">
              <h1 
                style={{ fontFamily: "'Outfit', var(--font-outfit), sans-serif" }}
                className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {staff.fullName}
              </h1>
              <div className="w-5 h-5 rounded-full bg-[#c59b27]/20 border border-[#c59b27]/40 flex items-center justify-center text-[#c59b27]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Position */}
            <p 
              style={{ fontFamily: "'Outfit', var(--font-outfit), sans-serif" }}
              className={`text-sm sm:text-base font-medium mt-1 tracking-tight ${isDark ? 'text-white/80' : 'text-slate-600'}`}
            >
              {staff.position}
            </p>

            {/* Department & Resort Subtitle */}
            <div 
              style={{ fontFamily: "'Outfit', var(--font-outfit), sans-serif" }}
              className="flex items-center justify-center gap-1.5 mt-1.5 text-xs font-semibold text-[#c59b27]"
            >
              <span>{staff.department}</span>
              <span className="opacity-40">·</span>
              <span>Kompong Dewa Resort</span>
            </div>

            {/* Subtle Credential Chip */}
            <div
              className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider border ${
                isDark
                  ? 'bg-[#14161f] border-[#252834] text-white/70'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ID: {staff.personnelId}</span>
              <span className="opacity-30">|</span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#c59b27]">
                Executive
              </span>
            </div>
          </motion.div>

          {/* Quick Direct Communication Strip (Zero Shadow) */}
          <motion.div
            variants={itemVariants}
            className={`w-full mt-6 rounded-2xl p-4 border flex flex-col gap-3 text-left ${
              isDark
                ? 'bg-[#12141c]/90 border-[#232634] text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5 dark:border-white/5 border-slate-100">
              <span className={`font-semibold uppercase tracking-wider text-[10px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                Direct Contact
              </span>
              <span className="text-[10px] text-[#c59b27] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Fast Response
              </span>
            </div>

            {/* Phone Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Phone / WhatsApp</p>
                  <p className="text-xs font-mono font-bold truncate">{staff.phoneDisplay}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(staff.phone, 'phone')}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  copiedKey === 'phone'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : isDark
                    ? 'border-white/10 hover:bg-white/10 text-white/70'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Copy Phone"
              >
                {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Email Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#EA4335]/15 border border-[#EA4335]/30 flex items-center justify-center text-[#EA4335] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Corporate Email</p>
                  <p className="text-xs font-mono font-bold truncate">{staff.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(staff.email, 'email')}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  copiedKey === 'email'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : isDark
                    ? 'border-white/10 hover:bg-white/10 text-white/70'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="Copy Email"
              >
                {copiedKey === 'email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>

          {/* ── Primary Action Buttons ── */}
          <motion.div variants={itemVariants} className="w-full flex flex-col gap-2.5 mt-5">
            {/* Single Button to Open Connect & Social Channels Bottom-to-Top Modal */}
            <button
              onClick={() => setShowSocialModal(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#c59b27] hover:bg-[#d4af37] text-black font-bold text-xs uppercase tracking-wider transition-all duration-150 active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-black/15 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-black">
                    Connect & Social Channels
                  </p>
                  <p className="text-[10px] font-medium text-black/75 normal-case">
                    WhatsApp, Telegram, Instagram, X & More
                  </p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-black" />
              </div>
            </button>

            {/* Split Row: Save Contact (vCard) & View Badge Card */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <a
                href={`/api/staff/${staff.normalizedId}/vcard`}
                download={`${staff.firstName}_${staff.lastName}.vcf`}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all duration-150 active:scale-[0.98] ${
                  isDark
                    ? 'bg-[#14161f] hover:bg-[#1c1f2b] border-[#252834] text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>Save Contact</span>
              </a>

              <button
                onClick={() => setShowBadgeModal(true)}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all duration-150 active:scale-[0.98] ${
                  isDark
                    ? 'bg-[#14161f] hover:bg-[#1c1f2b] border-[#252834] text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <FileImage className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>View Badge</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Bottom-to-Top Smooth Modal: Connect & Social Channels ── */}
      <AnimatePresence>
        {showSocialModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop with Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSocialModal(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className={`relative z-10 w-full max-w-lg max-h-[88vh] flex flex-col rounded-t-[28px] border-t border-x overflow-hidden transition-colors ${
                isDark ? 'bg-[#0f1118] border-[#262937] text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Grabber Handle */}
              <div className="w-full flex justify-center pt-3 pb-1 cursor-grab" onClick={() => setShowSocialModal(false)}>
                <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-slate-300'}`} />
              </div>

              {/* Modal Header */}
              <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-white/5 dark:border-white/5 border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden relative border border-[#c59b27]/60 shrink-0">
                    <Image
                      src={staff.avatarUrl}
                      alt={staff.fullName}
                      fill
                      className="object-cover"
                      style={{ objectPosition: '50% 43%', transform: 'scale(1.85)' }}
                      unoptimized
                    />
                  </div>
                  <div>
                    <h2 
                      style={{ fontFamily: "'Outfit', var(--font-outfit), sans-serif" }}
                      className="text-base font-bold flex items-center gap-1.5"
                    >
                      <span>Connect with {staff.firstName}</span>
                      <ShieldCheck className="w-4 h-4 text-[#c59b27]" />
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      Official Communication & Social Channels
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSocialModal(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
                {/* Fast Action Quick Row */}
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    Instant Communication
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {/* WhatsApp */}
                    <a
                      href={staff.socials.find(s => s.platform === 'WhatsApp')?.url || `https://wa.me/${staff.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 ${
                        isDark ? 'bg-[#151722] border-[#252837]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold">WhatsApp</span>
                    </a>

                    {/* Phone Call */}
                    <a
                      href={`tel:${staff.phone}`}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 ${
                        isDark ? 'bg-[#151722] border-[#252837]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#34A853]/20 flex items-center justify-center text-[#34A853]">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold">Call Line</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/${staff.telegramUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 ${
                        isDark ? 'bg-[#151722] border-[#252837]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#26A5E4]/20 flex items-center justify-center text-[#26A5E4]">
                        <Send className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold">Telegram</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:${staff.email}`}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 ${
                        isDark ? 'bg-[#151722] border-[#252837]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#EA4335]/20 flex items-center justify-center text-[#EA4335]">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold">Email</span>
                    </a>
                  </div>
                </div>

                {/* All Verified Social Channels (List) */}
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    All Verified Channels
                  </p>
                  <div className="flex flex-col gap-2">
                    {staff.socials.map((link) => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.99] ${
                          isDark
                            ? 'bg-[#141620] hover:bg-[#1a1d28] border-[#232635] hover:border-[#c59b27]/80'
                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-[#c59b27]/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Official CDN Icon with Authentic Brand Color */}
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center p-2 border shrink-0 transition-transform group-hover:scale-105"
                            style={{
                              backgroundColor: `${link.brandColor}22`,
                              borderColor: `${link.brandColor}44`,
                            }}
                          >
                            {link.platform === 'Resort' ? (
                              <div className="w-6 h-6 relative flex items-center justify-center">
                                <Image
                                  src="/kd-logo.png"
                                  alt="Kompong Dewa"
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div
                                className="w-5 h-5 transition-transform group-hover:scale-110"
                                style={{
                                  backgroundColor:
                                    link.platform === 'X.com'
                                      ? isDark
                                        ? '#ffffff'
                                        : '#000000'
                                      : link.brandColor,
                                  WebkitMaskImage: `url(${link.iconCdn})`,
                                  maskImage: `url(${link.iconCdn})`,
                                  WebkitMaskRepeat: 'no-repeat',
                                  maskRepeat: 'no-repeat',
                                  WebkitMaskPosition: 'center',
                                  maskPosition: 'center',
                                  WebkitMaskSize: 'contain',
                                  maskSize: 'contain',
                                }}
                              />
                            )}
                          </div>

                          <div className="text-left">
                            <p className={`text-sm font-bold transition-colors group-hover:text-[#c59b27] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {link.label}
                            </p>
                            <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                              {link.handle}
                            </p>
                          </div>
                        </div>

                        <div className={`pr-1 ${isDark ? 'text-white/30 group-hover:text-white/80' : 'text-slate-400 group-hover:text-slate-800'}`}>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Close Button for Phone Reachability */}
              <div className="p-4 border-t border-white/5 dark:border-white/5 border-slate-100">
                <button
                  onClick={() => setShowSocialModal(false)}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-colors ${
                    isDark
                      ? 'bg-[#181a24] hover:bg-[#202330] border-[#292c3d] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  }`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Physical Badge Modal: Replica Preview & PNG / JPEG Save with Flashlight ── */}
      <AnimatePresence>
        {showBadgeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden"
            onClick={() => setShowBadgeModal(false)}
          >
            {/* Flashlight / Spotlight Beam in Modal Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              {/* Flashlight Torch Origin Glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-14 bg-white/60 blur-2xl rounded-full" />

              {/* Volumetric Conical Flashlight Beam */}
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-[90vw] max-w-[560px] h-[820px] opacity-80"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(212,175,55,0.22) 32%, rgba(255,255,255,0.06) 65%, transparent 100%)',
                  clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
                  filter: 'blur(14px)',
                }}
              />

              {/* Concentrated Core Flashlight Beam */}
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-[60vw] max-w-[360px] h-[680px] opacity-90"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,238,170,0.3) 38%, transparent 100%)',
                  clipPath: 'polygon(47% 0%, 53% 0%, 92% 100%, 8% 100%)',
                  filter: 'blur(7px)',
                }}
              />

              {/* Central Flashlight Radial Halo directly illuminating the badge */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(197,155,39,0.24) 35%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />
            </div>

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl p-5 max-w-sm w-full relative z-10 flex flex-col items-center text-center border ${
                isDark ? 'bg-[#14161d]/95 border-[#262933] text-white' : 'bg-white/95 border-slate-200 text-slate-900'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowBadgeModal(false)}
                className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 text-xs font-bold text-[#c59b27] mb-3">
                <CreditCard className="w-4 h-4" />
                <span>Physical ID Badge Replica</span>
              </div>

              {/* Physical Badge Image with Flashlight Aura */}
              <div className="w-full relative my-1">
                <div
                  className="absolute -inset-2 rounded-2xl opacity-75 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.45) 0%, rgba(212,175,55,0.22) 45%, transparent 70%)',
                    filter: 'blur(12px)',
                  }}
                />
                <div className="w-full relative aspect-[639/1017] rounded-xl overflow-hidden border border-[#c59b27]/80">
                  <Image
                    src={staff.badgeUrl}
                    alt={`${staff.fullName} ID Card`}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                </div>
              </div>

              <p className={`text-xs mt-3 mb-3 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                Save card directly to your device:
              </p>

              {/* PNG / JPEG Buttons */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  disabled={isExporting}
                  onClick={() => handleDownloadImage('png')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#c59b27] hover:bg-[#d4af37] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>Save as PNG</span>
                </button>

                <button
                  disabled={isExporting}
                  onClick={() => handleDownloadImage('jpeg')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider border transition-all disabled:opacity-50 ${
                    isDark
                      ? 'bg-[#1e212b] hover:bg-[#252936] border-[#2e3342] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save as JPEG</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
