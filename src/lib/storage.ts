import {
  BlobNotFoundError,
  BlobPreconditionFailedError,
  del,
  get,
  head,
  put,
  type GetBlobResult,
} from '@vercel/blob';
import { defaultContent, contentSchema, type Content } from './content';

const STATE_KEY = 'data/site-state.json';
// The public site reads only this small record; the full state also holds drafts and history.
const PUBLISHED_KEY = 'data/published.json';
const MAX_REVISIONS = 50;

export type State = {
  draft: string;
  published: string;
  version: number;
  published_version: number;
  updated_at: string;
};

export type Revision = {
  id: string;
  payload: string;
  created_at: string;
  author: string;
};

export type MediaRecord = {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
};

type StoredState = State & { revisions: Revision[]; media: MediaRecord[] };
type PublishedRecord = { version: number; published_at: string; payload: string };
type RecordValue<T> = { value: T; etag?: string };

function initialState(): StoredState {
  const now = new Date().toISOString();
  const payload = JSON.stringify(defaultContent);
  return {
    draft: payload,
    published: payload,
    version: 1,
    published_version: 1,
    updated_at: now,
    revisions: [{ id: crypto.randomUUID(), payload, created_at: now, author: 'Initial portfolio' }],
    media: [],
  };
}

// Only Vercel deployments use Blob. Every local run, including production builds and settings
// from `vercel env pull`, stays on .local-data/ even with a Blob token, so it can't touch production.
function deployed() {
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
}

