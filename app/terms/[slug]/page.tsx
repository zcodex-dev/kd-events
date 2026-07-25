import { getWebPageBySlug } from '@/lib/uploads/metadata';
import { notFound } from 'next/navigation';
import { TermsClient } from './client';
import { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const page = await getWebPageBySlug(slug);
  
  if (!page) {
    return { title: 'Not Found' };
  }

  return {
    title: `${page.title} | Kompong Dewa`,
    description: `Custom page for ${page.title}`,
    openGraph: {
      title: page.title,
      images: page.bgImageUrl ? [page.bgImageUrl] : [],
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { slug } = await params;
  const page = await getWebPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return <TermsClient page={page} />;
}
