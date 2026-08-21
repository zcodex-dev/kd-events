'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Edit2, Trash2, QrCode, Download, ExternalLink, Link as LinkIcon, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import RichTextEditor from '@/components/shared/rich-text-editor';
import { MediaLibraryPicker } from '@/components/shared/media-library-picker';
import Link from 'next/link';

type DynamicQR = {
  id: string;
  name: string;
  type: string;
  destinationUrl: string | null;
  content: string | null;
  fgColor: string;
  bgColor: string;
  logoUrl: string | null;
  scanCount: number;
  isActive: boolean;
  createdAt: string;
};

export default function QrMakerDashboard() {
  const [qrs, setQrs] = useState<DynamicQR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<DynamicQR | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('URL');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [content, setContent] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('');

  // View Modal State
  const [viewQr, setViewQr] = useState<DynamicQR | null>(null);
  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchQrs();
  }, []);

  const fetchQrs = async () => {
    try {
      const res = await fetch('/api/admin/qrs');
      const data = await res.json();
      if (data.success) {
        setQrs(data.data);
      }
    } catch (error) {
      toast.error('Failed to load QR codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (qr?: DynamicQR) => {
    if (qr) {
      setEditingQr(qr);
      setName(qr.name);
      setType(qr.type);
      setDestinationUrl(qr.destinationUrl || '');
      setContent(qr.content || '');
      setFgColor(qr.fgColor);
      setBgColor(qr.bgColor);
      setLogoUrl(qr.logoUrl || '');
    } else {
      setEditingQr(null);
      setName('');
      setType('URL');
      setDestinationUrl('');
      setContent('');
      setFgColor('#000000');
      setBgColor('#ffffff');
      setLogoUrl('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    if (type === 'URL' && !destinationUrl.trim()) return toast.error('Destination URL is required');
    if (type === 'CONTENT' && !content.trim()) return toast.error('Content is required');

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        type,
        destinationUrl: type === 'URL' ? destinationUrl : null,
        content: type === 'CONTENT' ? content : null,
        fgColor,
        bgColor,
        logoUrl: logoUrl.trim() || null,
      };

      const res = await fetch(
        editingQr ? `/api/admin/qrs/${editingQr.id}` : '/api/admin/qrs',
        {
          method: editingQr ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success(editingQr ? 'QR updated' : 'QR created');
        fetchQrs();
        setIsModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to save QR');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code? It will break existing printed codes.')) return;
    try {
      const res = await fetch(`/api/admin/qrs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('QR Code deleted');
        fetchQrs();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Create high-res canvas
      const padding = 20;
      canvas.width = img.width + (padding * 2);
      canvas.height = img.height + (padding * 2);
      
      if (ctx) {
        // Fill background
        ctx.fillStyle = viewQr?.bgColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw QR
        ctx.drawImage(img, padding, padding);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${viewQr?.name || 'qr-code'}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getFullUrl = (id: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/qr/${id}`;
  };

  return (
    <div className="p-6 md:p-8 w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">QR Maker</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage dynamic QR codes and their destinations.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create QR
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                <th className="p-4">Name</th>
                <th className="p-4">Type / Destination</th>
                <th className="p-4 text-center">Scans</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : qrs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">
                    No QR codes found. Create your first one!
                  </td>
                </tr>
              ) : (
                qrs.map((qr) => (
                  <tr key={qr.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 font-medium text-neutral-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center shrink-0">
                          <QrCode className="w-5 h-5 text-neutral-500" />
                        </div>
                        {qr.name}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {qr.type === 'URL' ? (
                          <LinkIcon className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <div className="text-sm">
                          <div className="font-medium text-neutral-700 dark:text-neutral-300">
                            {qr.type === 'URL' ? 'URL Redirect' : 'Rich Content'}
                          </div>
                          {qr.type === 'URL' && (
                            <a href={qr.destinationUrl || '#'} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[200px] inline-block">
                              {qr.destinationUrl}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-sm">
                        {qr.scanCount}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewQr(qr)}
                          className="p-2 text-neutral-500 hover:text-green-600 bg-neutral-100 hover:bg-green-50 dark:bg-neutral-800 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="View & Download QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <a
                          href={`/qr/${qr.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-neutral-500 hover:text-blue-600 bg-neutral-100 hover:bg-blue-50 dark:bg-neutral-800 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Test Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleOpenModal(qr)}
                          className="p-2 text-neutral-500 hover:text-amber-600 bg-neutral-100 hover:bg-amber-50 dark:bg-neutral-800 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(qr.id)}
                          className="p-2 text-neutral-500 hover:text-red-600 bg-neutral-100 hover:bg-red-50 dark:bg-neutral-800 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {editingQr ? 'Edit QR Code' : 'Create New QR'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="qr-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Internal Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Lobby Standee Summer 2026"
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        QR Action Type
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                      >
                        <option value="URL">URL Redirect</option>
                        <option value="CONTENT">Custom Content Page</option>
                      </select>
                    </div>
                  </div>

                  {type === 'URL' ? (
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Destination URL
                      </label>
                      <input
                        type="url"
                        value={destinationUrl}
                        onChange={(e) => setDestinationUrl(e.target.value)}
                        placeholder="https://example.com/promo"
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                        required={type === 'URL'}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Rich Content
                      </label>
                      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                        <RichTextEditor
                          value={content}
                          onChange={setContent}
                          placeholder="Type content that will appear when users scan the QR code..."
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
                    <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Appearance Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                          Foreground Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer p-0 border-0"
                          />
                          <input
                            type="text"
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg outline-none font-mono text-sm dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                          Background Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer p-0 border-0"
                          />
                          <input
                            type="text"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg outline-none font-mono text-sm dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                          Center Logo Image URL (Optional)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://.../logo.png"
                            className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg outline-none dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => setIsMediaLibraryOpen(true)}
                            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700 whitespace-nowrap"
                          >
                            Browse Library
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </form>
              </div>
              
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="qr-form"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingQr ? 'Save Changes' : 'Create QR'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View QR Modal */}
      <AnimatePresence>
        {viewQr && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewQr(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center"
            >
              <button
                onClick={() => setViewQr(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-neutral-900 mb-6">{viewQr.name}</h3>
              
              <div className="p-4 rounded-xl border border-neutral-200 mb-6 bg-white shadow-sm">
                <QRCodeSVG
                  value={getFullUrl(viewQr.id)}
                  size={256}
                  fgColor={viewQr.fgColor}
                  bgColor={viewQr.bgColor}
                  level="Q"
                  includeMargin={false}
                  ref={qrRef}
                  imageSettings={viewQr.logoUrl ? {
                    src: viewQr.logoUrl,
                    x: undefined,
                    y: undefined,
                    height: 48,
                    width: 48,
                    excavate: true,
                  } : undefined}
                />
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDownloadQr}
                  className="flex-1 inline-flex justify-center items-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
                <a
                  href={getFullUrl(viewQr.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-none p-2.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
                  title="Open Link"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <MediaLibraryPicker
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={(url) => setLogoUrl(url)}
      />
    </div>
  );
}
