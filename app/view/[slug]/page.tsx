import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getFileBySlug } from '@/lib/uploads/metadata';
import { ViewPageClient } from './client';

type PageProps = {
  params: Promise<{ slug: string }>;
};

// ── Dynamic OG Metadata ────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const file = await getFileBySlug(slug);

  if (!file) {
    return {
      title: 'File Not Found — FileUpload',
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `${file.originalName} — FileUpload`,
    description: `View and download ${file.originalName}`,
    openGraph: {
      title: file.originalName,
      description: `View and download ${file.originalName}`,
      images: [
        {
          url: file.imageUrl,
          width: file.width,
          height: file.height,
          alt: file.originalName,
        },
      ],
      type: 'website',
      url: `${appUrl}/view/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: file.originalName,
      description: `View and download ${file.originalName}`,
      images: [file.imageUrl],
    },
  };
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function ViewPage({ params }: PageProps) {
  const { slug } = await params;
  const file = await getFileBySlug(slug);

  if (!file) {
    notFound();
  }

  return <ViewPageClient file={file} />;
}
