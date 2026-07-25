import { getWebPageById } from '@/lib/uploads/metadata';
import { notFound } from 'next/navigation';
import { EditPageClient } from './client';

export default async function EditWebPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const pageData = await getWebPageById(id);

  if (!pageData) {
    notFound();
  }

  return <EditPageClient initialData={pageData} />;
}
