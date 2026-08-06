import { getTvScreenBySlug } from '@/lib/uploads/metadata';
import { notFound } from 'next/navigation';
import { TvDisplayClient } from './client';
import { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const screen = await getTvScreenBySlug(slug);

  if (!screen) {
    return { title: 'TV Display Not Found' };
  }

  return {
    title: `${screen.title} | Live TV Video Display`,
    description: screen.overlayText?.headline || screen.title,
    openGraph: {
      title: screen.title,
      images: screen.mediaUrl ? [screen.mediaUrl] : [],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function TvScreenPage({ params }: Props) {
  const { slug } = await params;
  const screen = await getTvScreenBySlug(slug);

  if (!screen || !screen.enabled) {
    notFound();
  }

  return <TvDisplayClient initialScreen={screen} />;
}
