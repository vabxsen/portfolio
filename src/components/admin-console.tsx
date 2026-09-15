'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Save,
  Upload,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Check,
  LayoutDashboard,
  FileText,
  Folder,
  Palette,
  Image as ImageIcon,
  History,
  LogOut,
  Globe,
  Download,
} from 'lucide-react';
import { contentSchema, defaultContent, type Content } from '@/lib/content';

type Media = { id: string; name: string; size: number };
type Revision = { id: string; created_at: string; author: string };
type Path = (string | number)[];
const sections = [
  ['overview', 'Overview', LayoutDashboard],
  ['profile', 'Profile', FileText],
  ['projects', 'Projects', Folder],
  ['copy', 'Page copy', FileText],
  ['stack', 'Tech stack', Folder],
  ['journey', 'Journey', Folder],
  ['repositories', 'Open source', Folder],
  ['theme', 'Appearance', Palette],
  ['media', 'Media library', ImageIcon],
  ['history', 'History', History],
] as const;
const label = (s: string) =>
  s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
type ApiResults = {
  content: { content: Content; version: number; publishedVersion: number };
  media: Media[];
  history: Revision[];
  save: { version: number };
  publish: { publishedVersion: number };
  restore: { version: number };
};
async function api<A extends keyof ApiResults>(action: A, body?: unknown): Promise<ApiResults[A]> {
  const response = await fetch(`/api/admin/${action}/`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const value = (await response.json()) as ApiResults[A] & { error?: string };
  if (!response.ok) throw new Error(value.error || 'Request failed. Please try again.');
  return value;
}
function at(value: unknown, path: Path): unknown {
  return path.reduce<unknown>((v, k) => (v as Record<string | number, unknown>)?.[k], value);
}
function blank(value: unknown): unknown {
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        k === 'slug'
          ? `project-${crypto.randomUUID().slice(0, 8)}`
          : k === 'accent'
            ? '#d4bc94'
            : blank(v),
      ]),
    );
  if (typeof value === 'boolean') return false;
  return value === null ? null : '';
}
export function AdminConsole({
  initialContent,
  initialVersion,
  initialPublishedVersion,
  email,
  signOut,
}: {
  initialContent: Content;
  initialVersion: number;
  initialPublishedVersion: number;
  email: string;
  signOut: string;
}) {
  const [content, setContent] = useState(initialContent),
    [saved, setSaved] = useState(JSON.stringify(initialContent)),
    [version, setVersion] = useState(initialVersion),
    [published, setPublished] = useState(initialPublishedVersion);
  const [tab, setTab] = useState('overview'),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [media, setMedia] = useState<Media[]>([]),
    [history, setHistory] = useState<Revision[]>([]);
  const importRef = useRef<HTMLInputElement>(null),
    uploadRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(content) !== saved;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (tab === 'media' || tab === 'projects')
      api('media')
        .then(setMedia)
        .catch((e) => setError(e.message));
    if (tab === 'history')
      api('history')
        .then(setHistory)
        .catch((e) => setError(e.message));
  }, [tab]);
  function change(path: Path, value: unknown) {
    setContent((current) => {
      const next = structuredClone(current);
      const parent = at(next, path.slice(0, -1)) as Record<string | number, unknown>;
      parent[path[path.length - 1]] = value;
      return next;
    });
    setMessage('');
  }
  function exportContent() {
    const a = document.createElement('a');
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }),
    );
    a.href = url;
    a.download = 'portfolio-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Your edits are still here.');
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    const valid = contentSchema.parse(content);
    const result = await api('save', { content: valid, version });
    setVersion(result.version);
    setSaved(JSON.stringify(content));
    return result.version as number;
  }
  function saveOnly() {
    run(async () => {
      await save();
      setMessage('Draft saved. The live portfolio is unchanged.');
    });
  }
  function publishNow() {
    run(async () => {
      const current = dirty ? await save() : version;
      if (current === published) {
        setMessage('Your portfolio is already up to date.');
        return;
      }
      const result = await api('publish', { version: current });
      setPublished(result.publishedVersion);
      setMessage('Published. Your changes are live.');
    });
  }
  async function upload(file: File, path?: Path) {
    await run(async () => {
      if (file.size > 8 * 1024 * 1024) throw new Error('Choose an image smaller than 8 MB.');
      const response = await fetch('/api/admin/upload/', {
        method: 'POST',
        headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
        body: file,
      });
      const result = (await response.json()) as { error?: string; url: string };
      if (!response.ok) throw new Error(result.error);
      setMedia(await api('media'));
      if (path) change(path, result.url);
      setMessage(
        path
          ? 'Image uploaded and selected. Save your draft to keep this change.'
          : 'Image uploaded. Select it from a project’s image field.',
      );
    });
  }
  function restore(id: string) {
    if (
      dirty &&
      !window.confirm(
        'Replace your unsaved edits with this revision? Export a backup first if you want to keep them.',
      )
    )
      return;
    run(async () => {
      await api('restore', { id, version });
      const state = await api('content');
      setContent(state.content);
      setSaved(JSON.stringify(state.content));
      setVersion(state.version);
      setPublished(state.publishedVersion);
      setMessage('Revision restored to draft. Preview it, then publish when ready.');
    });
  }
  async function importFile(file: File) {
    await run(async () => {
      if (file.size > 512000) throw new Error('Backup exceeds 500 KB.');
      setContent(contentSchema.parse(JSON.parse(await file.text())));
      setMessage('Backup loaded into the editor. Save or publish when ready.');
    });
  }
  function moveItem(path: Path, index: number, direction: number) {
    const items = [...(at(content, path) as unknown[])];
    [items[index], items[index + direction]] = [items[index + direction], items[index]];
    change(path, items);
  }
  function renderField(value: unknown, path: Path): React.ReactNode {
    const name = String(path[path.length - 1]),
      id = `field-${path.join('-')}`;
    if (typeof value === 'boolean')
      return (
        <label key={id} className="admin-toggle">
          <input
            id={id}
            type="checkbox"
            checked={value}
            onChange={(e) => change(path, e.target.checked)}
          />
          <span>{label(name)}</span>
        </label>
      );
    if (Array.isArray(value)) {
      const fixed = path[0] === 'copy';
      return (
        <div className="admin-array" key={id}>
          <div className="admin-field-heading">
            <h3>{label(name)}</h3>
            {!fixed && (
              <button
                type="button"
                className="admin-button small"
                onClick={() => {
                  const template = value[0] ?? (at(defaultContent, path) as unknown[])?.[0] ?? '';
                  change(path, [...value, blank(template)]);
                }}
              >
                <Plus size={14} /> Add
              </button>
            )}
          </div>
          {value.map((item, index) => (
            <div className="admin-array-item" key={`${id}-${index}`}>
              <div className="admin-array-toolbar">
                <span>
                  {typeof item === 'object' && item
                    ? String(
                        (item as { name?: string; title?: string; label?: string }).name ||
                          (item as { title?: string }).title ||
                          (item as { label?: string }).label ||
                          `Item ${index + 1}`,
                      )
                    : `${label(name)} ${index + 1}`}
                </span>
                {!fixed && (
                  <div>
                    <button
                      type="button"
                      disabled={index === 0}
                      aria-label={`Move ${name} item ${index + 1} up`}
                      onClick={() => moveItem(path, index, -1)}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={index === value.length - 1}
                      aria-label={`Move ${name} item ${index + 1} down`}
                      onClick={() => moveItem(path, index, 1)}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${name} item ${index + 1}`}
                      onClick={() => {
                        if (path[0] === 'projects' && path.length === 1) {
                          const slug = (item as { slug: string }).slug;
                          setContent((c) => ({
                            ...c,
                            projects: c.projects.filter((p) => p.slug !== slug),
                            featuredProjectSlugs: c.featuredProjectSlugs.filter((s) => s !== slug),
                          }));
                        } else
                          change(
                            path,
                            value.filter((_, i) => i !== index),
                          );
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              {renderField(item, [...path, index])}
            </div>
          ))}
          {!value.length && <p className="admin-muted">No items yet. Add one to get started.</p>}
        </div>
      );
    }
    if (value && typeof value === 'object')
      return (
        <div key={id} className="admin-fields">
          {Object.entries(value).map(([key, v]) => renderField(v, [...path, key]))}
        </div>
      );
    const optional = value === null || ['github', 'linkedin', 'demo', 'image'].includes(name);
    if (name === 'image')
      return (
        <div className="admin-field" key={id}>
          <label htmlFor={id}>Project screenshot</label>
          <select
            id={id}
            value={String(value || '')}
            onChange={(e) => change(path, e.target.value || null)}
          >
            <option value="">Use interface study</option>
            {Boolean(value) && !media.some((m) => `/media/${m.id}` === value) && (
              <option value={String(value)}>
                Current image · {String(value).split('/').pop()}
              </option>
            )}
            {media.map((m) => (
              <option key={m.id} value={`/media/${m.id}`}>
                {m.name}
              </option>
            ))}
          </select>
          <label className="admin-upload-label">
            Upload screenshot
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, path);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      );
    const multiline = ['description', 'introduction', 'bio', 'philosophy', 'note'].includes(name);
    const color = ['accent', 'background', 'foreground'].includes(name);
    const fieldValue = String(value ?? '');
    return (
      <div className={`admin-field ${multiline ? 'wide' : ''}`} key={id}>
        <label htmlFor={id}>
          {label(name)}
          {optional && <span> optional</span>}
        </label>
        {multiline ? (
          <textarea
            id={id}
            rows={4}
            value={fieldValue}
            onChange={(e) => change(path, e.target.value)}
          />
        ) : (
          <input
            id={id}
            type={color ? 'color' : 'text'}
            value={fieldValue}
            onChange={(e) => {
              const next = optional ? e.target.value || null : e.target.value;
              if (name === 'slug' && path[0] === 'projects') {
                const old = value;
                setContent((c) => {
                  const nextContent = structuredClone(c);
                  nextContent.projects[Number(path[1])].slug = e.target.value;
                  nextContent.featuredProjectSlugs = nextContent.featuredProjectSlugs.map((s) =>
                    s === old ? e.target.value : s,
                  );
                  return nextContent;
                });
              } else change(path, next);
            }}
          />
        )}
        {name === 'slug' && <small>A unique lowercase name, using hyphens for spaces.</small>}
        {name === 'siteUrl' && <small>Your portfolio’s canonical HTTPS address.</small>}
      </div>
    );
  }
  const currentTitle = sections.find((s) => s[0] === tab)?.[1] || 'Overview';
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/">
          vs<span>.</span>
          <small>STUDIO</small>
        </a>
        <nav aria-label="Admin navigation">
          {sections.map(([id, title, Icon]) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={17} />
              {title}
            </button>
          ))}
        </nav>
        <div className="admin-account">
          <span className="admin-avatar">VS</span>
          <div>
            <strong>Owner</strong>
            <small>{email}</small>
          </div>
          <a href={signOut} target="_top" aria-label="Sign out">
            <LogOut size={17} />
          </a>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-kicker">YOUR PORTFOLIO / WORKSPACE</span>
            <h1>{currentTitle}</h1>
          </div>
          <div className="admin-actions">
            <a
              className="admin-button"
              href="/admin/preview/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview saved draft <ArrowUpRight size={15} />
            </a>
            <button className="admin-button" disabled={busy || !dirty} onClick={saveOnly}>
              <Save size={15} /> Save draft
            </button>
            <button
              className="admin-button primary"
              disabled={busy || (!dirty && version === published)}
              onClick={publishNow}
            >
              <Globe size={15} />
              {busy ? 'Working…' : 'Publish'}
            </button>
          </div>
        </header>
        <div className="admin-status">
          <span className={dirty ? 'status-dot amber' : 'status-dot'} />
          {dirty
            ? 'Unsaved changes'
            : version === published
              ? 'All changes published'
              : 'Saved draft · unpublished changes'}
          <a href="/" target="_blank" rel="noopener noreferrer">
            View live site ↗
          </a>
        </div>
        {error && (
          <div className="admin-feedback error" role="alert">
            {error}
            <div>
              <button className="admin-button small" onClick={exportContent}>
                Export current edits
              </button>
            </div>
          </div>
        )}
        {message && (
          <div className="admin-feedback" role="status">
            <Check size={17} />
            {message}
          </div>
        )}
        <fieldset disabled={busy} className="admin-editor">
          <legend className="sr-only">{currentTitle} editor</legend>
          {tab === 'overview' && (
            <>
              <section className="admin-welcome">
                <span className="admin-kicker">MAKE IT YOURS</span>
                <h2>
                  A home for everything
                  <br />
                  you’re building.
                </h2>
                <p>Update your work, refine your story, and publish on your terms.</p>
                <button className="admin-button primary" onClick={() => setTab('projects')}>
                  Edit selected work <ArrowUpRight size={16} />
                </button>
              </section>
              <div className="admin-stats">
                <div>
                  <span>{content.projects.length}</span>
                  <p>Projects</p>
                </div>
                <div>
                  <span>{content.featuredProjectSlugs.length}</span>
                  <p>Featured</p>
                </div>
                <div>
                  <span>{version}</span>
                  <p>Draft version</p>
                </div>
              </div>
              <section className="admin-panel">
                <h2>Your publishing flow</h2>
                <ol className="admin-steps">
                  <li>
                    <b>01 / Edit</b>
                    <p>Change content, screenshots, and appearance.</p>
                  </li>
                  <li>
                    <b>02 / Preview</b>
                    <p>Save your draft, then open the preview.</p>
                  </li>
                  <li>
                    <b>03 / Publish</b>
                    <p>Make your saved changes visible on the live site.</p>
                  </li>
                </ol>
              </section>
              <section className="admin-panel">
                <h2>Backup & recovery</h2>
                <p>
                  Export the complete content and design settings. Import a backup into your draft,
                  then review it before publishing. Uploaded images remain in your media library.
                </p>
                <div className="admin-actions">
                  <button className="admin-button" onClick={exportContent}>
                    <Download size={16} /> Export current content
                  </button>
                  <button className="admin-button" onClick={() => importRef.current?.click()}>
                    <Upload size={16} /> Import backup
                  </button>
                </div>
                <input
                  ref={importRef}
                  type="file"
                  hidden
                  accept="application/json,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importFile(file);
                    e.target.value = '';
                  }}
                />
              </section>
            </>
          )}
          {tab === 'profile' && (
            <section className="admin-panel">
              <h2>The person behind the work</h2>
              {renderField(content.profile, ['profile'])}
              <h2>Search & sharing</h2>
              {renderField(content.seo, ['seo'])}
            </section>
          )}
          {tab === 'projects' && (
            <>
              <section className="admin-panel">
                <h2>Featured work</h2>
                <p>Choose the projects shown before Show More. Use the arrows to arrange them.</p>
                <div className="admin-featured">
                  {content.projects.map((p) => (
                    <label key={p.slug}>
                      <input
                        type="checkbox"
                        checked={content.featuredProjectSlugs.includes(p.slug)}
                        onChange={(e) =>
                          change(
                            ['featuredProjectSlugs'],
                            e.target.checked
                              ? [...content.featuredProjectSlugs, p.slug]
                              : content.featuredProjectSlugs.filter((s) => s !== p.slug),
                          )
                        }
                      />
                      {p.name || 'Untitled project'}
                    </label>
                  ))}
                </div>
                {content.featuredProjectSlugs.map((slug, i) => (
                  <div key={slug} className="admin-featured-row">
                    <span>
                      {i + 1}. {content.projects.find((p) => p.slug === slug)?.name}
                    </span>
                    <button
                      className="admin-icon"
                      disabled={i === 0}
                      aria-label={`Move ${slug} up`}
                      onClick={() => moveItem(['featuredProjectSlugs'], i, -1)}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className="admin-icon"
                      disabled={i === content.featuredProjectSlugs.length - 1}
                      aria-label={`Move ${slug} down`}
                      onClick={() => moveItem(['featuredProjectSlugs'], i, 1)}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                ))}
              </section>
              <section className="admin-panel">
                {renderField(content.projects, ['projects'])}
              </section>
            </>
          )}
          {(['copy', 'stack', 'repositories'] as string[]).includes(tab) && (
            <section className="admin-panel">
              {renderField(content[tab as 'copy' | 'stack' | 'repositories'], [tab])}
            </section>
          )}
          {tab === 'journey' && (
            <section className="admin-panel">
              {renderField(content.journey, ['journey'])}
              <p className="admin-muted">
                When Journey is empty, the approach entries below appear instead.
              </p>
              {renderField(content.approach, ['approach'])}
            </section>
          )}
          {tab === 'theme' && (
            <section className="admin-panel">
              <h2>Color & motion</h2>
              <p>Keep text and background colors sufficiently different for comfortable reading.</p>
              {renderField(content.theme, ['theme'])}
              <h2>Visible sections</h2>
              {renderField(content.sections, ['sections'])}
            </section>
          )}
          {tab === 'media' && (
            <section className="admin-panel">
              <div className="admin-field-heading">
                <div>
                  <h2>Your image library</h2>
                  <p>Original PNG, JPEG, and WebP files · up to 8 MB each.</p>
                </div>
                <button className="admin-button primary" onClick={() => uploadRef.current?.click()}>
                  <Upload size={16} /> Upload image
                </button>
              </div>
              <input
                ref={uploadRef}
                type="file"
                hidden
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                  e.target.value = '';
                }}
              />
              <div className="admin-media-grid">
                {media.map((m) => (
                  <figure key={m.id}>
                    <img src={`/media/${m.id}`} alt={m.name} loading="lazy" />
                    <figcaption>
                      <b>{m.name}</b>
                      <span>{Math.ceil(m.size / 1024)} KB</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              {!media.length && (
                <p className="admin-empty">
                  Upload a screenshot, then select it in a project’s image field.
                </p>
              )}
            </section>
          )}
          {tab === 'history' && (
            <section className="admin-panel">
              <h2>Published history</h2>
              <p>
                Restore a previous publication into your draft. Your live site changes only when you
                publish again.
              </p>
              {history.map((r) => (
                <div className="admin-history-row" key={r.id}>
                  <div>
                    <b>{new Date(r.created_at).toLocaleString()}</b>
                    <span>Published by owner</span>
                  </div>
                  <button className="admin-button" onClick={() => restore(r.id)}>
                    Restore to draft
                  </button>
                </div>
              ))}
              {!history.length && (
                <p className="admin-empty">Your first admin publication will appear here.</p>
              )}
            </section>
          )}
        </fieldset>
        <footer className="admin-footer">
          Owner-only workspace <span>Changes reach your portfolio when you publish.</span>
        </footer>
      </main>
    </div>
  );
}
