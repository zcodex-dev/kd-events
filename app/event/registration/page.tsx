'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, UserCheck, UserX, Loader2, Upload, FileImage, ChevronRight, CheckCircle2, CalendarX } from 'lucide-react';
import CheckedIcon from '@/components/icons/checked-icon';
import type { AnimatedIconHandle } from '@/components/icons/types';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

const defaultEvents = [
  {
    id: 1,
    title: 'Kompong Dewa Integrated Resort',
    date: '',
    location: 'Sihanoukville, Cambodia',
    image: 'https://i.imgur.com/ykQuk5a.jpeg',
    tag: 'Resort & Casino',
  }
];

export default function EventRegistrationPage() {
  const [activeTab, setActiveTab] = useState<'member' | 'non-member'>('member');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'non-member' || params.get('type') === 'non-member') {
        setActiveTab('non-member');
      }
    }
  }, []);

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [memberIdInput, setMemberIdInput] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // The placeholder events above aren't real records, so they have no detail page.
  const currentEvent = events[currentEventIndex] || defaultEvents[0];
  const detailHref = typeof currentEvent?.id === 'string' ? `/event/${currentEvent.id}` : null;

  // Non-member fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasActiveEvents, setHasActiveEvents] = useState(true);
  // Set only by the non-member flow — members stay on their profile card.
  const [result, setResult] = useState<{ isMember: boolean; memberId: string | null; memberData?: any; registration?: any } | null>(null);
  const [memberProfile, setMemberProfile] = useState<{
    member: { memberId: string; name: string; memberType: string; nationality: string | null; dateJoined: string | null; createdAt: string; cardSerial: string; avatarUrl: string | null };
    events: { eventId: string | null; eventTitle: string | null; createdAt: string }[];
  } | null>(null);

  const iconRef = useRef<AnimatedIconHandle>(null);

  useEffect(() => {
    if (result && iconRef.current) {
      const timer = setTimeout(() => {
        iconRef.current?.startAnimation();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const formatDate = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          // Each image is its own slide, so an event with 3 images shows 3 times
          // with the same title/date/tag. Rows saved before the images array
          // only carry imageUrl.
          const slides = data.data.flatMap((ev: any) => {
            const images: string[] = ev.images?.length
              ? ev.images
              : ev.imageUrl
                ? [ev.imageUrl]
                : [defaultEvents[0].image];

            return images.map((image, i) => ({
              id: ev.id,
              slideKey: `${ev.id}-${i}`,
              title: ev.title,
              date: ev.date,
              location: ev.location,
              image,
              tag: ev.tag,
              status: ev.status,
            }));
          });

          if (slides.length > 0) {
            setEvents(slides);
            setHasActiveEvents(true);
          } else {
            setEvents(defaultEvents);
            setHasActiveEvents(false);
          }
        } else {
          setEvents(defaultEvents);
          setHasActiveEvents(false);
        }
      })
      .catch(err => {
        console.error('Failed to load events:', err);
        setEvents(defaultEvents);
        setHasActiveEvents(false);
      })
      .finally(() => setIsLoadingEvents(false));
  }, []);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -swipeConfidenceThreshold) {
      setCurrentEventIndex((prev) => (prev + 1) % events.length);
    } else if (swipe > swipeConfidenceThreshold) {
      setCurrentEventIndex((prev) => (prev - 1 + events.length) % events.length);
    }
  };

  /** Member tab: verify the ID only. Non-member tab: submit the registration. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'member') {
      if (!memberIdInput.trim()) return toast.error('Please enter your Member ID');

      setIsSubmitting(true);
      try {
        const response = await fetch('/api/register/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: memberIdInput }),
        });
        const data = await response.json();

        if (data.success) {
          setMemberProfile({ member: data.member, events: data.events });
          toast.success(`Welcome back, ${data.member.name}!`);
        } else if (data.notFound) {
          // Not a member — send them straight to the form that fits them.
          setMemberProfile(null);
          setActiveTab('non-member');
          toast.error('Member ID not found. Please register as a Non-Member.');
        } else {
          toast.error(data.error || 'Could not verify that Member ID.');
        }
      } catch {
        toast.error('An unexpected error occurred.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!name.trim()) return toast.error('Please enter your full name');
    if (!phoneNumber.trim()) return toast.error('Please enter your phone number or email');
    if (!passportFile) {
      return toast.error('Please upload your ID image');
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('isNonMemberTab', 'true');
      formData.append('name', name);
      formData.append('phoneNumber', phoneNumber);
      formData.append('nationality', nationality);
      if (passportFile) formData.append('passportImage', passportFile);
      appendCurrentEvent(formData);

      const response = await fetch('/api/register', { method: 'POST', body: formData });
      const data = await response.json();

      if (data.success) {
        setResult({ isMember: data.isMember, memberId: data.memberId, memberData: data.memberData, registration: data.registration });
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Placeholder events aren't real records, so they carry no id to register against. */
  const appendCurrentEvent = (formData: FormData) => {
    if (typeof currentEvent?.id === 'string') {
      formData.append('eventId', currentEvent.id);
      formData.append('eventTitle', currentEvent.title ?? '');
    }
  };

  /** The step that actually writes the registration for a verified member. */
  const handleRegisterEvent = async () => {
    if (!memberProfile) return;

    setIsRegistering(true);
    try {
      const formData = new FormData();
      formData.append('isNonMemberTab', 'false');
      formData.append('memberId', memberProfile.member.memberId);
      appendCurrentEvent(formData);

      const response = await fetch('/api/register', { method: 'POST', body: formData });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        if (!data.alreadyRegistered && data.registration) {
          setMemberProfile((prev) =>
            prev ? { ...prev, events: [data.registration, ...prev.events] } : prev
          );
        }
      } else {
        toast.error(data.error || 'Could not register you for this event.');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setMemberProfile(null);
    setName('');
    setPhoneNumber('');
    setNationality('');
    setPassportFile(null);
    setMemberIdInput('');
  };

  /** Has this member already signed up for the event currently on screen? */
  const alreadyRegisteredForCurrent =
    typeof currentEvent?.id === 'string' &&
    !!memberProfile?.events.some((ev) => ev.eventId === currentEvent.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportFile(file);
    }
  };

  return (
    <>
      {/* Navigation / Header */}
      <header className="fixed top-0 left-0 w-full bg-black backdrop-blur-md border-b border-white/10 z-50">
        <div className="w-full px-4 md:px-8 h-16 md:h-20 flex items-center">
          <div className="py-1 md:py-2">
            <Image
              src="/logo-v2.png"
              alt="Kompong Dewa Logo"
              width={300}
              height={64}
              className="h-12 md:h-16 w-auto shrink-0 object-contain"
              unoptimized
              priority
            />
          </div>
        </div>
      </header>

      {/* Mobile scrolls: the hero is a true 4:5 frame so a portrait poster fills it
          edge to edge, and the form follows underneath. Desktop keeps the
          locked split-screen. */}
      <div className="min-h-[100dvh] md:h-[100dvh] overflow-y-auto overflow-x-hidden md:overflow-hidden bg-[#F4F4F5] flex flex-col md:flex-row relative pt-16 md:pt-0">

        {/* Left / Top Side: Event Previews Carousel */}
        {/* Takes up 65vh on mobile so the branding is the focus, 
            and the form follows underneath. */}
        <div className="w-full shrink-0 h-[65vh] md:w-1/2 md:h-[100dvh] relative bg-black overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`poster-${currentEventIndex}`}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.05}
              onDragEnd={handleDragEnd}
            >
              {isLoadingEvents ? (
                <div className="w-full h-full relative flex items-center justify-center bg-black">
                  <Image
                    src={defaultEvents[0].image}
                    alt="Loading"
                    fill
                    className="object-cover opacity-40"
                    unoptimized
                  />
                  <Loader2 className="w-8 h-8 text-neutral-300 animate-spin z-10" />
                </div>
              ) : (
                <Image
                  src={events[currentEventIndex]?.image || defaultEvents[0].image}
                  alt={events[currentEventIndex]?.title || 'Event'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Single soft scrim, lower opacity when no events */}
          <div
            className={`absolute inset-0 z-10 pointer-events-none ${detailHref
              ? 'bg-[linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,0.9)_20%,rgba(0,0,0,0.5)_35%,rgba(0,0,0,0)_50%)]'
              : 'bg-[linear-gradient(to_top,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.5)_20%,rgba(0,0,0,0)_40%)]'
              }`}
          />

          {/* Title and details float over the poster. pb clears the form card that
              overlaps this panel on mobile. */}
          <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-14 md:px-16 md:pb-16">
            <div className="min-h-[88px] md:min-h-[150px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEventIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-3"
                >
                  {detailHref ? (
                    <Link href={detailHref} className="group inline-block">
                      <h1 className="text-lg md:text-5xl font-black text-white leading-tight drop-shadow-lg group-hover:text-[#e5ac53] transition-colors">
                        {currentEvent?.title || 'Upcoming Event'}
                      </h1>
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] md:text-sm font-semibold text-[#e5ac53]">
                        Read details
                        <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ) : (
                    <h1 className="text-lg md:text-5xl font-black text-white leading-tight drop-shadow-lg">
                      {currentEvent?.title || 'Upcoming Event'}
                    </h1>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-6 text-xs md:text-sm text-neutral-300 font-medium">
                    {events[currentEventIndex]?.date && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c3943a]" />
                        {events[currentEventIndex].date}
                      </div>
                    )}
                    {events[currentEventIndex]?.location && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c3943a]" />
                        {events[currentEventIndex].location}
                      </div>
                    )}
                  </div>
                  {!detailHref && !isLoadingEvents && (
                    <p className="text-sm md:text-base text-neutral-200 leading-relaxed font-normal max-w-xl pt-2 drop-shadow-md">
                      A seamless ecosystem of luxury, leisure, and entertainment.
                      Experience Sihanoukville’s new standard of a life well-lived. Kompong Dewa is an integrated luxury destination redefining Sihanoukville’s landscape. A bold fusion of high-octane excitement and serene tranquility, we stand as the new pulse of Cambodia’s rising coastal city.
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom row: carousel indicators left, event labels bottom-right */}
            <div className="flex items-center justify-between gap-3 mt-8">
              {!isLoadingEvents && (
                <div className="flex gap-2">
                  {events.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentEventIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentEventIndex ? 'w-8 bg-[#c3943a]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentEventIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="px-2 py-0.5 md:py-1 bg-white/10 backdrop-blur-md rounded text-[10px] md:text-xs font-medium text-[#e5ac53] border border-white/10 whitespace-nowrap"
                  >
                    {events[currentEventIndex]?.tag || 'Event'}
                  </motion.div>
                </AnimatePresence>
                {hasActiveEvents && (
                  <span className={`px-2.5 py-0.5 md:px-3 md:py-1 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full shadow-lg whitespace-nowrap ${currentEvent?.status === 'UPCOMING' ? 'bg-amber-600' : 'bg-[#c3943a]'}`}>
                    {currentEvent?.status === 'UPCOMING' ? 'Coming Soon' : 'Live Event'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right / Bottom Side: Form Area */}
        <div className="relative z-30 -mt-8 md:mt-0 w-full md:w-1/2 flex-1 md:h-[100dvh] flex flex-col justify-start md:justify-center items-center px-5 pt-6 pb-10 md:p-12 bg-[#F4F4F5] rounded-t-3xl md:rounded-none shadow-[0_-10px_30px_rgba(0,0,0,0.25)] md:shadow-none md:overflow-y-auto">
          {/* Grab handle — mobile only, signals the sheet */}
          <div className="w-10 h-1 rounded-full bg-neutral-300 mb-5 shrink-0 md:hidden" />
          <div className="w-full max-w-md relative z-10 my-auto md:my-0">


            {!hasActiveEvents && !isLoadingEvents ? (
              <div className="text-center py-10 px-4 flex flex-col items-center justify-center min-h-[250px]">
                <div className="w-20 h-20 bg-neutral-200/60 rounded-full flex items-center justify-center mb-6">
                  <CalendarX className="w-10 h-10 text-neutral-400" />
                </div>
                <h3 className="text-2xl font-black text-neutral-800 mb-3 tracking-tight">No Active Events</h3>
                <p className="text-sm text-neutral-500 max-w-[280px] mx-auto leading-relaxed">
                  There are currently no events open for registration. Please check back later!
                </p>
              </div>
            ) : !result ? (
              <>
                {/* Tabs */}
                <div className="flex bg-neutral-200/50 p-1 rounded-lg mb-4 md:mb-6">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('member'); handleReset(); }}
                    className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${activeTab === 'member'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-500 hover:text-black'
                      }`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('non-member'); handleReset(); }}
                    className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${activeTab === 'non-member'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-500 hover:text-black'
                      }`}
                  >
                    Non-Member
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-[340px] md:min-h-[380px]">
                  {activeTab === 'non-member' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 flex-1">
                      <div>
                        <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full bg-white border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-black placeholder:text-neutral-400 transition-all outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Phone Number / Email</label>
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+62 812... or name@email.com"
                          className="w-full bg-white border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-black placeholder:text-neutral-400 transition-all outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Nationality</label>
                        <input
                          type="text"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          placeholder="e.g. Cambodian, Chinese, etc."
                          className="w-full bg-white border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-black placeholder:text-neutral-400 transition-all outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Upload ID/Passport <span className="text-red-500">*</span></label>
                        <label className="w-full flex flex-row items-center justify-center gap-2 h-[44px] md:h-[50px] border-2 border-dashed border-neutral-300 rounded-lg transition-colors relative overflow-hidden bg-white hover:bg-neutral-50 cursor-pointer">
                          {passportFile ? (
                            <>
                              <FileImage className="w-4 h-4 text-orange-500 shrink-0" />
                              <span className="text-[10px] md:text-xs font-medium truncate max-w-[200px] text-orange-500">{passportFile.name}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-neutral-400 shrink-0" />
                              <span className="text-[10px] md:text-xs font-medium text-neutral-400">Click to upload (Required)</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" required />
                        </label>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={memberProfile ? '' : 'flex-1'}>
                      <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Member ID</label>
                      <input
                        type="text"
                        value={memberIdInput}
                        onChange={(e) => setMemberIdInput(e.target.value)}
                        placeholder="e.g. KDB-0000001..."
                        className="w-full bg-white border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-black placeholder:text-neutral-400 transition-all outline-none"
                        required
                      />
                    </motion.div>
                  )}

                  {/* Verified member card — the Member ID field stays visible above it. */}
                  {activeTab === 'member' && memberProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex-1 flex flex-col rounded-xl border border-neutral-300 bg-white p-5 text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full border border-neutral-300 bg-neutral-50 flex items-center justify-center overflow-hidden">
                          {memberProfile.member.avatarUrl ? (
                            <img
                              src={memberProfile.member.avatarUrl}
                              alt={memberProfile.member.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <UserCheck className="w-8 h-8 md:w-9 md:h-9 text-[#c3943a]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h2 className="text-lg md:text-xl font-black text-black truncate">
                              {memberProfile.member.name}
                            </h2>
                            <span className="shrink-0 px-2.5 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider">
                              {memberProfile.member.memberType}
                            </span>
                          </div>

                          <dl className="mt-3 space-y-2 text-[11px] md:text-xs">
                            <div className="flex gap-2">
                              <dt className="text-neutral-500 w-[74px] shrink-0">Card Serial:</dt>
                              <dd className="font-semibold text-neutral-800 truncate">{memberProfile.member.cardSerial}</dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="text-neutral-500 w-[74px] shrink-0">Nationality:</dt>
                              <dd className="font-semibold text-neutral-800 truncate">{memberProfile.member.nationality || '—'}</dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="text-neutral-500 w-[74px] shrink-0">Registered:</dt>
                              <dd className="font-semibold text-neutral-800 truncate">
                                {formatDate(memberProfile.member.dateJoined || memberProfile.member.createdAt)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      {/* Events get the full card width — titles are long and were
                        being truncated to nothing in the narrow right column. */}
                      <div className="mt-4 pt-4 border-t border-neutral-200 flex-1 min-h-0">
                        <p className="text-[11px] md:text-xs text-neutral-500 mb-1.5">Events:</p>
                        {memberProfile.events.length ? (
                          <ul className="space-y-1.5 overflow-y-auto max-h-28">
                            {memberProfile.events.map((ev, i) => (
                              <li
                                key={`${ev.eventId}-${i}`}
                                className="flex items-start gap-2 text-[11px] md:text-xs font-semibold text-neutral-800"
                              >
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c3943a] shrink-0" />
                                <span className="min-w-0">{ev.eventTitle}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] md:text-xs text-neutral-400">
                            No events registered yet.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'member' && memberProfile ? (
                    <div className="flex gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={handleRegisterEvent}
                        disabled={isRegistering || alreadyRegisteredForCurrent}
                        className="flex-1 bg-[#c3943a] hover:bg-[#e5ac53] text-white text-xs md:text-sm font-bold py-3 md:py-3.5 px-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRegistering ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>{alreadyRegisteredForCurrent ? (currentEvent?.status === 'UPCOMING' ? 'Expressed Interest' : 'Enrolled') : (currentEvent?.status === 'UPCOMING' ? "I'm Interested" : 'Enrollment Now')}</span>
                        )}
                      </button>
                      {detailHref ? (
                        <Link
                          href={detailHref}
                          className="flex-1 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-xs md:text-sm font-bold py-3 md:py-3.5 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center text-center"
                        >
                          View Details / More Info
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="flex-1 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-xs md:text-sm font-bold py-3 md:py-3.5 px-3 rounded-lg shadow-sm transition-all"
                        >
                          Use another ID
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#c3943a] hover:bg-[#e5ac53] text-white text-sm md:text-base font-bold py-3 md:py-3.5 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span>{activeTab === 'member' ? 'Verify' : (currentEvent?.status === 'UPCOMING' ? "I'm Interested" : 'Enrollment Event')}</span>
                      )}
                    </button>
                  )}
                </form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full bg-white rounded-t-3xl md:rounded-3xl mt-auto overflow-hidden text-left"
              >
                <div className="py-8 px-6 md:px-8">
                  <div className="flex justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full scale-150 animate-pulse" />
                    <div className="relative w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10">
                      <CheckedIcon ref={iconRef} size={40} />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-black text-black mb-2 tracking-tight">Enrollment Successful</h2>
                    <p className="text-neutral-500 text-sm">
                      Your enrollment has been securely recorded.
                    </p>
                  </div>

                  <div className="w-full border-t-[1.5px] border-dashed border-neutral-200 my-6" />

                  <div className="space-y-4">
                    <h3 className="text-[14px] font-bold text-neutral-800 mb-2">Enrollment details</h3>
                    {(result.memberData?.name || name) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Name</span>
                        <span className="font-bold text-neutral-800">{result.memberData?.name || name}</span>
                      </div>
                    )}

                    {result.registration?.eventTitle && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Event</span>
                        <span className="font-bold text-neutral-800 text-right max-w-[65%] truncate" title={result.registration.eventTitle}>
                          {result.registration.eventTitle}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500">Status</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        Completed <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {result.memberId && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Member ID</span>
                        <span className="font-bold text-neutral-800">{result.memberId}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500">Date</span>
                      <span className="font-bold text-neutral-800">
                        {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-500">Time</span>
                      <span className="font-bold text-neutral-800">
                        {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="w-full border-t-[1.5px] border-dashed border-neutral-200 my-6" />

                  <div className="space-y-4">
                    <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider text-center">Verify your status via</p>
                    <div className="flex gap-3">
                      <a
                        href="https://t.me/KompongDewaMarketing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#2090c5] text-white text-sm md:text-base py-3 rounded-xl font-bold transition-all border border-[#1b81b3] shadow-[inset_0px_2px_0px_0px_rgba(255,255,255,0.3)] active:translate-y-[1px] active:shadow-none"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                        </svg>
                        <span>Telegram</span>
                      </a>

                      <a
                        href="https://wa.me/+85561627566?text="
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#22c35e] text-white text-sm md:text-base py-3 rounded-xl font-bold transition-all border border-[#1ea852] shadow-[inset_0px_2px_0px_0px_rgba(255,255,255,0.3)] active:translate-y-[1px] active:shadow-none"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full bg-[#1c1c1c] hover:bg-[#262626] text-white text-sm md:text-base font-bold mt-8 py-3.5 md:py-4 rounded-2xl transition-all border border-black shadow-[inset_0px_2px_0px_0px_rgba(255,255,255,0.15)] active:translate-y-[1px] active:shadow-none"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
