import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-semibold text-neutral-200 mb-4">404</p>
        <h1 className="text-lg font-semibold text-neutral-900 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-neutral-500 mb-6 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go home
        </Link>
      </div>
    </div>
  );
}
