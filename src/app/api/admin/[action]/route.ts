import { z } from 'zod';
import { contentSchema } from '@/lib/content';
import { db, bucket, ensureState, saveDraft, publish } from '@/lib/storage';
import { requireOwner, checkWriteOrigin, limitedJson, HttpError } from '@/lib/admin-auth';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });
function failure(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return json(
      { error: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n') },
      400,
    );
  console.error('Admin request failed', error);
  return json(
    {
      error:
        'Unable to complete this request. Your unsaved edits are still available; please try again.',
    },
    503,
  );
}
export async function GET(request: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    await requireOwner();
    const { action } = await params;
    if (action === 'content') {
      const s = await ensureState();
      return json({
        content: JSON.parse(s.draft),
        version: s.version,
        publishedVersion: s.published_version,
        updatedAt: s.updated_at,
      });
    }
    if (action === 'history')
      return json(
        (
          await db()
            .prepare(
              'SELECT id,created_at,author FROM site_revisions ORDER BY created_at DESC LIMIT 50',
            )
            .all()
        ).results,
      );
    if (action === 'media')
      return json(
        (await db().prepare('SELECT * FROM site_media ORDER BY created_at DESC LIMIT 100').all())
          .results,
      );
    if (action === 'export') {
      const s = await ensureState();
      return new Response(s.draft, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="portfolio-backup.json"',
        },
      });
    }
    throw new HttpError(404, 'Not found.');
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    checkWriteOrigin(request);
    const user = await requireOwner();
    const { action } = await params;
    if (action === 'upload') {
      const reader = request.body?.getReader();
      if (!reader) throw new HttpError(400, 'Choose an image.');
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 8 * 1024 * 1024) {
          await reader.cancel();
          throw new HttpError(413, 'Choose an image smaller than 8 MB.');
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      const signature = Array.from(bytes.slice(0, 12));
      let type = '',
        ext = '';
      if (signature.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10') {
        type = 'image/png';
        ext = 'png';
      } else if (signature[0] === 255 && signature[1] === 216 && signature[2] === 255) {
        type = 'image/jpeg';
        ext = 'jpg';
      } else if (
        new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
        new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
      ) {
        type = 'image/webp';
        ext = 'webp';
      } else throw new HttpError(400, 'Use a PNG, JPEG, or WebP image.');
      const id = `${crypto.randomUUID()}.${ext}`,
        name = decodeURIComponent(request.headers.get('x-file-name') || 'Image').slice(0, 150);
      await bucket().put(id, bytes, { httpMetadata: { contentType: type } });
      try {
        await db()
          .prepare('INSERT INTO site_media (id,name,type,size,created_at) VALUES (?,?,?,?,?)')
          .bind(id, name, type, size, new Date().toISOString())
          .run();
      } catch (e) {
        await bucket().delete(id);
        throw e;
      }
      return json({ url: `/media/${id}`, id, name });
    }
    const body = await limitedJson(request);
    const version = z.number().int().positive().parse(body.version);
    await ensureState();
    if (action === 'save') {
      const content = contentSchema.parse(body.content);
      if (!(await saveDraft(content, version)))
        throw new HttpError(
          409,
          'This draft changed in another tab. Export your edits before reloading the latest draft.',
        );
      return json({ version: version + 1 });
    }
    if (action === 'publish') {
      if (!(await publish(version, user.userId)))
        throw new HttpError(
          409,
          'The draft changed or is already published. Reload the latest draft before publishing.',
        );
      return json({ publishedVersion: version });
    }
    if (action === 'restore') {
      const id = z.string().uuid().parse(body.id);
      const revision = await db()
        .prepare('SELECT payload FROM site_revisions WHERE id=?')
        .bind(id)
        .first<{ payload: string }>();
      if (!revision) throw new HttpError(404, 'Revision not found.');
      if (!(await saveDraft(contentSchema.parse(JSON.parse(revision.payload)), version)))
        throw new HttpError(409, 'The draft changed in another tab. Reload it before restoring.');
      return json({ version: version + 1 });
    }
    throw new HttpError(404, 'Not found.');
  } catch (e) {
    if (request.body && !request.body.locked) await request.body.cancel().catch(() => {});
    return failure(e);
  }
}
