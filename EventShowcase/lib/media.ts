export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    // Relative API routes point to the live server CDN / backend
    return `https://kompongdewa.win${trimmed}`;
  }
  return trimmed;
}

export function isVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const decoded = decodeURIComponent(url).toLowerCase();
    // 1. Direct file path extension (e.g. /uploads/video.mp4)
    const pathname = decoded.split('?')[0];
    if (/\.(mp4|webm|mov|m4v|ogg|ogv|quicktime)$/i.test(pathname)) {
      return true;
    }
    // 2. Query parameter key (e.g. /api/raw?key=public-uploads/.../video.mp4)
    if (decoded.includes('?')) {
      const search = decoded.split('?')[1];
      if (
        /\.(mp4|webm|mov|m4v|ogg|ogv|quicktime)(\&|$|\?)/i.test(search) ||
        search.includes('.mp4') ||
        search.includes('.webm') ||
        search.includes('.mov') ||
        search.includes('.m4v')
      ) {
        return true;
      }
    }
  } catch {
    const lower = url.toLowerCase();
    return (
      lower.includes('.mp4') ||
      lower.includes('.webm') ||
      lower.includes('.mov') ||
      lower.includes('.m4v')
    );
  }
  return false;
}
