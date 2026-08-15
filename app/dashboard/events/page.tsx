'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, Image as ImageIcon, Loader2, Search, Calendar, MapPin, Tag, Users, Eye } from 'lucide-react';
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
  images: string[];
  imageUrl: string | null;
  tag: string | null;
  date: string | null;
  location: string | null;
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

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [orderIndex, setOrderIndex] = useState(0);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(emptySlots());
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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
    setTitle('');
    setDescription('');
    setTag('');
    setDate('');
    setLocation('');
    setStatus('ACTIVE');
    setOrderIndex(0);
    setImageSlots(emptySlots());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setTag(event.tag || '');
    setDate(event.date || '');
    setLocation(event.location || '');
    setStatus(event.status);
    setOrderIndex(event.orderIndex || 0);
    setImageSlots(slotsFromImages(imagesOf(event)));
    setIsModalOpen(true);
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
      // Quill leaves "<p><br></p>" behind when the user clears it — store empty instead.
      formData.append('description', stripHtml(description) ? description : '');
      formData.append('tag', tag);
      formData.append('date', date);
      formData.append('location', location);
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
                    <select
                      value={event.status}
                      onChange={(e) => updateStatus(event.id, e.target.value)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-sm border transition-colors outline-none cursor-pointer appearance-none text-center ${event.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : event.status === 'UPCOMING' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'}`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
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
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Poker Tournament 2026"
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Description
                      </label>
                      <div className="event-description-editor bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg overflow-hidden">
                        <RichTextEditor
                          value={description}
                          onChange={setDescription}
                          placeholder="Detailed information about the event..."
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
                        Date & Time
                      </label>
                      <input
                        type="text"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        placeholder="e.g. Oct 12, 2026 - 8 PM"
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. VIP Room 1, Kompong Dewa"
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
                        Event Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      >
                        <option value="ACTIVE">Active (Live)</option>
                        <option value="UPCOMING">Upcoming (Coming Soon)</option>
                        <option value="HIDDEN">Hidden</option>
                      </select>
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
    </div>
  );
}
