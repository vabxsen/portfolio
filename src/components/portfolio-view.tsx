import type { Content } from '@/lib/content';
import type { CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Code2,
  Github,
  GitPullRequest,
  Mail,
  PenTool,
  Terminal,
} from 'lucide-react';

import { Navbar } from '@/components/navbar';
import { AnimatedName, MagneticLink, MotionProvider, Reveal } from '@/components/motion';
import { ProjectGallery } from '@/components/project-gallery';

export function PortfolioView({ content }: { content: Content }) {
  const { profile, stack, journey, approach, repositories, copy, sections, theme } = content;
  return (
    <div
      className={theme.motion ? 'portfolio-root' : 'portfolio-root motion-disabled'}
      style={
        {
          '--accent': theme.accent,
          '--bg': theme.background,
          '--fg': theme.foreground,
          background: theme.background,
          color: theme.foreground,
        } as CSSProperties
      }
    >
      <MotionProvider enabled={theme.motion}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div id="top" />
        <Navbar sections={sections} name={profile.name} />
        <main id="main" className="page-container">
          <section className="hero" aria-labelledby="hero-title">
            <Reveal>
              <div className="hero-eyebrow">
                <span className="eyebrow-line" /> {copy.heroEyebrow}
              </div>
              <h1 id="hero-title">
                <AnimatedName name={profile.name} />
                <span>
                  {profile.role}
                  <span className="hero-period">.</span>
                </span>
              </h1>
              <div className="hero-lower">
                <div>
                  <p className="hero-intro">{profile.introduction}</p>
                  <div className="hero-actions">
                    {sections.work && (
                      <MagneticLink className="button button-primary" href="#work">
                        View my work <ArrowDown size={16} />
                      </MagneticLink>
                    )}
                    <a
                      className="button button-secondary"
                      href={profile.github || '#opensource'}
                      target={profile.github ? '_blank' : undefined}
                      rel="noopener noreferrer"
                    >
                      <Github size={16} /> GitHub <ArrowUpRight size={14} />
                    </a>
                    {sections.contact && (
                      <a
                        className="hero-contact"
                        href={sections.contact ? '#contact' : `mailto:${profile.email}`}
                      >
                        Contact <ArrowUpRight size={15} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="hero-side">
                  <span>{copy.heroSide[0]}</span>
                  <span>{copy.heroSide[1]}</span>
                  <div className="hero-symbol" aria-hidden="true">
                    ↘
                  </div>
                </div>
              </div>
            </Reveal>
            <div className="hero-footnote">
              <span>{copy.platforms}</span>
              {sections.work && (
                <a href="#work">
                  SCROLL TO EXPLORE <ArrowDown size={12} />
                </a>
              )}
            </div>
          </section>
          {sections.work && (
            <section id="work" className="work-section" aria-labelledby="work-heading">
              <Reveal>
                <SectionHeading
                  number="01"
                  label={copy.work.label}
                  title={
                    <>
                      {copy.work.title[0]}
                      <br />
                      <span>{copy.work.title[1]}</span>
                    </>
                  }
                  description={copy.work.description}
                />
              </Reveal>
              <ProjectGallery
                projects={content.projects}
                featuredProjectSlugs={content.featuredProjectSlugs}
                copy={copy}
              />
            </section>
          )}
          {sections.about && (
            <section
              id="about"
              className="about-section section-space"
              aria-labelledby="about-heading"
            >
              <Reveal className="about-grid">
                <div>
                  <SectionLabel number="02" label={copy.about.label} />
                  <h2 id="about-heading">
                    {copy.about.title[0]}
                    <br />
                    <span>{copy.about.title[1]}</span>
                  </h2>
                  <div className="discipline-pair">
                    <span>
                      <Code2 size={18} /> {copy.about.build}
                    </span>
                    <span>
                      <PenTool size={17} /> {copy.about.design}
                    </span>
                  </div>
                </div>
                <div className="about-copy">
                  <p>{profile.bio}</p>
                  <p>{profile.philosophy}</p>
                  <a
                    className="text-link"
                    href={sections.contact ? '#contact' : `mailto:${profile.email}`}
                  >
                    {copy.about.link} <ArrowUpRight size={16} />
                  </a>
                </div>
              </Reveal>
              <Reveal>
                <div className="stack-header">
                  <h3>{copy.stack.title}</h3>
                  <span>{copy.stack.note}</span>
                </div>
                <div className="stack-grid">
                  {stack.map((group) => (
                    <div className="stack-group" key={group.label}>
                      <h4>{group.label}</h4>
                      <p>{group.description}</p>
                      <ul>
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Reveal>
            </section>
          )}
          {sections.journey && (
            <section
              id="journey"
              className="journey-section section-space"
              aria-labelledby="journey-heading"
            >
              <Reveal className="journey-grid">
                <div>
                  <SectionLabel number="03" label={copy.journey.label} />
                  <h2 id="journey-heading">
                    {copy.journey.title[0]}
                    <br />
                    <span>{copy.journey.title[1]}</span>
                  </h2>
                  <p className="section-description">{copy.journey.description}</p>
                </div>
                <ol className="timeline">
                  {(journey.length ? journey : approach).map((entry) => (
                    <li key={entry.title}>
                      <div className="timeline-dot" />
                      <span className="timeline-period">{entry.period}</span>
                      <div>
                        <span className="timeline-organization">{entry.organization}</span>
                        <h3>{entry.title}</h3>
                        <p>{entry.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}
          {sections.opensource && (
            <section
              id="opensource"
              className="opensource-section section-space"
              aria-labelledby="opensource-heading"
            >
              <Reveal>
                <div className="opensource-header">
                  <div>
                    <SectionLabel number="04" label={copy.openSource.label} />
                    <h2 id="opensource-heading">
                      {copy.openSource.title[0]}
                      <br />
                      <span>{copy.openSource.title[1]}</span>
                    </h2>
                  </div>
                  <a
                    className="button button-secondary"
                    href={profile.github || '#contact'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github size={16} />{' '}
                    {profile.github ? new URL(profile.github).pathname.replace('/', '@') : 'GitHub'}{' '}
                    <ArrowUpRight size={14} />
                  </a>
                </div>
                <p className="open-intro">{copy.openSource.description}</p>
                <div className="repo-grid">
                  {repositories.map((repo) => (
                    <a
                      className="repo-card"
                      key={repo.name}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="repo-top">
                        <Terminal size={19} />
                        <ArrowUpRight size={17} />
                      </div>
                      <h3>{repo.name}</h3>
                      <p>{repo.description}</p>
                      <div className="repo-meta">
                        <span>{repo.language}</span>
                        <span>{repo.activity}</span>
                      </div>
                    </a>
                  ))}
                </div>
                <div className="github-note">
                  <GitPullRequest size={15} />
                  <span>{copy.openSource.note}</span>
                  <a
                    href={profile.github ? `${profile.github}?tab=repositories` : '#contact'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    All repositories <ArrowRight size={15} />
                  </a>
                </div>
              </Reveal>
            </section>
          )}
          {sections.contact && (
            <section
              id="contact"
              className="contact-section section-space"
              aria-labelledby="contact-heading"
            >
              <Reveal>
                <SectionLabel number="05" label={copy.contact.label} />
                <div className="contact-title">
                  <h2 id="contact-heading">
                    {copy.contact.title[0]}
                    <br />
                    <span>{copy.contact.title[1]}</span>
                    <em>{copy.contact.title[2]}</em>
                  </h2>
                  <MagneticLink
                    className="contact-orb"
                    href={`mailto:${profile.email}`}
                    ariaLabel={`Email ${profile.name}`}
                  >
                    <ArrowUpRight strokeWidth={1} size={60} />
                  </MagneticLink>
                </div>
                <div className="contact-bottom">
                  <p>{copy.contact.description}</p>
                  <a className="email-link" href={`mailto:${profile.email}`}>
                    <Mail size={17} />
                    {profile.email}
                    <ArrowUpRight size={16} />
                  </a>
                </div>
              </Reveal>
            </section>
          )}
        </main>
        <footer className="footer page-container">
          <a href="#top" className="wordmark" aria-label="Back to top">
            vs<span>.</span>
          </a>
          <p>
            © {new Date().getFullYear()} {profile.name}
          </p>
          <nav aria-label="Footer navigation">
            {sections.work && <a href="#work">Work</a>}
            <a href={profile.github || '#opensource'} target="_blank" rel="noopener noreferrer">
              GitHub <ArrowUpRight size={12} />
            </a>
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn <ArrowUpRight size={12} />
              </a>
            )}
            {sections.contact && (
              <a href={sections.contact ? '#contact' : `mailto:${profile.email}`}>Contact</a>
            )}
            <a href="/admin/">Admin</a>
            <a href="#top" aria-label="Back to top">
              ↑
            </a>
          </nav>
        </footer>
      </MotionProvider>
    </div>
  );
}
function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <p className="section-label">
      <span>{number}</span>
      {label}
    </p>
  );
}
function SectionHeading({
  number,
  label,
  title,
  description,
}: {
  number: string;
  label: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <SectionLabel number={number} label={label} />
        <h2 id="work-heading">{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}
