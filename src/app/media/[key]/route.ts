import { getMediaFile } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(key))
    return new Response('Not found', { status: 404 });
  try {
    const object = await getMediaFile(key, request.headers.get('if-none-match'));
    if (!object) return new Response('Not found', { status: 404 });
    if (object.statusCode === 304)
      return new Response(null, {
        status: 304,
        headers: { ETag: object.etag, 'Cache-Control': 'public, max-age=31536000, immutable' },
      });
    return new Response(object.stream, {
      headers: {
        'Content-Type': object.type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        ETag: object.etag,
      },
    });
  } catch {
    return new Response('Image unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
