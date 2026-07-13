'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, AlertTriangle, RefreshCw, Trash2, Plus, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { UploadedFile, AdditionalImage } from '@/types';
import { formatFileSize, resolveUrl } from '@/lib/uploads/file-utils';
import { MAX_FILE_SIZE } from '@/lib/validation/schemas';
import { LoadingSpinner } from '@/components/shared/loading';

type ReplaceDialogProps = {
  file: UploadedFile | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function ReplaceDialog({ file, onClose, onSuccess }: ReplaceDialogProps) {
  // Main Image replacement state
  const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [mainDimensions, setMainDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isReplacingMain, setIsReplacingMain] = useState(false);

  // Additional Images states
  const [selectedAddFile, setSelectedAddFile] = useState<File | null>(null);
  const [addPreview, setAddPreview] = useState<string | null>(null);
  const [addDimensions, setAddDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);

  // Reorder states
  const [orderedImages, setOrderedImages] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [allowedMimeTypes, setAllowedMimeTypes] = useState<string[]>([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch allowed MIME types configuration
  useEffect(() => {
    if (!file) return;

    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.allowedTypes) {
          setAllowedMimeTypes(data.data.allowedTypes);
        }
      })
      .catch(() => {});
  }, [file]);

  // Sync state helper
  const syncFileState = (f: UploadedFile) => {
    const flatList = [
      {
        id: 'main',
        originalName: f.originalName,
        storedName: f.storedName,
        githubPath: f.githubPath,
        imageUrl: f.imageUrl,
        mimeType: f.mimeType,
        size: f.size,
        width: f.width,
        height: f.height,
        uploadedAt: f.uploadedAt,
      },
      ...(f.additionalImages || []),
    ];
    setOrderedImages(flatList);
    setIsDirty(false);
  };

  // Sync state when file changes
  useEffect(() => {
    if (file) {
      syncFileState(file);
    }
  }, [file]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedImages.length) return;

    const newImages = [...orderedImages];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setOrderedImages(newImages);
    setIsDirty(true);
  };

  const handleSaveOrder = async () => {
    if (!file) return;

    setIsSavingOrder(true);
    try {
      const orderedIds = orderedImages.map((img) => img.id);
      const res = await fetch(`/api/files/${file.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Gallery order updated successfully');
        onSuccess();
        if (data.data) {
          Object.assign(file, data.data);
          syncFileState(data.data);
        }
      } else {
        toast.error(data.error || 'Failed to update order');
      }
    } catch {
      toast.error('Network error during reordering');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleMainFileSelect = (newFile: File) => {
    if (!allowedMimeTypes.includes(newFile.type)) {
      const allowedNames = allowedMimeTypes.map((t) => t.split('/')[1]?.toUpperCase() || t).join(', ');
      toast.error(`Unsupported format. Allowed formats: ${allowedNames}`);
      return;
    }
    if (newFile.size > MAX_FILE_SIZE) {
      toast.error(`File is too large. Limit is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }
    setSelectedMainFile(newFile);
    const objectUrl = URL.createObjectURL(newFile);
    setMainPreview(objectUrl);
    const img = new Image();
    img.onload = () => setMainDimensions({ width: img.width, height: img.height });
    img.src = objectUrl;
  };

  const handleAddFileSelect = (newFile: File) => {
    if (!allowedMimeTypes.includes(newFile.type)) {
      const allowedNames = allowedMimeTypes.map((t) => t.split('/')[1]?.toUpperCase() || t).join(', ');
      toast.error(`Unsupported format. Allowed formats: ${allowedNames}`);
      return;
    }
    if (newFile.size > MAX_FILE_SIZE) {
      toast.error(`File is too large. Limit is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }
    setSelectedAddFile(newFile);
    const objectUrl = URL.createObjectURL(newFile);
    setAddPreview(objectUrl);
    const img = new Image();
    img.onload = () => setAddDimensions({ width: img.width, height: img.height });
    img.src = objectUrl;
  };

  const handleClose = () => {
    setSelectedMainFile(null);
    setMainPreview(null);
    setMainDimensions(null);
    setSelectedAddFile(null);
    setAddPreview(null);
    setAddDimensions(null);
    setIsReplacingMain(false);
    setIsAddingImage(false);
    setDeleteImageId(null);
    onClose();
  };

  const handleReplaceMain = async () => {
    if (!file || !selectedMainFile) return;

    setIsReplacingMain(true);
    const formData = new FormData();
    formData.append('file', selectedMainFile);
    if (mainDimensions) {
      formData.append('width', mainDimensions.width.toString());
      formData.append('height', mainDimensions.height.toString());
    }

    try {
      const res = await fetch(`/api/files/${file.id}/replace`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Main image replaced successfully');
        onSuccess();
        if (data.data) {
          Object.assign(file, data.data);
          syncFileState(data.data);
        }
        // Update local state preview
        setSelectedMainFile(null);
        setMainPreview(null);
        setMainDimensions(null);
      } else {
        toast.error(data.error || 'Failed to replace main image');
      }
    } catch {
      toast.error('Network error during replacement');
    } finally {
      setIsReplacingMain(false);
    }
  };

  const handleAddImage = async () => {
    if (!file || !selectedAddFile) return;

    setIsAddingImage(true);
    const formData = new FormData();
    formData.append('file', selectedAddFile);
    if (addDimensions) {
      formData.append('width', addDimensions.width.toString());
      formData.append('height', addDimensions.height.toString());
    }

    try {
      const res = await fetch(`/api/files/${file.id}/images`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Additional image added successfully');
        onSuccess();
        // Clear local inputs
        setSelectedAddFile(null);
        setAddPreview(null);
        setAddDimensions(null);
        if (data.data) {
          Object.assign(file, data.data);
          syncFileState(data.data);
        }
      } else {
        toast.error(data.error || 'Failed to add image');
      }
    } catch {
      toast.error('Network error during upload');
    } finally {
      setIsAddingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!file) return;

    setDeleteImageId(imageId);
    try {
      const res = await fetch(`/api/files/${file.id}/images?imageId=${imageId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Image removed from page');
        onSuccess();
        if (data.data) {
          Object.assign(file, data.data);
          syncFileState(data.data);
        }
      } else {
        toast.error(data.error || 'Failed to delete image');
      }
    } catch {
      toast.error('Network error during delete');
    } finally {
      setDeleteImageId(null);
    }
  };

  return (
    <AnimatePresence>
      {file && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white border border-neutral-200 w-full max-w-2xl p-6 rounded-xl shadow-xl z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <button
              onClick={handleClose}
              disabled={isReplacingMain || isAddingImage}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 rounded-lg p-1 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-neutral-900 mb-1.5 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-neutral-600" />
              Manage Page Gallery / Images
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Add multiple stacked images to your page, or replace the main image. The URL and QR code will never change.
            </p>

            {/* Warning Alert */}
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold">Notice:</span> Existing printed layouts and QR codes will automatically render all stacked images on this page immediately once updated.
              </div>
            </div>

            {/* Content Split */}
            <div className="space-y-6 divide-y divide-neutral-100">
              
              {/* SECTION 1: Main Image Replacement */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Primary Main Image
                </h4>

                {!mainPreview ? (
                  <div className="flex items-center gap-4 p-3 border border-neutral-200 rounded-lg bg-neutral-50/50">
                    <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 rounded-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveUrl(file.imageUrl)}
                        alt="Current Main Artwork"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                        Current Image
                      </p>
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {formatFileSize(file.size)}
                        {file.width && file.height && ` · ${file.width} × ${file.height} px`}
                      </p>
                    </div>
                    <button
                      onClick={() => mainFileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      Replace
                    </button>
                    <input
                      type="file"
                      ref={mainFileInputRef}
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleMainFileSelect(e.target.files[0])}
                      accept={allowedMimeTypes.join(',')}
                    />
                  </div>
                ) : (
                  <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-white border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 rounded-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mainPreview}
                          alt="Main replacement preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          Ready to Replace
                        </p>
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          {selectedMainFile?.name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {selectedMainFile && formatFileSize(selectedMainFile.size)}
                          {mainDimensions && ` · ${mainDimensions.width} × ${mainDimensions.height} px`}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedMainFile(null);
                            setMainPreview(null);
                            setMainDimensions(null);
                          }}
                          disabled={isReplacingMain}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleReplaceMain}
                          disabled={isReplacingMain}
                          className="px-3 py-1.5 text-xs text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isReplacingMain ? (
                            <LoadingSpinner size={12} />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Stacked Gallery Images & Reordering */}
              <div className="space-y-4 pt-5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Image Order & Stack Sequence
                  </h4>
                  {isDirty && (
                    <button
                      onClick={handleSaveOrder}
                      disabled={isSavingOrder}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors rounded-md cursor-pointer flex items-center gap-1"
                    >
                      {isSavingOrder ? <LoadingSpinner size={10} /> : <Check className="w-3 h-3" />}
                      Save Order
                    </button>
                  )}
                </div>

                {/* Combined list of all images */}
                {orderedImages.length > 0 ? (
                  <div className="space-y-2">
                    {orderedImages.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`flex items-center gap-3 p-2.5 border rounded-lg transition-colors bg-white shadow-xs ${
                          idx === 0 ? 'border-neutral-300 ring-1 ring-neutral-300' : 'border-neutral-200'
                        }`}
                      >
                        <div className="w-12 h-12 bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden shrink-0 rounded-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveUrl(img.imageUrl)}
                            alt={img.originalName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-neutral-900 truncate max-w-[65%]">
                              {img.originalName}
                            </p>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                                idx === 0
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                              }`}
                            >
                              {idx === 0 ? 'Primary' : `Artwork #${idx + 1}`}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            {formatFileSize(img.size)}
                          </p>
                        </div>
                        
                        {/* Reorder Arrows */}
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => moveItem(idx, 'up')}
                            disabled={idx === 0 || isSavingOrder}
                            className="p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveItem(idx, 'down')}
                            disabled={idx === orderedImages.length - 1 || isSavingOrder}
                            className="p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Delete Button (Only for secondary gallery items) */}
                        {idx !== 0 && (
                          <button
                            onClick={() => handleDeleteImage(img.id)}
                            disabled={deleteImageId === img.id || isSavingOrder || isDirty}
                            className={`p-1.5 rounded-lg transition-colors shrink-0 border border-transparent ${isDirty ? 'text-neutral-300' : 'text-red-500 hover:bg-red-50 cursor-pointer'}`}
                            title={isDirty ? "Save order before deleting" : "Delete additional image"}
                          >
                            {deleteImageId === img.id ? (
                              <LoadingSpinner size={14} />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">
                    No images on this page yet.
                  </p>
                )}

                {/* Add Image Section */}
                {!addPreview ? (
                  <div
                    onClick={() => addFileInputRef.current?.click()}
                    className="border border-dashed border-neutral-200 hover:border-neutral-300 rounded-lg p-4 flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-neutral-50/50"
                  >
                    <input
                      type="file"
                      ref={addFileInputRef}
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleAddFileSelect(e.target.files[0])}
                      accept={allowedMimeTypes.join(',')}
                    />
                    <Plus className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-600">
                      Add additional image to page
                    </span>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-neutral-300 rounded-lg bg-blue-50/10">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-white border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 rounded-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={addPreview}
                          alt="Addition preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                          Ready to Attach
                        </p>
                        <p className="text-xs font-semibold text-neutral-850 truncate">
                          {selectedAddFile?.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {selectedAddFile && formatFileSize(selectedAddFile.size)}
                          {addDimensions && ` · ${addDimensions.width} × ${addDimensions.height} px`}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAddFile(null);
                            setAddPreview(null);
                            setAddDimensions(null);
                          }}
                          disabled={isAddingImage}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleAddImage}
                          disabled={isAddingImage}
                          className="px-3 py-1.5 text-xs text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isAddingImage ? (
                            <LoadingSpinner size={12} />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          Add Image
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isReplacingMain || isAddingImage}
                className="px-4 py-2 text-sm text-neutral-700 border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Close Manager
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
