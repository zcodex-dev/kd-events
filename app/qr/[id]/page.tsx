import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function PublicQRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch QR
  const qr = await prisma.dynamicQR.findUnique({
    where: { id },
  });

  if (!qr || !qr.isActive) {
    return notFound();
  }

  // 2. Increment scan count (fire and forget for performance)
  prisma.dynamicQR.update({
    where: { id },
    data: { scanCount: { increment: 1 } },
  }).catch(console.error);

  // 3. Handle URL Redirect
  if (qr.type === 'URL' && qr.destinationUrl) {
    redirect(qr.destinationUrl);
  }

  // 4. Handle Content Display
  if (qr.type === 'CONTENT') {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
          <div className="prose prose-neutral dark:prose-invert prose-lg max-w-none prose-headings:font-black prose-a:text-[#c3943a]">
            {qr.content ? (
              <div dangerouslySetInnerHTML={{ __html: qr.content }} />
            ) : (
              <p>No content available.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return notFound();
}
