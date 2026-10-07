'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, Image as ImageIcon, Images, Loader2, Search, Calendar, MapPin, Tag, Users, Eye, Code, Copy, Check, Sparkles, Wand2, QrCode, Film, BookOpen, ClipboardList, ExternalLink, Download, Globe, GripVertical, FileText, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { EventQrModal } from '@/components/dashboard/event-qr-modal';
import { MediaLibraryModal } from '@/components/dashboard/media-library-modal';
import { directUploadSingleFile } from '@/lib/uploads/client-upload';
import { isVideoFile } from '@/lib/uploads/file-utils';
import { TelegramImageSlot } from '@/components/dashboard/telegram-image-slot';
import {
  EventImageSlots,
  emptySlots,
  emptySlot,
  slotsFromImages,
  slotIsFilled,
  isHttpUrl,
  type ImageSlot,
} from '@/components/dashboard/event-image-slots';

// Pulls in Quill, which needs `document` — client-side only.
const RichTextEditor = dynamic(() => import('@/components/shared/rich-text-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] flex items-center justify-center text-sm text-neutral-400">
      Loading editor…
    </div>
  ),
});

// Descriptions are HTML now — cards show a plain-text excerpt.
const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const extractPosterImages = (html?: string | null): string[] => {
  if (!html) return [];
  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  return matches.map((m) => m[1]).filter(Boolean);
};