function blobEnabled() {
  return deployed() && Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function assertStorageConfigured() {
  if (deployed() && !blobEnabled()) throw new Error('Portfolio storage is not configured');
}

async function localPath(key: string) {
  const path = await import('node:path');
  return path.join(process.cwd(), '.local-data', ...key.split('/'));
}

async function readLocal<T>(key: string): Promise<RecordValue<T> | null> {
  const fs = await import('node:fs/promises');
  try {
    const path = await localPath(key);
    const [value, stat] = await Promise.all([fs.readFile(path, 'utf8'), fs.stat(path)]);
    return { value: JSON.parse(value) as T, etag: `${stat.mtimeMs}-${stat.size}` };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function writeLocal<T>(key: string, value: T) {
  const fs = await import('node:fs/promises');
  const pathModule = await import('node:path');
  const path = await localPath(key);
  await fs.mkdir(pathModule.dirname(path), { recursive: true });
  const temporary = `${path}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(value), 'utf8');
  await fs.rename(temporary, path);
}

async function deleteLocal(key: string) {
  const fs = await import('node:fs/promises');
  await fs.rm(await localPath(key), { force: true });
}

async function readRecord<T>(key: string): Promise<RecordValue<T> | null> {
  assertStorageConfigured();
  if (!blobEnabled()) return readLocal<T>(key);
  try {
    // Blob content is delivered from its file endpoint, while conditional writes are
    // checked against the authoritative metadata ETag. Reading metadata first also
    // preserves optimistic concurrency: a write that lands after this read makes our
    // subsequent put fail and retry instead of overwriting the newer value.
    const metadata = await head(key);
    const result = await get(key, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return {
      value: JSON.parse(await new Response(result.stream).text()) as T,
      etag: metadata.etag,
    };
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

async function writeRecord<T>(key: string, value: T, etag?: string) {
  assertStorageConfigured();
  if (!blobEnabled()) return writeLocal(key, value);
  await put(key, JSON.stringify(value), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: Boolean(etag),
    contentType: 'application/json',
    ...(etag ? { ifMatch: etag } : {}),
  });
}

let localMutationQueue = Promise.resolve();

async function mutateRecord<T>(key: string, update: (current: T | null) => T | null) {
  if (!blobEnabled()) {
    assertStorageConfigured();
    const previous = localMutationQueue;
    let release = () => {};
    localMutationQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      const current = await readLocal<T>(key);
      const next = update(current?.value ?? null);
      if (next === null) return { changed: false, value: current?.value ?? null };
      await writeLocal(key, next);
      return { changed: true, value: next };
    } finally {
      release();
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await readRecord<T>(key);
    const next = update(current?.value ?? null);
    if (next === null) return { changed: false, value: current?.value ?? null };
    try {
      await writeRecord(key, next, current?.etag);
      return { changed: true, value: next };
    } catch (error) {
      const creationRace = !current && attempt === 0;
      if (!(error instanceof BlobPreconditionFailedError) && !creationRace) throw error;
    }
  }
  throw new Error('Storage changed too frequently; please try again');
}

export async function readState(): Promise<StoredState | null> {
  return (await readRecord<StoredState>(STATE_KEY))?.value ?? null;
}

export async function ensureState(): Promise<StoredState> {
  const existing = await readState();
  if (existing) return existing;
  const result = await mutateRecord<StoredState>(STATE_KEY, (current) => current ?? initialState());
  return result.value!;
}

// Skips the write when the record already holds this publication or a newer one, so a delayed
// publish can't roll the live site back. Publish times, unlike versions, keep increasing even
// if the state is recreated.
async function storePublished(state: StoredState) {
  const record: PublishedRecord = {
    version: state.published_version,
    published_at: state.revisions[0]?.created_at ?? state.updated_at,
    payload: state.published,
  };
  await mutateRecord<PublishedRecord>(PUBLISHED_KEY, (current) =>
    current?.published_at && current.published_at >= record.published_at ? null : record,
  );
}

export async function getPublished(): Promise<Content> {
  try {
    const published = await readRecord<PublishedRecord>(PUBLISHED_KEY);
    if (published) return contentSchema.parse(JSON.parse(published.value.payload));
    const state = await readState();
    if (!state) return defaultContent;
    // Stores from before the published record existed get one on their first visit.
    await storePublished(state).catch((error) =>
      console.error('Unable to store the published portfolio record', error),
    );
    return contentSchema.parse(JSON.parse(state.published));
  } catch (error) {
    console.error('Published portfolio storage unavailable', error);
    return defaultContent;
  }
}

export async function saveDraft(content: Content, version: number) {
  const serialized = JSON.stringify(content);
  const result = await mutateRecord<StoredState>(STATE_KEY, (current) => {
    const state = current ?? initialState();
    if (state.version !== version) return null;
    return {
      ...state,
      draft: serialized,
      version: state.version + 1,
      updated_at: new Date().toISOString(),
    };
  });
  return result.changed;
}

export async function publish(version: number, author: string) {
  const result = await mutateRecord<StoredState>(STATE_KEY, (current) => {
    const state = current ?? initialState();
    if (state.version !== version || state.published_version === version) return null;
    const revision: Revision = {
      id: crypto.randomUUID(),
      payload: state.draft,
      created_at: new Date().toISOString(),
      author,
    };
    return {
      ...state,
      published: state.draft,
      published_version: version,
      updated_at: revision.created_at,
      revisions: [revision, ...state.revisions].slice(0, MAX_REVISIONS),
    };
  });
  const state = result.value;
  // Also runs when this version was already published, so retrying repairs a failed record write.
  if (!state || state.published_version !== version) return false;
  await storePublished(state);
  return true;
}

export async function listRevisions() {
  return (await ensureState()).revisions
    .map(({ id, created_at, author }) => ({ id, created_at, author }))
    .slice(0, MAX_REVISIONS);
}

export async function getRevision(id: string) {
  return (await ensureState()).revisions.find((revision) => revision.id === id) ?? null;
}

export async function listMedia() {
  return (await ensureState()).media.slice(0, 100);
}

export async function addMedia(record: MediaRecord) {
  await mutateRecord<StoredState>(STATE_KEY, (current) => {
    const state = current ?? initialState();
    return { ...state, media: [record, ...state.media].slice(0, 100) };
  });
}

export async function storeMediaFile(id: string, bytes: Uint8Array, type: string) {
  assertStorageConfigured();
  const key = `media/${id}`;
  if (!blobEnabled()) {
    const fs = await import('node:fs/promises');
    const pathModule = await import('node:path');
    const path = await localPath(key);
    await fs.mkdir(pathModule.dirname(path), { recursive: true });
    await fs.writeFile(path, bytes);
    return;
  }
  await put(key, Buffer.from(bytes), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: type,
  });
}

export async function removeMediaFile(id: string) {
  assertStorageConfigured();
  const key = `media/${id}`;
  if (!blobEnabled()) return deleteLocal(key);
  await del(key);
}

export type MediaFile =
  | { statusCode: 200; stream: ReadableStream<Uint8Array>; type: string; etag: string }
  | { statusCode: 304; stream: null; type: null; etag: string };

export async function getMediaFile(
  id: string,
  ifNoneMatch?: string | null,
): Promise<MediaFile | null> {
  assertStorageConfigured();
  const key = `media/${id}`;
  if (!blobEnabled()) {
    const fs = await import('node:fs/promises');
    try {
      const bytes = await fs.readFile(await localPath(key));
      const type = id.endsWith('.png')
        ? 'image/png'
        : id.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
      return {
        statusCode: 200,
        stream: new Blob([bytes], { type }).stream(),
        type,
        etag: `\"${bytes.byteLength}-${id}\"`,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }
  const result: GetBlobResult | null = await get(key, {
    access: 'private',
    ...(ifNoneMatch ? { ifNoneMatch } : {}),
  });
  if (!result) return null;
  if (result.statusCode === 304)
    return { statusCode: 304, stream: null, type: null, etag: result.blob.etag };
  return {
    statusCode: 200,
    stream: result.stream,
    type: result.blob.contentType,
    etag: result.blob.etag,
  };
}

export async function readSecureRecord<T>(key: string) {
  return (await readRecord<T>(`auth/${key}.json`))?.value ?? null;
}

export async function writeSecureRecord<T>(key: string, value: T) {
  const storageKey = `auth/${key}.json`;
  const current = await readRecord<T>(storageKey);
  await writeRecord(storageKey, value, current?.etag);
}

export async function deleteSecureRecord(key: string) {
  const storageKey = `auth/${key}.json`;
  assertStorageConfigured();
  if (!blobEnabled()) return deleteLocal(storageKey);
  await del(storageKey);
}

// Returning null from `update` leaves the record as it is without writing.
export async function mutateSecureRecord<T>(key: string, update: (current: T | null) => T | null) {
  return (await mutateRecord<T>(`auth/${key}.json`, update)).value;
}
