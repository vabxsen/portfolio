import { bucket } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(key))
    return new Response('Not found', { status: 404 });
  try {
    const object = await bucket().get(key);
    if (!object) return new Response('Not found', { status: 404 });
    return new Response(object.body as ReadableStream, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        ETag: object.httpEtag,
      },
    });
  } catch {
    return new Response('Image unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