const isImageModeContent = (html?: string | null): boolean => {
  if (!html) return false;
  if (html.includes('data-post-type="image"')) return true;
  const imgs = extractPosterImages(html);
  const plainText = stripHtml(html);
  return imgs.length > 0 && plainText.length < 50;
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${dateFormat.format(startDate)} – ${dateFormat.format(endDate)}`;
};

type Event = {
  id: string;
  title: string;
  description: string | null;
  titleZh: string | null;
  descriptionZh: string | null;
  titleId: string | null;
  descriptionId: string | null;
  defaultLang?: string | null;
  images: string[];
  imageUrl: string | null;
  telegramImageUrl?: string | null;
  tag: string | null;
  date: string | null;
  startAt?: string | null;
  endAt?: string | null;
  dateZh?: string | null;
  dateId?: string | null;
  location: string | null;
  locationZh?: string | null;
  locationId?: string | null;
  concept?: string | null;
  conceptZh?: string | null;
  conceptId?: string | null;
  status: string;
  orderIndex: number;
  createdAt: string;
};

/** Rows saved before `images` existed only carry `imageUrl`. */
const imagesOf = (event: Event): string[] =>
  event.images?.length ? event.images : event.imageUrl ? [event.imageUrl] : [];

export default function EventsManagementPage() {
  const { openSidebar } = useDashboard();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [embedModalEvent, setEmbedModalEvent] = useState<Event | null>(null);
  const [embedTarget, setEmbedTarget] = useState<'register' | 'detail' | 'wordpress'>('register');
  const [qrModalEvent, setQrModalEvent] = useState<Event | null>(null);
  const [hasCopiedEmbed, setHasCopiedEmbed] = useState(false);

  // Drag and Drop Reordering State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Form State
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'id' | 'zh'>('en');
  const [defaultLang, setDefaultLang] = useState<'en' | 'id' | 'zh'>('en');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [descriptionZh, setDescriptionZh] = useState('');
  const [titleId, setTitleId] = useState('');
  const [descriptionId, setDescriptionId] = useState('');
  type DescMode = 'richtext' | 'image';
  const [descModeEn, setDescModeEn] = useState<DescMode>('richtext');
  const [descModeId, setDescModeId] = useState<DescMode>('richtext');
  const [descModeZh, setDescModeZh] = useState<DescMode>('richtext');
  const [posterImagesEn, setPosterImagesEn] = useState<string[]>([]);
  const [posterImagesId, setPosterImagesId] = useState<string[]>([]);
  const [posterImagesZh, setPosterImagesZh] = useState<string[]>([]);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [posterUrlInput, setPosterUrlInput] = useState('');
  const [isPosterLibraryOpen, setIsPosterLibraryOpen] = useState(false);

  const currentDescMode =
    activeLangTab === 'en' ? descModeEn : activeLangTab === 'id' ? descModeId : descModeZh;

  const setCurrentDescMode = (mode: DescMode) => {
    if (activeLangTab === 'en') setDescModeEn(mode);
    if (activeLangTab === 'id') setDescModeId(mode);
    if (activeLangTab === 'zh') setDescModeZh(mode);
  };

  const currentPosterImages =
    activeLangTab === 'en'
      ? posterImagesEn
      : activeLangTab === 'id'
      ? posterImagesId
      : posterImagesZh;

  const setCurrentPosterImages = (images: string[]) => {
    if (activeLangTab === 'en') setPosterImagesEn(images);
    if (activeLangTab === 'id') setPosterImagesId(images);
    if (activeLangTab === 'zh') setPosterImagesZh(images);
  };
  const [tag, setTag] = useState('');
  const [date, setDate] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [dateZh, setDateZh] = useState('');
  const [dateId, setDateId] = useState('');
  const [location, setLocation] = useState('');
  const [locationZh, setLocationZh] = useState('');
  const [locationId, setLocationId] = useState('');
  const [concept, setConcept] = useState('');
  const [conceptZh, setConceptZh] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [orderIndex, setOrderIndex] = useState(0);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(emptySlots());
  const [telegramSlot, setTelegramSlot] = useState<ImageSlot>(emptySlot());
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isAIPolishing, setIsAIPolishing] = useState(false);
  const [aiReviewData, setAiReviewData] = useState<{
    original: string;
    polished: string;
    changes: Array<{ original: string; fixed: string; reason: string }>;
    summary: string;
    lang: 'en' | 'id' | 'zh';
  } | null>(null);
  const [aiPreviewTab, setAiPreviewTab] = useState<'changes' | 'preview'>('changes');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setEditingEvent(null);
    setActiveLangTab('en');
    setDefaultLang('en');
    setTitle('');
    setDescription('');
    setTitleZh('');
    setDescriptionZh('');
    setTitleId('');
    setDescriptionId('');
    setTag('');
    setDate('');
    setStartAt('');
    setEndAt('');
    setDateZh('');
    setDateId('');
    setLocation('');
    setLocationZh('');
    setLocationId('');
    setConcept('');
    setConceptZh('');
    setConceptId('');
    setStatus('ACTIVE');
    setOrderIndex(0);
    setImageSlots(emptySlots());
    setDescModeEn('richtext');
    setDescModeId('richtext');
    setDescModeZh('richtext');
    setPosterImagesEn([]);
    setPosterImagesId([]);
    setPosterImagesZh([]);
    setPosterUrlInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: Event) => {
    setEditingEvent(event);
    setActiveLangTab('en');
    setDefaultLang((event.defaultLang as 'en' | 'id' | 'zh') || 'en');
    setTitle(event.title);
    setDescription(event.description || '');
    setTitleZh(event.titleZh || '');
    setDescriptionZh(event.descriptionZh || '');
    setTitleId(event.titleId || '');
    setDescriptionId(event.descriptionId || '');

    // Initialize description modes & poster images per language
    if (isImageModeContent(event.description)) {
      setDescModeEn('image');
      setPosterImagesEn(extractPosterImages(event.description));
    } else {
      setDescModeEn('richtext');
      setPosterImagesEn([]);
    }

    if (isImageModeContent(event.descriptionId)) {
      setDescModeId('image');
      setPosterImagesId(extractPosterImages(event.descriptionId));
    } else {
      setDescModeId('richtext');
      setPosterImagesId([]);
    }

    if (isImageModeContent(event.descriptionZh)) {
      setDescModeZh('image');
      setPosterImagesZh(extractPosterImages(event.descriptionZh));
    } else {
      setDescModeZh('richtext');
      setPosterImagesZh([]);
    }
    setPosterUrlInput('');

    setTag(event.tag || '');
    setDate(event.date || '');
    setStartAt(toDateTimeLocal(event.startAt));
    setEndAt(toDateTimeLocal(event.endAt));
    setDateZh(event.dateZh || '');
    setDateId(event.dateId || '');
    setLocation(event.location || '');
    setLocationZh(event.locationZh || '');
    setLocationId(event.locationId || '');
    setConcept(event.concept || '');
    setConceptZh(event.conceptZh || '');
    setConceptId(event.conceptId || '');
    setStatus(event.status);
    setOrderIndex(event.orderIndex || 0);
    setImageSlots(slotsFromImages(imagesOf(event)));
    setTelegramSlot(
      event.telegramImageUrl
        ? { file: null, url: event.telegramImageUrl, existing: event.telegramImageUrl }
        : emptySlot()
    );
    setIsModalOpen(true);
  };

  const handleUploadPosterFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingPoster(true);
    const toastId = toast.loading('Uploading tournament flyer image(s)...');

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        try {
          const res = await directUploadSingleFile(file);
          if (res?.imageUrl) {
            uploadedUrls.push(res.imageUrl);
          } else if (res?.file?.imageUrl) {
            uploadedUrls.push(res.file.imageUrl);
          }
        } catch (err: any) {
          toast.error(`Failed to upload ${file.name}: ${err?.message || 'Upload error'}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setCurrentPosterImages([...currentPosterImages, ...uploadedUrls]);
        toast.success(`Attached ${uploadedUrls.length} flyer sheet(s)!`);
      }
    } catch {
      toast.error('Failed to process poster upload');
    } finally {
      setIsUploadingPoster(false);
      toast.dismiss(toastId);
    }
  };

  const handleAddPosterUrl = () => {
    if (!posterUrlInput.trim()) return;
    if (!isHttpUrl(posterUrlInput) && !posterUrlInput.startsWith('/api/raw')) {
      toast.error('Please enter a valid image URL');
      return;
    }
    setCurrentPosterImages([...currentPosterImages, posterUrlInput.trim()]);
    setPosterUrlInput('');
    toast.success('Flyer image URL added');
  };

  const handleRemovePosterImage = (idx: number) => {
    const next = [...currentPosterImages];
    next.splice(idx, 1);
    setCurrentPosterImages(next);
  };

  const handleMovePosterImage = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentPosterImages.length) return;
    const next = [...currentPosterImages];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    setCurrentPosterImages(next);
  };

  const handleAIPolish = async () => {
    const currentDesc = activeLangTab === 'en' ? description : activeLangTab === 'id' ? descriptionId : descriptionZh;
    if (!currentDesc || !currentDesc.trim() || currentDesc === '<p><br></p>') {
      toast.error('Please type some content in the description before using AI polish.');
      return;
    }

    setIsAIPolishing(true);
    const toastId = toast.loading('Gemini AI is analyzing and detecting spacing & typos...');
    try {
      const res = await fetch('/api/admin/ai/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentDesc,
          language: activeLangTab,
          field: 'description',
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.polishedContent) {
        const polished = data.data.polishedContent;
        const changes = data.data.changes || [];
        const summary = data.data.summary || 'Content polished successfully.';

        toast.dismiss(toastId);

        setAiReviewData({
          original: currentDesc,
          polished: polished,
          changes: changes,
          summary: summary,
          lang: activeLangTab,
        });
        setAiPreviewTab('changes');
      } else {
        toast.error(data.error || 'Failed to polish content with AI', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Network error while communicating with AI service', { id: toastId });
    } finally {
      setIsAIPolishing(false);
    }
  };

  const handleApplyAIFixes = () => {
    if (!aiReviewData) return;
    if (aiReviewData.lang === 'en') setDescription(aiReviewData.polished);
    if (aiReviewData.lang === 'id') setDescriptionId(aiReviewData.polished);
    if (aiReviewData.lang === 'zh') setDescriptionZh(aiReviewData.polished);
    toast.success('AI corrections applied to description!');
    setAiReviewData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');
    if (!startAt || !endAt) return toast.error('Event start and end date/time are required');
    if (endAt < startAt) return toast.error('Event end cannot be before the start');

    const badUrlSlot = imageSlots.findIndex(
      (slot) => !slot.file && slot.url.trim() && !isHttpUrl(slot.url)
    );
    if (badUrlSlot !== -1) {
      return toast.error(`Image URL ${badUrlSlot + 1} must be a valid link (http://, https://) or library path (/api/raw...)`);
    }

    if (!telegramSlot.file && telegramSlot.url.trim() && !isHttpUrl(telegramSlot.url)) {
      return toast.error('Telegram Image URL must be a valid link (http://, https://) or library path (/api/raw...)');
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      let finalDescEn = description;
      if (descModeEn === 'image') {
        finalDescEn =
          posterImagesEn.length > 0
            ? `<div data-post-type="image" class="event-detail-posters space-y-4">${posterImagesEn
                .map(
                  (url) =>
                    `<img src="${url}" alt="${title}" class="w-full h-auto rounded-xl shadow-lg my-2" />`
                )
                .join('')}</div>`
            : '';
      }

      let finalDescId = descriptionId;
      if (descModeId === 'image') {
        finalDescId =
          posterImagesId.length > 0
            ? `<div data-post-type="image" class="event-detail-posters space-y-4">${posterImagesId
                .map(
                  (url) =>
                    `<img src="${url}" alt="${titleId || title}" class="w-full h-auto rounded-xl shadow-lg my-2" />`
                )
                .join('')}</div>`
            : '';
      }

      let finalDescZh = descriptionZh;
      if (descModeZh === 'image') {
        finalDescZh =
          posterImagesZh.length > 0
            ? `<div data-post-type="image" class="event-detail-posters space-y-4">${posterImagesZh
                .map(
                  (url) =>
                    `<img src="${url}" alt="${titleZh || title}" class="w-full h-auto rounded-xl shadow-lg my-2" />`
                )
                .join('')}</div>`
            : '';
      }

      const hasContentEn = finalDescEn.includes('<img') || !!stripHtml(finalDescEn);
      const hasContentId = finalDescId.includes('<img') || !!stripHtml(finalDescId);
      const hasContentZh = finalDescZh.includes('<img') || !!stripHtml(finalDescZh);

      formData.append('title', title);
      formData.append('description', hasContentEn ? finalDescEn : '');
      formData.append('titleZh', titleZh);
      formData.append('descriptionZh', hasContentZh ? finalDescZh : '');
      formData.append('titleId', titleId);
      formData.append('descriptionId', hasContentId ? finalDescId : '');
      formData.append('defaultLang', defaultLang);
      formData.append('tag', tag);
      formData.append('date', formatDateRange(startAt, endAt));
      formData.append('startAt', new Date(`${startAt}T00:00:00`).toISOString());
      formData.append('endAt', new Date(`${endAt}T23:59:59.999`).toISOString());
      formData.append('dateZh', dateZh);
      formData.append('dateId', dateId);
      formData.append('location', location);
      formData.append('locationZh', locationZh);
      formData.append('locationId', locationId);
      formData.append('concept', concept);
      formData.append('conceptZh', conceptZh);
      formData.append('conceptId', conceptId);
      formData.append('status', status);
      formData.append('orderIndex', orderIndex.toString());
      // One set of fields per slot. A slot the server hears nothing about is
      // treated as cleared, which is how removing an image works on edit.
      imageSlots.forEach((slot, i) => {
        const n = i + 1;
        if (slot.file) {
          formData.append(`image${n}`, slot.file);
        } else if (slot.url.trim()) {
          formData.append(`imageUrl${n}`, slot.url.trim());
        } else if (slot.existing) {
          formData.append(`existingImage${n}`, slot.existing);
        }
      });

      if (telegramSlot.file) {
        formData.append('telegramImage', telegramSlot.file);
      } else if (telegramSlot.url.trim()) {
        formData.append('telegramImageUrl', telegramSlot.url.trim());
      } else if (telegramSlot.existing) {
        formData.append('existingTelegramImage', telegramSlot.existing);
      }

      const res = await fetch(
        editingEvent ? `/api/admin/events/${editingEvent.id}` : '/api/admin/events',
        { method: editingEvent ? 'PUT' : 'POST', body: formData }
      );

      const data = await res.json();
      if (data.success) {
        if (editingEvent) {
          toast.success('Event updated successfully');
          setEvents(events.map(ev => (ev.id === data.data.id ? data.data : ev)));
        } else {
          toast.success('Event created successfully');
          setEvents([data.data, ...events]);
        }
        setIsModalOpen(false);
      } else {
        toast.error(data.error || (editingEvent ? 'Failed to update event' : 'Failed to create event'));
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents(events.map(ev => ev.id === id ? { ...ev, status: newStatus } : ev));
        toast.success('Event status updated');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };
  
  const updateOrder = async (id: string, newOrder: number) => {
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIndex: newOrder }),
      });
      const data = await res.json();
      if (data.success) {
        // Re-sort events array
        const updatedEvents = events.map(ev => ev.id === id ? { ...ev, orderIndex: newOrder } : ev);
        updatedEvents.sort((a, b) => a.orderIndex - b.orderIndex || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEvents(updatedEvents);
        toast.success('Event order updated');
      }
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...events];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Re-assign orderIndex sequentially: 0, 1, 2, ...
    const updated = reordered.map((ev, idx) => ({
      ...ev,
      orderIndex: idx,
    }));

    setEvents(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsReordering(true);

    try {
      const itemsToUpdate = updated.map((ev) => ({
        id: ev.id,
        orderIndex: ev.orderIndex,
      }));

      const res = await fetch('/api/admin/events/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToUpdate }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Event order saved');
      } else {
        toast.error(json.error || 'Failed to save order');
      }
    } catch {
      toast.error('Failed to sync event order');
    } finally {
      setIsReordering(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setEvents(events.filter(ev => ev.id !== id));
        toast.success('Event deleted');
      }
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header title="Events Management" description="Manage your upcoming events" onMenuClick={openSidebar} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Parent-Child Sub Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mr-2">
            Event Management:
          </span>
          <Link
            href="/dashboard/events"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            Events List
          </Link>
          <Link
            href="/dashboard/events/players"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            Manage Players
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">All Events</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Drag and drop cards to reorder. The top event will automatically be featured on the homepage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isReordering && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving order...
              </span>
            )}
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">No events found</h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              You haven't created any events yet. Add an event to see it here and on the registration page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => {
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={event.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all group flex flex-col cursor-move select-none relative ${
                    isDragging
                      ? 'opacity-40 border-dashed border-blue-500 scale-[0.98]'
                      : isDragOver
                      ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg scale-[1.01]'
                      : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="relative h-48 bg-neutral-200 dark:bg-neutral-800">
                    {/* Drag Grip Handle */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-black/75 text-neutral-300 hover:text-white backdrop-blur-sm border border-white/20 shadow-sm cursor-grab active:cursor-grabbing" title="Drag to reorder">
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs">{imagesOf(event).length ? 'Image unavailable' : 'No image'}</span>
                    </div>
                    {imagesOf(event)[0] && (
                      isVideoFile(imagesOf(event)[0]) ? (
                        <video
                          src={imagesOf(event)[0]}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="relative w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={imagesOf(event)[0]}
                          alt=""
                          className="relative w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                        />
                      )
                    )}
                    {imagesOf(event)[0] && isVideoFile(imagesOf(event)[0]) && (
                      <span className="absolute top-3 left-12 px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/75 text-[#e5ac53] backdrop-blur-sm flex items-center gap-1 border border-[#c3943a]/30 z-10">
                        <Film className="w-3 h-3" />
                        MOTION / MP4
                      </span>
                    )}
                  {imagesOf(event).length > 1 && (
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/70 text-white backdrop-blur-sm z-10">
                      {imagesOf(event).length} media items
                    </span>
                  )}
                  {event.telegramImageUrl && (
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 text-[10px] font-medium rounded-full bg-black/75 text-sky-300 backdrop-blur-sm z-10 flex items-center gap-1 border border-sky-500/30">
                      Telegram Thumb
                    </span>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full shadow-sm border transition-colors text-center ${
                        event.status?.toUpperCase() === 'ACTIVE' || event.status?.toUpperCase().includes('LIVE') || event.status?.toUpperCase().includes('OPEN')
                          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800'
                          : event.status?.toUpperCase() === 'UPCOMING' || event.status?.toUpperCase().includes('SOON')
                          ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800'
                          : event.status?.toUpperCase() === 'HIDDEN'
                          ? 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                          : 'bg-[#c3943a]/15 text-[#c3943a] border-[#c3943a]/30 dark:bg-[#c3943a]/20 dark:text-[#e5ac53]'
                      }`}
                    >
                      {event.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2 justify-between">
                    {event.tag && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                        {event.tag}
                      </span>
                    )}
                    <div 
                      onMouseDown={(e) => e.stopPropagation()} 
                      className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-700"
                    >
                      <span className="text-[10px] text-neutral-500 font-medium">Order:</span>
                      <input 
                        type="number" 
                        value={event.orderIndex} 
                        onChange={(e) => updateOrder(event.id, parseInt(e.target.value) || 0)}
                        className="w-8 text-[11px] font-bold text-center bg-transparent outline-none text-neutral-700 dark:text-neutral-300"
                        min="0"
                      />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 line-clamp-1">{event.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4 flex-1">
                    {(event.description && stripHtml(event.description)) || 'No description provided.'}
                  </p>
                  
                  <div className="space-y-1.5 mb-6 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {event.date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {event.date}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                      </div>
                    )}
                    {event.concept && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{event.concept}</span>
                      </div>
                    )}
                  </div>

                  <div 
                    onMouseDown={(e) => e.stopPropagation()} 
                    className="flex items-center justify-end gap-1.5 mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800/50"
                  >
                    <button
                      onClick={() => setQrModalEvent(event)}
                      className="p-2 text-neutral-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Generate QR Code (Registration Form / Terms)"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/event/${event.id}`}
                      target="_blank"
                      className="p-2 text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                      title="View Public Page"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => { setEmbedModalEvent(event); setHasCopiedEmbed(false); }}
                      className="p-2 text-neutral-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors"
                      title="Embed Event"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(event)}
                      className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                      title="Edit Event"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </main>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[90vw] lg:max-w-[80vw] bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {editingEvent ? 'Edit Event' : 'Add New Event'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="event-form" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg w-full mb-2">
                        <button type="button" onClick={() => setActiveLangTab('en')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${activeLangTab === 'en' ? 'bg-white dark:bg-neutral-900 shadow text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
                          <img src="https://flagcdn.com/w20/gb.png" alt="English" className="w-4 h-auto rounded-sm" /> English
                        </button>
                        <button type="button" onClick={() => setActiveLangTab('id')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${activeLangTab === 'id' ? 'bg-white dark:bg-neutral-900 shadow text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
                          <img src="https://flagcdn.com/w20/id.png" alt="Bahasa" className="w-4 h-auto border border-neutral-200 dark:border-neutral-700 rounded-sm" /> Bahasa
                        </button>
                        <button type="button" onClick={() => setActiveLangTab('zh')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all ${activeLangTab === 'zh' ? 'bg-white dark:bg-neutral-900 shadow text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
                          <img src="https://flagcdn.com/w20/cn.png" alt="Chinese" className="w-4 h-auto rounded-sm" /> 中文
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2 bg-neutral-50 dark:bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            Reading Page Default Language
                          </label>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Visitors opening this event will see this language by default.
                          </p>
                        </div>
                        <div className="flex flex-wrap bg-neutral-200/80 dark:bg-neutral-800 p-1 rounded-lg shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => setDefaultLang('en')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                              defaultLang === 'en'
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                          >
                            <img src="https://flagcdn.com/w20/us.png" alt="English" className="w-3.5 h-auto rounded-[2px]" />
                            English (Default)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDefaultLang('id')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                              defaultLang === 'id'
                                ? 'bg-[#c3943a] text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                          >
                            <img src="https://flagcdn.com/w20/id.png" alt="Bahasa" className="w-3.5 h-auto rounded-[2px]" />
                            Bahasa (Default)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDefaultLang('zh')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              defaultLang === 'zh'
                                ? 'bg-[#c3943a] text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                          >
                            <img src="https://flagcdn.com/w20/cn.png" alt="Chinese" className="w-3.5 h-auto rounded-[2px]" />
                            Chinese (Default)
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Title {activeLangTab === 'en' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={activeLangTab === 'en' ? title : activeLangTab === 'id' ? titleId : titleZh}
                        onChange={(e) => {
                          if (activeLangTab === 'en') setTitle(e.target.value);
                          if (activeLangTab === 'id') setTitleId(e.target.value);
                          if (activeLangTab === 'zh') setTitleZh(e.target.value);
                        }}
                        placeholder={activeLangTab === 'en' ? "e.g. Poker Tournament 2026" : activeLangTab === 'id' ? "e.g. Turnamen Poker 2026" : "e.g. 2026年扑克锦标赛"}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                        required={activeLangTab === 'en'}
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Description ({activeLangTab.toUpperCase()})
                          </label>

                          {/* Format Switcher: Rich Text vs Image Poster */}
                          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setCurrentDescMode('richtext')}
                              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                currentDescMode === 'richtext'
                                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Rich Text</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentDescMode('image')}
                              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                currentDescMode === 'image'
                                  ? 'bg-[#c3943a] text-black shadow-xs font-extrabold'
                                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Flyer / Poster Image</span>
                              {currentPosterImages.length > 0 && (
                                <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px] font-bold">
                                  {currentPosterImages.length}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        {currentDescMode === 'richtext' && (
                          <button
                            type="button"
                            onClick={handleAIPolish}
                            disabled={isAIPolishing}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-[#c3943a] dark:text-[#e5ac53] border border-[#c3943a]/30 hover:border-[#c3943a] rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Auto-correct missing word spacing (e.g., '5thandgame' -> '5th and game'), spelling, and grammar without breaking tables or HTML formatting"
                          >
                            {isAIPolishing ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c3943a]" />
                                <span>AI Polishing...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-[#c3943a]" />
                                <span>AI Fix Spacing & Polish</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Mode A: Rich Text Editor */}
                      {currentDescMode === 'richtext' ? (
                        <div>
                          <div className="event-description-editor bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg overflow-hidden">
                            <RichTextEditor
                              key={activeLangTab} // Force remount on tab change to reset editor state cleanly
                              value={activeLangTab === 'en' ? description : activeLangTab === 'id' ? descriptionId : descriptionZh}
                              onChange={(val) => {
                                if (activeLangTab === 'en') setDescription(val);
                                if (activeLangTab === 'id') setDescriptionId(val);
                                if (activeLangTab === 'zh') setDescriptionZh(val);
                              }}
                              placeholder={activeLangTab === 'en' ? "Detailed information about the event..." : "Informasi detail tentang acara..."}
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">
                            You can easily insert tables using the toolbar. Drag column edges to resize them perfectly.
                          </p>
                        </div>
                      ) : (
                        /* Mode B: Poster / Flyer Image Mode */
                        <div className="space-y-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                          {/* Flyer Top Action Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                Flyer / Poster Sheets ({currentPosterImages.length})
                              </span>
                              <p className="text-[11px] text-neutral-500">
                                Choose from your Media Library or upload new sheets for player view.
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsPosterLibraryOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-neutral-900 bg-[#c3943a] hover:bg-[#d4a84e] rounded-lg shadow-xs transition-all cursor-pointer"
                              >
                                <Images className="w-4 h-4" />
                                <span>Choose from Library</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('poster-file-input');
                                  if (input) input.click();
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload New</span>
                              </button>
                            </div>
                          </div>

                          {/* Upload Dropzone */}
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.files) {
                                handleUploadPosterFiles(e.dataTransfer.files);
                              }
                            }}
                            className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#c3943a] dark:hover:border-[#c3943a] rounded-xl p-5 flex flex-col items-center justify-center text-center transition-colors bg-white dark:bg-neutral-950 group"
                          >
                            <input
                              id="poster-file-input"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files) {
                                  handleUploadPosterFiles(e.target.files);
                                }
                              }}
                            />
                            {isUploadingPoster ? (
                              <div className="flex flex-col items-center gap-2 text-neutral-500 py-3">
                                <Loader2 className="w-8 h-8 animate-spin text-[#c3943a]" />
                                <span className="text-sm font-semibold">Uploading flyer image to storage...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <div className="flex flex-wrap items-center justify-center gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => setIsPosterLibraryOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-900 bg-[#c3943a] hover:bg-[#d4a84e] rounded-lg shadow-sm transition-all cursor-pointer"
                                  >
                                    <Images className="w-4 h-4" />
                                    <span>Choose from Library</span>
                                  </button>
                                  <span className="text-xs text-neutral-400">or</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById('poster-file-input');
                                      if (input) input.click();
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Browse Local Files</span>
                                  </button>
                                </div>
                                <p className="text-[11px] text-neutral-400">
                                  Drag & drop flyer files here. Supports high-resolution PNG, JPG, WebP sheets.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Quick URL Input */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={posterUrlInput}
                              onChange={(e) => setPosterUrlInput(e.target.value)}
                              placeholder="Or paste an image URL (https://... or /api/raw...)"
                              className="flex-1 px-3 py-2 text-xs bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-[#c3943a]/30 focus:border-[#c3943a] dark:text-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddPosterUrl();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleAddPosterUrl}
                              className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Add URL
                            </button>
                          </div>

                          {/* List of Uploaded Sheets / Images */}
                          {currentPosterImages.length > 0 ? (
                            <div className="space-y-3 pt-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                                Attached Flyer Sheets ({currentPosterImages.length})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {currentPosterImages.map((imgUrl, idx) => (
                                  <div
                                    key={idx}
                                    className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-950 shadow-xs flex flex-col"
                                  >
                                    <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                                      <img
                                        src={imgUrl}
                                        alt={`Flyer Page ${idx + 1}`}
                                        className="w-full h-full object-contain"
                                      />
                                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-sm rounded text-[10px] font-bold text-white border border-white/20">
                                        Page {idx + 1}
                                      </span>
                                    </div>
                                    <div className="p-2 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-800">
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={() => handleMovePosterImage(idx, 'up')}
                                          className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                          title="Move Up"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === currentPosterImages.length - 1}
                                          onClick={() => handleMovePosterImage(idx, 'down')}
                                          className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                          title="Move Down"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePosterImage(idx)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                                        title="Remove Page"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-center rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400">
                              No flyer images uploaded yet. Drop an image above to attach your tournament rules sheet.
                            </div>
                          )}

                          <p className="text-[11px] text-[#c3943a] dark:text-[#e5ac53] flex items-center gap-1.5 pt-1">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>
                              In Flyer/Poster mode, visitors on the reading page will be presented with high-definition posters, zoom, and download controls.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Event Type (Game)
                      </label>
                      <select
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      >
                        <option value="">Select Type</option>
                        <option value="Baccarat">Baccarat</option>
                        <option value="Poker">Poker</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Event Dates
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3">
                          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Event starts</span>
                          <input
                            type="date"
                            value={startAt}
                            onChange={(e) => setStartAt(e.target.value)}
                            className="w-full bg-transparent text-sm text-neutral-900 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]"
                            required
                          />
                        </div>
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3">
                          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Event ends</span>
                          <input
                            type="date"
                            value={endAt}
                            min={startAt || undefined}
                            onChange={(e) => setEndAt(e.target.value)}
                            className="w-full bg-transparent text-sm text-neutral-900 dark:text-white outline-none [color-scheme:light] dark:[color-scheme:dark]"
                            required
                          />
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-500">Select the first and last day of the event.</p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Location ({activeLangTab.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={activeLangTab === 'en' ? location : activeLangTab === 'id' ? locationId : locationZh}
                        onChange={(e) => {
                          if (activeLangTab === 'en') setLocation(e.target.value);
                          if (activeLangTab === 'id') setLocationId(e.target.value);
                          if (activeLangTab === 'zh') setLocationZh(e.target.value);
                        }}
                        placeholder={
                          activeLangTab === 'en'
                            ? "e.g. Casino, 1st Floor - Kompong Dewa Resort..."
                            : activeLangTab === 'id'
                            ? "e.g. Kasino, Lantai 1 - Kompong Dewa Resort..."
                            : "e.g. 赌场1楼 - 贡布德瓦综合度假村..."
                        }
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Event Concept ({activeLangTab.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={activeLangTab === 'en' ? concept : activeLangTab === 'id' ? conceptId : conceptZh}
                        onChange={(e) => {
                          if (activeLangTab === 'en') setConcept(e.target.value);
                          if (activeLangTab === 'id') setConceptId(e.target.value);
                          if (activeLangTab === 'zh') setConceptZh(e.target.value);
                        }}
                        placeholder={
                          activeLangTab === 'en'
                            ? "e.g. Traditional Mid-Autumn Celebration & High Stakes Tournament..."
                            : activeLangTab === 'id'
                            ? "e.g. Perayaan Tradisional Musim Gugur & Turnamen..."
                            : "e.g. 中秋传统庆典与高额锦标赛..."
                        }
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Cover Images
                      </label>
                      <EventImageSlots slots={imageSlots} onChange={setImageSlots} />
                    </div>

                    <div className="sm:col-span-2">
                      <TelegramImageSlot
                        slot={telegramSlot}
                        onChange={setTelegramSlot}
                        hasVideoCover={Boolean(
                          imageSlots.some(
                            (s) =>
                              (s.file && isVideoFile(s.file.name)) ||
                              (s.url && isVideoFile(s.url)) ||
                              (s.existing && isVideoFile(s.existing))
                          )
                        )}
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Event Status (Custom Text)
                      </label>
                      <input
                        type="text"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        placeholder="e.g. LIVE EVENT, UPCOMING, ACTIVE, HIDDEN"
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {['LIVE EVENT', 'ACTIVE', 'UPCOMING', 'REGISTRATION OPEN', 'HIDDEN'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setStatus(preset)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                              status === preset
                                ? 'bg-[#c3943a] text-white border-[#c3943a]'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Sort Order Position
                      </label>
                      <input
                        type="number"
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                        min="0"
                      />
                      <p className="mt-1 text-xs text-neutral-500">Lower numbers appear first (e.g. 1, 2, 3)</p>
                    </div>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="event-form"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Embed Modal */}
      <AnimatePresence>
        {embedModalEvent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEmbedModalEvent(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-600" /> Direct Embed
                </h3>
                <button
                  onClick={() => setEmbedModalEvent(null)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="p-6">
                {/* Embed Target Selection Tabs */}
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEmbedTarget('register');
                      setHasCopiedEmbed(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                      embedTarget === 'register'
                        ? 'bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Register Form
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmbedTarget('detail');
                      setHasCopiedEmbed(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                      embedTarget === 'detail'
                        ? 'bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Detail Page
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmbedTarget('wordpress');
                      setHasCopiedEmbed(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                      embedTarget === 'wordpress'
                        ? 'bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    WordPress Plugin
                  </button>
                </div>

                {embedTarget === 'wordpress' ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                      <p className="font-semibold text-purple-900 dark:text-purple-300 mb-1">
                        Native WordPress Page Integration (No IFrames)
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Create a new page in WordPress, check <strong>&quot;Display Event Showcase on this page&quot;</strong> in the sidebar, and select <strong>{embedModalEvent.title}</strong> from the dropdown. Everything will be placed and styled automatically!
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Or use Shortcode in Elementor / Gutenberg / Classic Editor:
                      </label>
                      <div className="relative group">
                        <pre className="p-3 bg-neutral-100 dark:bg-neutral-950 rounded-xl text-xs text-neutral-800 dark:text-neutral-300 font-mono border border-neutral-200 dark:border-neutral-800">
                          {`[kd_event id="${embedModalEvent.id}"]`}
                        </pre>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`[kd_event id="${embedModalEvent.id}"]`);
                            setHasCopiedEmbed(true);
                            toast.success("Shortcode copied!");
                            setTimeout(() => setHasCopiedEmbed(false), 2000);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-600 dark:text-neutral-300 rounded-lg transition-opacity hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer"
                          title="Copy Shortcode"
                        >
                          {hasCopiedEmbed ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800">
                      <span className="text-xs text-neutral-500">
                        Plugin zip is ready to upload in WP Plugins &gt; Add New
                      </span>
                      <a
                        href="/kd-events.zip"
                        download="kd-events.zip"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Plugin (.zip)
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {embedTarget === 'register' ? (
                    <>
                      Copy the code below to embed the registration form for <strong>{embedModalEvent.title}</strong> directly into your WordPress site or any other webpage.
                    </>
                  ) : (
                    <>
                      Copy the code below to embed the full tournament details, rules, and prize structure for <strong>{embedModalEvent.title}</strong> directly into your WordPress site or any other webpage.
                    </>
                  )}
                </p>

                {(() => {
                  const embedSrc =
                    embedTarget === 'register'
                      ? `https://register.kompongdewa.win/?eventId=${embedModalEvent.id}&embed=true`
                      : `https://register.kompongdewa.win/event/${embedModalEvent.id}?embed=true`;
                  const embedHeight = embedTarget === 'register' ? '650' : '850';
                  const embedTitle =
                    embedTarget === 'register'
                      ? `${embedModalEvent.title} Registration`
                      : `${embedModalEvent.title} Details`;
                  const iframeCode = `<iframe \n  src="${embedSrc}" \n  width="100%" \n  height="${embedHeight}" \n  style="border:none; border-radius: 12px; overflow: hidden;" \n  title="${embedTitle}"\n></iframe>`;

                  return (
                    <div className="space-y-4">
                      <div className="relative group">
                        <pre className="p-4 bg-neutral-100 dark:bg-neutral-950 rounded-xl text-xs text-neutral-800 dark:text-neutral-300 font-mono whitespace-pre-wrap break-all border border-neutral-200 dark:border-neutral-800">
                          {iframeCode}
                        </pre>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(iframeCode);
                            setHasCopiedEmbed(true);
                            toast.success("Embed code copied to clipboard!");
                            setTimeout(() => setHasCopiedEmbed(false), 2000);
                          }}
                          className="absolute top-2 right-2 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-600 dark:text-neutral-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer"
                          title="Copy Code"
                        >
                          {hasCopiedEmbed ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                        <span className="flex items-center gap-1.5 font-medium text-neutral-600 dark:text-neutral-400">
                          Recommended height: <span className="font-mono text-purple-600 dark:text-purple-400">{embedHeight}px</span>
                        </span>
                        <a
                          href={embedSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline font-medium"
                        >
                          Preview embed URL <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })()}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* AI Polish Review Panel Modal */}
      <AnimatePresence>
        {aiReviewData && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiReviewData(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      AI Review & Spacing Analysis
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Language: {aiReviewData.lang.toUpperCase()} • Review detected issues before applying
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAiReviewData(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Summary Banner */}
              <div className="px-6 py-3 bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/20 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  {aiReviewData.summary}
                </p>
              </div>

              {/* Nav Tabs */}
              <div className="px-6 pt-3 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAiPreviewTab('changes')}
                  className={`pb-2 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                    aiPreviewTab === 'changes'
                      ? 'border-[#c3943a] text-[#c3943a]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Issues Found ({aiReviewData.changes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAiPreviewTab('preview')}
                  className={`pb-2 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                    aiPreviewTab === 'preview'
                      ? 'border-[#c3943a] text-[#c3943a]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  Polished HTML Preview
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {aiPreviewTab === 'changes' ? (
                  aiReviewData.changes.length > 0 ? (
                    <div className="space-y-3">
                      {aiReviewData.changes.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                              Issue #{idx + 1}
                            </span>
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-semibold">
                              {item.reason}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 block mb-0.5">Original (Wrong):</span>
                              <span className="line-through text-red-700 dark:text-red-300 font-mono break-all">{item.original}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 block mb-0.5">Fixed (Suggested):</span>
                              <span className="text-green-700 dark:text-green-300 font-bold font-mono break-all">{item.fixed}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      No explicit word changes were required; the formatting and markup were verified clean.
                    </div>
                  )
                ) : (
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-950 max-h-[350px] overflow-y-auto">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: aiReviewData.polished }}
                    />
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setAiReviewData(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Discard / Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyAIFixes}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#c3943a] hover:bg-[#b08534] rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Apply Fixes to Editor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event QR Code Generator Modal */}
      <EventQrModal
        event={qrModalEvent}
        isOpen={Boolean(qrModalEvent)}
        onClose={() => setQrModalEvent(null)}
      />

      {/* Tournament Flyer Sheets Media Library Picker */}
      <MediaLibraryModal
        isOpen={isPosterLibraryOpen}
        onClose={() => setIsPosterLibraryOpen(false)}
        multiple={true}
        onSelectMultiple={(urls) => {
          setCurrentPosterImages([...currentPosterImages, ...urls]);
          toast.success(`Attached ${urls.length} flyer sheet(s) from library!`);
          setIsPosterLibraryOpen(false);
        }}
        onSelect={(url) => {
          setCurrentPosterImages([...currentPosterImages, url]);
          toast.success('Attached flyer sheet from library!');
          setIsPosterLibraryOpen(false);
        }}
        title={`Choose Tournament Flyer Sheets (${activeLangTab.toUpperCase()})`}
        fileType="image"
      />
    </div>
  );
}
