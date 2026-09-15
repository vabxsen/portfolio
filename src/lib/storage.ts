import { env } from 'cloudflare:workers';
import { defaultContent, contentSchema, type Content } from './content';
export function db() {
  if (!env.DB) throw new Error('Database unavailable');
  return env.DB;
}
export function bucket() {
  if (!env.BUCKET) throw new Error('Media storage unavailable');
  return env.BUCKET;
}
export type State = {
  draft: string;
  published: string;
  version: number;
  published_version: number;
  updated_at: string;
};
export async function readState() {
  return db()
    .prepare(
      'SELECT draft,published,version,published_version,updated_at FROM site_content WHERE id=1',
    )
    .first<State>();
}
export async function ensureState() {
  const initial = JSON.stringify(defaultContent);
  await db()
    .prepare(
      'INSERT INTO site_content (id,draft,published,version,published_version,updated_at) VALUES (1,?,?,1,1,?) ON CONFLICT(id) DO NOTHING',
    )
    .bind(initial, initial, new Date().toISOString())
    .run();
  await db()
    .prepare(
      'INSERT INTO site_revisions (id,payload,created_at,author) SELECT ?,published,?,? FROM site_content WHERE id=1 AND NOT EXISTS (SELECT 1 FROM site_revisions)',
    )
    .bind(crypto.randomUUID(), new Date().toISOString(), 'Initial portfolio')
    .run();
  return (await readState())!;
}
export async function getPublished(): Promise<Content> {
  const state = await readState();
  return state ? contentSchema.parse(JSON.parse(state.published)) : defaultContent;
}
export async function saveDraft(content: Content, version: number) {
  const result = await db()
    .prepare(
      'UPDATE site_content SET draft=?,version=version+1,updated_at=? WHERE id=1 AND version=?',
    )
    .bind(JSON.stringify(content), new Date().toISOString(), version)
    .run();
  return result.meta.changes === 1;
}
export async function publish(version: number, author: string) {
  const id = crypto.randomUUID(),
    now = new Date().toISOString();
  const result = await db().batch([
    db()
      .prepare(
        'UPDATE site_content SET published=draft,published_version=version,publication_id=?,updated_at=? WHERE id=1 AND version=? AND published_version<>version',
      )
      .bind(id, now, version),
    db()
      .prepare(
        'INSERT INTO site_revisions (id,payload,created_at,author) SELECT ?,published,?,? FROM site_content WHERE id=1 AND publication_id=?',
      )
      .bind(id, now, author, id),
  ]);
  return result[0].meta.changes === 1;
}
