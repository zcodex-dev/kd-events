import Link from 'next/link';
import { ImageIcon, ArrowLeft } from 'lucide-react';

export default function ViewNotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-14">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-blue-600" strokeWidth={2} />
            <span className="font-semibold text-neutral-900 text-sm tracking-tight">
              FileUpload
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-6xl font-semibold text-neutral-200 mb-4">404</p>
          <h1 className="text-lg font-semibold text-neutral-900 mb-2">
            File not found
          </h1>
          <p className="text-sm text-neutral-500 mb-6 max-w-sm">
            The file you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Link>
        </div>
      </main>
    </div>
  );
}
