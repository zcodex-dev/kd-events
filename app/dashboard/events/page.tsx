'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, Image as ImageIcon, Loader2, Search, Calendar, MapPin, Tag, Users, Eye, Code, Copy, Check, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import {
  EventImageSlots,
  emptySlots,
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

type Event = {
  id: string;
  title: string;
  description: string | null;
  titleZh: string | null;
  descriptionZh: string | null;
  titleId: string | null;
  descriptionId: string | null;
  images: string[];
  imageUrl: string | null;
  tag: string | null;
  date: string | null;
  dateZh?: string | null;
  dateId?: string | null;
  location: string | null;
  locationZh?: string | null;
  locationId?: string | null;
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
  const [hasCopiedEmbed, setHasCopiedEmbed] = useState(false);

  // Form State
  const [activeLangTab, setActiveLangTab] = useState<'en' | 'id' | 'zh'>('en');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleZh, setTitleZh] = useState('');
  const [descriptionZh, setDescriptionZh] = useState('');
  const [titleId, setTitleId] = useState('');
  const [descriptionId, setDescriptionId] = useState('');
  const [tag, setTag] = useState('');
  const [date, setDate] = useState('');
  const [dateZh, setDateZh] = useState('');
  const [dateId, setDateId] = useState('');
  const [location, setLocation] = useState('');
  const [locationZh, setLocationZh] = useState('');
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [orderIndex, setOrderIndex] = useState(0);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(emptySlots());
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
    setTitle('');
    setDescription('');
    setTitleZh('');
    setDescriptionZh('');
    setTitleId('');
    setDescriptionId('');
    setTag('');
    setDate('');
    setDateZh('');
    setDateId('');
    setLocation('');
    setLocationZh('');
    setLocationId('');
    setStatus('ACTIVE');
    setOrderIndex(0);
    setImageSlots(emptySlots());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: Event) => {
    setEditingEvent(event);
    setActiveLangTab('en');
    setTitle(event.title);
    setDescription(event.description || '');
    setTitleZh(event.titleZh || '');
    setDescriptionZh(event.descriptionZh || '');
    setTitleId(event.titleId || '');
    setDescriptionId(event.descriptionId || '');
    setTag(event.tag || '');
    setDate(event.date || '');
    setDateZh(event.dateZh || '');
    setDateId(event.dateId || '');
    setLocation(event.location || '');
    setLocationZh(event.locationZh || '');
    setLocationId(event.locationId || '');
    setStatus(event.status);
    setOrderIndex(event.orderIndex || 0);
    setImageSlots(slotsFromImages(imagesOf(event)));
    setIsModalOpen(true);
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

    const badUrlSlot = imageSlots.findIndex(
      (slot) => !slot.file && slot.url.trim() && !isHttpUrl(slot.url)
    );
    if (badUrlSlot !== -1) {
      return toast.error(`Image URL ${badUrlSlot + 1} must start with http:// or https://`);
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', stripHtml(description) ? description : '');
      formData.append('titleZh', titleZh);
      formData.append('descriptionZh', stripHtml(descriptionZh) ? descriptionZh : '');
      formData.append('titleId', titleId);
      formData.append('descriptionId', stripHtml(descriptionId) ? descriptionId : '');
      formData.append('tag', tag);
      formData.append('date', date);
      formData.append('dateZh', dateZh);
      formData.append('dateId', dateId);
      formData.append('location', location);
      formData.append('locationZh', locationZh);
      formData.append('locationId', locationId);
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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">All Events</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Manage your upcoming events for the registration page.
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
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
            {events.map(event => (
              <div key={event.id} className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <div className="relative h-48 bg-neutral-200 dark:bg-neutral-800">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">{imagesOf(event).length ? 'Image unavailable' : 'No image'}</span>
                  </div>
                  {imagesOf(event)[0] && (
                    <img
                      src={imagesOf(event)[0]}
                      alt=""
                      className="relative w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                    />
                  )}
                  {imagesOf(event).length > 1 && (
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/70 text-white backdrop-blur-sm">
                      {imagesOf(event).length} images
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
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-700">
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
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800/50">
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
            ))}
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

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Description ({activeLangTab.toUpperCase()})
                        </label>
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
                      </div>
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

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Date & Time ({activeLangTab.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={activeLangTab === 'en' ? date : activeLangTab === 'id' ? dateId : dateZh}
                        onChange={(e) => {
                          if (activeLangTab === 'en') setDate(e.target.value);
                          if (activeLangTab === 'id') setDateId(e.target.value);
                          if (activeLangTab === 'zh') setDateZh(e.target.value);
                        }}
                        placeholder={
                          activeLangTab === 'en'
                            ? "e.g. 27-29 August 2026 · Game Starts at 5:00 PM"
                            : activeLangTab === 'id'
                            ? "e.g. 27-29 Agustus 2026 · Permainan Mulai Pukul 17:00 WIB"
                            : "e.g. 2026年8月27日至29日 · 下午5:00开始"
                        }
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      />
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
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Cover Images
                      </label>
                      <EventImageSlots slots={imageSlots} onChange={setImageSlots} />
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
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Copy the code below to embed the registration form for <strong>{embedModalEvent.title}</strong> directly into your WordPress site or any other webpage.
                </p>
                
                <div className="relative group">
                  <pre className="p-4 bg-neutral-100 dark:bg-neutral-950 rounded-xl text-xs text-neutral-800 dark:text-neutral-300 font-mono whitespace-pre-wrap break-all border border-neutral-200 dark:border-neutral-800">
{`<iframe 
  src="https://register.kompongdewa.win/?eventId=${embedModalEvent.id}&embed=true" 
  width="100%" 
  height="600" 
  style="border:none; border-radius: 12px; overflow: hidden;" 
  title="${embedModalEvent.title} Registration"
></iframe>`}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe src="https://register.kompongdewa.win/?eventId=${embedModalEvent.id}&embed=true" width="100%" height="600" style="border:none; border-radius: 12px; overflow: hidden;" title="${embedModalEvent.title} Registration"></iframe>`);
                      setHasCopiedEmbed(true);
                      toast.success("Embed code copied to clipboard!");
                      setTimeout(() => setHasCopiedEmbed(false), 2000);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-600 dark:text-neutral-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    title="Copy Code"
                  >
                    {hasCopiedEmbed ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
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
    </div>
  );
}
