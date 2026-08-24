'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Image as ImageIcon, Loader2, Images } from 'lucide-react';
import type { WebPage } from '@/types';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { MediaLibraryModal } from '@/components/dashboard/media-library-modal';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

import { directUploadSingleFile } from '@/lib/uploads/client-upload';

type PageFormProps = {
  initialData?: WebPage;
  isEdit?: boolean;
};

export function PageForm({ initialData, isEdit }: PageFormProps) {
  const router = useRouter();
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [htmlContent, setHtmlContent] = useState(initialData?.htmlContent || '');
  const [textColor, setTextColor] = useState(initialData?.textColor || '#ffffff');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#000000');
  const [bgImageUrl, setBgImageUrl] = useState(initialData?.bgImageUrl || '');
  const [featureIconUrl, setFeatureIconUrl] = useState(initialData?.featureIconUrl || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [mediaLibraryTarget, setMediaLibraryTarget] = useState<'bg' | 'icon' | null>(null);

  const handleUpload = async (file: File, type: 'bg' | 'icon') => {
    if (type === 'bg') setIsUploadingBg(true);
    else setIsUploadingIcon(true);

    try {
      const data = await directUploadSingleFile(file);
      if (data && data.imageUrl) {
        if (type === 'bg') setBgImageUrl(data.imageUrl);
        else setFeatureIconUrl(data.imageUrl);
        toast.success(`${type === 'bg' ? 'Background' : 'Icon'} uploaded successfully`);
      } else {
        toast.error('Upload failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      if (type === 'bg') setIsUploadingBg(false);
      else setIsUploadingIcon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !htmlContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/pages/${initialData?.id}` : '/api/pages';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          htmlContent,
          textColor,
          bgColor,
          bgImageUrl,
          featureIconUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? 'Page updated successfully' : 'Page created successfully');
        router.push('/dashboard/pages');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to save page');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-5 font-sans">
        
        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Page Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Terms and Conditions"
            className="w-full px-3 py-2 text-sm border border-neutral-200 bg-white text-neutral-900 rounded-lg focus:outline-none focus:border-neutral-900 transition-colors"
          />
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-10 h-10 p-1 border border-neutral-200 rounded-lg cursor-pointer bg-white"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-10 p-1 border border-neutral-200 rounded-lg cursor-pointer bg-white"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* Image Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Feature Icon (Optional)
            </label>
            <div className="flex items-center gap-4">
              {featureIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featureIconUrl} alt="" className="w-12 h-12 rounded object-contain bg-neutral-100" />
              ) : (
                <div className="w-12 h-12 rounded bg-neutral-100 flex items-center justify-center border border-neutral-200 text-neutral-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  id="icon-upload"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'icon')}
                />
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor="icon-upload"
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    {isUploadingIcon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setMediaLibraryTarget('icon')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-[#c3943a] bg-[#c3943a]/10 hover:bg-[#c3943a]/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Images className="w-3.5 h-3.5" />
                    Library
                  </button>
                </div>
                {featureIconUrl && (
                  <button type="button" onClick={() => setFeatureIconUrl('')} className="text-[10px] text-red-500 hover:underline mt-1 block">Remove</button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Background Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              {bgImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgImageUrl} alt="" className="w-20 h-12 rounded object-cover border border-neutral-200" />
              ) : (
                <div className="w-20 h-12 rounded bg-neutral-100 flex items-center justify-center border border-neutral-200 text-neutral-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  id="bg-upload"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'bg')}
                />
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor="bg-upload"
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    {isUploadingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setMediaLibraryTarget('bg')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-[#c3943a] bg-[#c3943a]/10 hover:bg-[#c3943a]/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Images className="w-3.5 h-3.5" />
                    Library
                  </button>
                </div>
                {bgImageUrl && (
                  <button type="button" onClick={() => setBgImageUrl('')} className="text-[10px] text-red-500 hover:underline mt-1 block">Remove</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Media Library Modal */}
        <MediaLibraryModal
          isOpen={mediaLibraryTarget !== null}
          onClose={() => setMediaLibraryTarget(null)}
          onSelect={(url) => {
            if (mediaLibraryTarget === 'bg') setBgImageUrl(url);
            else if (mediaLibraryTarget === 'icon') setFeatureIconUrl(url);
            setMediaLibraryTarget(null);
          }}
          title={mediaLibraryTarget === 'bg' ? 'Choose Background Image' : 'Choose Feature Icon'}
          fileType="image"
        />
      </div>

      {/* Editor */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
           <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Page Content
          </label>
        </div>
        <div className="h-[400px]">
          <ReactQuill 
            theme="snow" 
            value={htmlContent} 
            onChange={setHtmlContent}
            modules={modules}
            className="h-full pb-10"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Save Changes' : 'Create Page'}
        </button>
      </div>
    </form>
  );
}
