'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconsaxSun,
  IconsaxMoon,
  IconsaxArrowRight,
  IconsaxArrowUpRight,
  IconsaxDocumentDownload,
  IconsaxClose,
  IconsaxCall,
  IconsaxSms,
  IconsaxSend,
  IconsaxMessage
} from '@/components/icons/iconsax';
import { getStaffMember } from '@/lib/staff-data';

export default function StaffProfilePage() {
  const params = useParams();
  const rawId = typeof params?.id === 'string' ? params.id : 'MK-C052';
  const staff = getStaffMember(rawId);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Sync theme with system or local preference
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

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (showConnectModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showConnectModal]);

  // Keyboard accessibility: Escape closes modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConnectModal) {
        setShowConnectModal(false);
      }
    },
    [showConnectModal]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!staff) {
    return (
      <div className="min-h-screen bg-[#101114] text-[#F5F4F1] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-medium mb-2">Staff Record Not Found</h1>
        <p className="text-[#9699A3] text-sm max-w-sm mb-6">
          The requested management credential ({rawId}) does not exist in the official directory.
        </p>
        <a
          href="https://kompongdewa.win"
          className="px-5 py-2.5 rounded-xl bg-[#D3AD59] text-black font-medium text-xs tracking-wide"
        >
          Return to Directory
        </a>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <main
      className={`min-h-screen w-full relative flex flex-col items-center justify-between transition-colors duration-200 select-none ${
        isDark ? 'bg-[#101114] text-[#F5F4F1]' : 'bg-[#F8F7F4] text-[#17191D]'
      }`}
      style={{ fontFamily: "'Outfit', var(--font-outfit), var(--font-roboto), -apple-system, sans-serif" }}
    >
      {/* ── Section 3: Sophisticated Ambient Light Leak ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {isDark ? (
          <>
            {/* Dark: Soft warm champagne light leaking from upper-right */}
            <div
              className="absolute -top-16 -right-16 w-[420px] h-[420px] rounded-full opacity-70"
              style={{
                background: 'radial-gradient(circle at 75% 25%, rgba(211, 173, 89, 0.08) 0%, transparent 65%)',
                filter: 'blur(50px)',
              }}
            />
            {/* Dark: Very subtle cool graphite ambient illumination on opposite side */}
            <div
              className="absolute -top-12 -left-16 w-[360px] h-[360px] rounded-full opacity-60"
              style={{
                background: 'radial-gradient(circle at 25% 25%, rgba(90, 100, 130, 0.05) 0%, transparent 65%)',
                filter: 'blur(55px)',
              }}
            />
          </>
        ) : (
          <>
            {/* Light: Extremely subtle warm ambient light behind portrait area */}
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-[500px] h-[400px] opacity-80"
              style={{
                background: 'radial-gradient(ellipse at 50% 15%, rgba(196, 154, 64, 0.07) 0%, transparent 65%)',
                filter: 'blur(45px)',
              }}
            />
          </>
        )}
      </div>

      {/* ── Main Mobile Content Container ── */}
      <div className="w-full max-w-[420px] min-h-screen flex flex-col justify-between px-6 pt-6 pb-8 relative z-10">
        
        {/* Top Header: Brand Wordmark & Theme Switcher */}
        <header className="w-full flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 relative rounded-lg border flex items-center justify-center p-1 ${
              isDark ? 'border-[#303138] bg-[#1A1B20]' : 'border-[#E9E7E2] bg-white'
            }`}>
              <Image
                src="/kd-logo.png"
                alt="Kompong Dewa"
                width={18}
                height={18}
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex flex-col text-left">
              <span className={`text-[11px] font-semibold tracking-[0.08em] uppercase ${
                isDark ? 'text-[#D3AD59]' : 'text-[#C49A40]'
              }`}>
                Kompong Dewa
              </span>
              <span className={`text-[9px] tracking-tight ${
                isDark ? 'text-[#9699A3]' : 'text-[#747782]'
              }`}>
                Resort & VIP Management
              </span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C49A40] ${
              isDark
                ? 'border-[#303138] bg-[#1A1B20] text-[#D3AD59] hover:bg-[#202127]'
                : 'border-[#E9E7E2] bg-white text-[#747782] hover:text-[#17191D] hover:bg-[#F0EEEA]'
            }`}
          >
            {isDark ? <IconsaxSun size={18} /> : <IconsaxMoon size={18} />}
          </button>
        </header>

        {/* ── Section 5: Profile Hero (Option A: Confident Minimalist Typography) ── */}
        <section className="w-full flex flex-col items-center text-center my-auto py-8">
          {/* Portrait: Clean circular crop, 1px subtle outline, NO heavy gold ring, NO green pip */}
          <div className="relative mb-6">
            <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden relative border ${
              isDark ? 'border-[#303138] bg-[#1A1B20]' : 'border-[#E9E7E2] bg-white'
            }`}>
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

          {/* Typography: Option A (Modern Sans-serif, confident hierarchy) */}
          <h1 
            style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', -apple-system, sans-serif" }}
            className={`text-2xl sm:text-[28px] font-semibold tracking-[-0.015em] leading-tight ${
              isDark ? 'text-[#F5F4F1]' : 'text-[#17191D]'
            }`}
          >
            {staff.fullName}
          </h1>

          <p className={`text-sm sm:text-[15px] font-normal mt-1.5 ${
            isDark ? 'text-[#9699A3]' : 'text-[#747782]'
          }`}>
            {staff.position}
          </p>

          <p className={`text-xs font-normal tracking-wide mt-1 ${
            isDark ? 'text-[#9699A3]/80' : 'text-[#747782]/90'
          }`}>
            {staff.department} · Kompong Dewa Resort
          </p>
        </section>

        {/* ── Section 7: Single Primary Connect Button & Secondary Save Contact ── */}
        <footer className="w-full flex flex-col gap-3 pb-2">
          {/* ONE dominant primary action: Connect with Jetz */}
          <button
            onClick={() => setShowConnectModal(true)}
            className={`w-full h-13 rounded-2xl flex items-center justify-between px-5 font-semibold text-sm tracking-wide transition-all duration-150 active:scale-[0.99] cursor-pointer ${
              isDark
                ? 'bg-[#D3AD59] text-black hover:bg-[#c59e48]'
                : 'bg-[#C49A40] text-black hover:bg-[#b58c35]'
            }`}
          >
            <span>Connect with Jetz</span>
            <IconsaxArrowRight size={18} color="#000000" />
          </button>

          {/* Subordinate Secondary Action: Save Contact (vCard) */}
          <a
            href={`/api/staff/${staff.normalizedId}/vcard`}
            download={`${staff.firstName}_${staff.lastName}.vcf`}
            className={`w-full h-11 rounded-xl border flex items-center justify-center gap-2 font-medium text-xs tracking-wide transition-colors duration-150 active:scale-[0.99] ${
              isDark
                ? 'border-[#303138] bg-transparent text-[#9699A3] hover:text-[#F5F4F1] hover:bg-[#1A1B20]'
                : 'border-[#E9E7E2] bg-transparent text-[#747782] hover:text-[#17191D] hover:bg-[#FFFFFF]'
            }`}
          >
            <IconsaxDocumentDownload size={16} />
            <span>Save Contact</span>
          </a>
        </footer>
      </div>

      {/* ── Section 8: Premium Connect Bottom Sheet ── */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop Dimming with Click to Dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setShowConnectModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            />

            {/* Bottom Sheet Drawer (Mobile) / Centered Dialog (Desktop) */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="connect-sheet-title"
              className={`relative z-10 w-full max-w-[440px] max-h-[85vh] flex flex-col rounded-t-[26px] sm:rounded-[24px] border-t sm:border border-x overflow-hidden transition-colors ${
                isDark
                  ? 'bg-[#1A1B20] border-[#303138] text-[#F5F4F1]'
                  : 'bg-white border-[#E9E7E2] text-[#17191D]'
              }`}
            >
              {/* Drag Handle Bar (Mobile) */}
              <div
                className="w-full flex justify-center pt-3 pb-1 cursor-pointer sm:hidden"
                onClick={() => setShowConnectModal(false)}
              >
                <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-[#303138]' : 'bg-[#E9E7E2]'}`} />
              </div>

              {/* Sheet Header */}
              <div className="px-5 pt-3 pb-4 flex items-center justify-between border-b border-[#E9E7E2]/60 dark:border-[#303138]/60">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full overflow-hidden relative border shrink-0 ${
                    isDark ? 'border-[#303138] bg-[#202127]' : 'border-[#E9E7E2] bg-white'
                  }`}>
                    <Image
                      src={staff.avatarUrl}
                      alt={staff.fullName}
                      fill
                      className="object-cover"
                      style={{ objectPosition: '50% 43%', transform: 'scale(1.85)' }}
                      unoptimized
                    />
                  </div>
                  <div className="text-left">
                    <h2 
                      id="connect-sheet-title" 
                      style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', -apple-system, sans-serif" }}
                      className="text-sm font-semibold leading-tight"
                    >
                      Connect with Jetz
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-[#9699A3]' : 'text-[#747782]'}`}>
                      Official contact & social channels
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowConnectModal(false)}
                  aria-label="Close"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none ${
                    isDark
                      ? 'text-[#9699A3] hover:text-[#F5F4F1] hover:bg-[#202127]'
                      : 'text-[#747782] hover:text-[#17191D] hover:bg-[#F8F7F4]'
                  }`}
                >
                  <IconsaxClose size={18} />
                </button>
              </div>

              {/* Sheet Scrollable Body */}
              <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
                
                {/* 1. Quick Access Row: WhatsApp · Call · Telegram · Email */}
                <div>
                  <p className={`text-[11px] font-semibold tracking-wider uppercase mb-2 text-left ${
                    isDark ? 'text-[#9699A3]' : 'text-[#747782]'
                  }`}>
                    Quick Reach
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${staff.whatsappNumber}?text=Hello%20Jetz%2C%20I%20scanned%20your%20Kompong%20Dewa%20management%20card`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`py-3 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                        isDark
                          ? 'border-[#303138] bg-[#202127] text-[#F5F4F1] hover:border-[#D3AD59]/50'
                          : 'border-[#E9E7E2] bg-[#F8F7F4] text-[#17191D] hover:border-[#C49A40]/50'
                      }`}
                    >
                      <IconsaxMessage size={20} color={isDark ? '#D3AD59' : '#C49A40'} />
                      <span className="text-[11px] font-medium">WhatsApp</span>
                    </a>

                    {/* Direct Call */}
                    <a
                      href={`tel:${staff.phone}`}
                      className={`py-3 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                        isDark
                          ? 'border-[#303138] bg-[#202127] text-[#F5F4F1] hover:border-[#D3AD59]/50'
                          : 'border-[#E9E7E2] bg-[#F8F7F4] text-[#17191D] hover:border-[#C49A40]/50'
                      }`}
                    >
                      <IconsaxCall size={20} color={isDark ? '#D3AD59' : '#C49A40'} />
                      <span className="text-[11px] font-medium">Call</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/${staff.telegramUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`py-3 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                        isDark
                          ? 'border-[#303138] bg-[#202127] text-[#F5F4F1] hover:border-[#D3AD59]/50'
                          : 'border-[#E9E7E2] bg-[#F8F7F4] text-[#17191D] hover:border-[#C49A40]/50'
                      }`}
                    >
                      <IconsaxSend size={20} color={isDark ? '#D3AD59' : '#C49A40'} />
                      <span className="text-[11px] font-medium">Telegram</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:${staff.email}`}
                      className={`py-3 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                        isDark
                          ? 'border-[#303138] bg-[#202127] text-[#F5F4F1] hover:border-[#D3AD59]/50'
                          : 'border-[#E9E7E2] bg-[#F8F7F4] text-[#17191D] hover:border-[#C49A40]/50'
                      }`}
                    >
                      <IconsaxSms size={20} color={isDark ? '#D3AD59' : '#C49A40'} />
                      <span className="text-[11px] font-medium">Email</span>
                    </a>
                  </div>
                </div>

                {/* 2. All Channels: Clean Vertically Stacked Rows */}
                <div>
                  <p className={`text-[11px] font-semibold tracking-wider uppercase mb-2 text-left ${
                    isDark ? 'text-[#9699A3]' : 'text-[#747782]'
                  }`}>
                    All Verified Channels
                  </p>

                  <div className={`divide-y rounded-xl border ${
                    isDark ? 'divide-[#303138]/60 border-[#303138] bg-[#202127]/60' : 'divide-[#E9E7E2] border-[#E9E7E2] bg-[#F8F7F4]/60'
                  }`}>
                    {staff.socials.map((link) => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-between py-3.5 px-4 transition-colors duration-150 ${
                          isDark ? 'hover:bg-[#202127]' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Official Brand SVG Logo without heavy colorful boxes */}
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            {link.platform === 'Resort' ? (
                              <Image
                                src="/kd-logo.png"
                                alt="Kompong Dewa"
                                width={18}
                                height={18}
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <div
                                className="w-4.5 h-4.5 transition-opacity"
                                style={{
                                  backgroundColor: isDark ? '#F5F4F1' : '#17191D',
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
                            <p className="text-xs font-semibold leading-tight">
                              {link.label}
                            </p>
                            <p className={`text-[11px] font-mono mt-0.5 ${
                              isDark ? 'text-[#9699A3]' : 'text-[#747782]'
                            }`}>
                              {link.handle}
                            </p>
                          </div>
                        </div>

                        <div className={isDark ? 'text-[#9699A3]' : 'text-[#747782]'}>
                          <IconsaxArrowUpRight size={16} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom Sheet Footer: Dismiss button for one-hand thumb reachability */}
              <div className="px-5 py-3.5 border-t border-[#E9E7E2]/60 dark:border-[#303138]/60">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className={`w-full py-2.5 rounded-xl font-medium text-xs border transition-colors ${
                    isDark
                      ? 'border-[#303138] text-[#9699A3] hover:text-[#F5F4F1] hover:bg-[#202127]'
                      : 'border-[#E9E7E2] text-[#747782] hover:text-[#17191D] hover:bg-[#F8F7F4]'
                  }`}
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
