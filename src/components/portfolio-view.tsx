import type { Content } from '@/lib/content';
import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Code2,
  Github,
  GitPullRequest,
  Mail,
  PenTool,
} from 'lucide-react';

import { Navbar } from '@/components/navbar';
import { AnimatedName, MagneticLink, MotionProvider, Reveal } from '@/components/motion';
import { HeroOrbit, SpotlightTracker } from '@/components/motion-graphics';
import { ProjectGallery } from '@/components/project-gallery';
import { OrbitText, RevealLines, ScrollWords, TechMarquee } from '@/components/text-effects';

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

// Dark saved backgrounds render at half brightness so the page reads deeper; light colors are
// left as chosen.
function renderedBackground(hex: string) {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  if (Math.max(...channels) > 0x40) return hex;
  const halved = channels.map((channel) => Math.round(channel / 2));
  return `#${halved.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

export function PortfolioView({ content }: { content: Content }) {
  const { profile, stack, journey, approach, repositories, copy, sections, theme } = content;
  const platforms = copy.platforms
    .split(/[·•|]/)
    .map((platform) => platform.trim())
    .filter(Boolean)
    .slice(0, 6);
  const orderedProjects = [
    ...content.featuredProjectSlugs.flatMap((slug) =>
      content.projects.filter((project) => project.slug === slug),
    ),
    ...content.projects.filter((project) => !content.featuredProjectSlugs.includes(project.slug)),
  ];
  const accents = [
    ...new Set(orderedProjects.map((project) => project.accent.toLowerCase())),
  ].slice(0, 6);
  const tools = [...new Set(stack.flatMap((group) => group.items))];
  const background = renderedBackground(theme.background);
  const emailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(profile.email)}`;
  return (
    <div
      className={theme.motion ? 'portfolio-root' : 'portfolio-root motion-disabled'}
      style={
        {
          '--accent': theme.accent,
          '--bg': background,
          '--fg': theme.foreground,
          background,
          color: theme.foreground,
        } as CSSProperties
      }
    >
      <MotionProvider enabled={theme.motion}>
        <SpotlightTracker />
        <div className="ambient" aria-hidden="true">
          <span />
          <span />
        </div>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div id="top" />
        <Navbar sections={sections} name={profile.name} />
        <main id="main" className="page-container">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="hero-eyebrow hero-enter" style={delay(0)}>
                  <span className="eyebrow-line" /> {copy.heroEyebrow}
                </div>
                <h1 id="hero-title">
                  <AnimatedName name={profile.name} />
                  <span className="hero-enter" style={delay(420)}>
                    {profile.role}
                    <span className="hero-period">.</span>
                  </span>
                </h1>
                <p className="hero-intro hero-enter" style={delay(560)}>
                  {profile.introduction}
                </p>
                <div className="hero-actions hero-enter" style={delay(680)}>
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
                    <a className="hero-contact" href="#contact">
                      Contact <ArrowUpRight size={15} />
                    </a>
                  )}
                </div>
              </div>
              <div className="hero-visual hero-enter" style={delay(260)}>
                <HeroOrbit platforms={platforms} accents={accents} />
                <div className="hero-captions">
                  <span>{copy.heroSide[0]}</span>
                  <span>{copy.heroSide[1]}</span>
                </div>
              </div>
            </div>
            <div className="hero-footnote hero-enter" style={delay(820)}>
              <span>{copy.platforms}</span>
              {sections.work && (
                <a href="#work">
                  SCROLL TO EXPLORE <ArrowDown size={12} />
                </a>
              )}
            </div>
          </section>
          {sections.about && <TechMarquee items={tools} />}
          {sections.work && (
            <section id="work" className="work-section" aria-labelledby="work-heading">
              <SectionHeading
                number="01"
                label={copy.work.label}
                lines={[copy.work.title[0], <span>{copy.work.title[1]}</span>]}
                description={copy.work.description}
              />
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
              <div className="about-grid">
                <div>
                  <SectionLabel number="02" label={copy.about.label} />
                  <h2 id="about-heading">
                    <RevealLines
                      lines={[copy.about.title[0], <span>{copy.about.title[1]}</span>]}
                    />
                  </h2>
                  <div className="discipline-pair scroll-fade">
                    <span>
                      <Code2 size={18} /> {copy.about.build}
                    </span>
                    <span>
                      <PenTool size={17} /> {copy.about.design}
                    </span>
                  </div>
                </div>
                <div className="about-copy">
                  <ScrollWords text={profile.bio} />
                  <p className="scroll-fade">{profile.philosophy}</p>
                  <a
                    className="text-link scroll-fade"
                    href={sections.contact ? '#contact' : emailUrl}
                    target={sections.contact ? undefined : '_blank'}
                    rel={sections.contact ? undefined : 'noopener noreferrer'}
                  >
                    {copy.about.link} <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>
              <Reveal>
                <div className="stack-header">
                  <h3>{copy.stack.title}</h3>
                  <span>{copy.stack.note}</span>
                </div>
                <div className="stack-grid">
                  {stack.map((group) => (
                    <div className="stack-group spotlight" key={group.label}>
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
              <div className="journey-grid">
                <div className="journey-intro">
                  <SectionLabel number="03" label={copy.journey.label} />
                  <h2 id="journey-heading">
                    <RevealLines
                      lines={[copy.journey.title[0], <span>{copy.journey.title[1]}</span>]}
                    />
                  </h2>
                  <p className="section-description scroll-fade">{copy.journey.description}</p>
                </div>
                <ol className="timeline">
                  {(journey.length ? journey : approach).map((entry) => (
                    <li key={entry.title}>
                      <div className="timeline-dot" />
                      <span className="timeline-period">{entry.period}</span>
                      <div className="scroll-fade">
                        <span className="timeline-organization">{entry.organization}</span>
                        <h3>{entry.title}</h3>
                        <p>{entry.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}
          {sections.opensource && (
            <section
              id="opensource"
              className="opensource-section section-space"
              aria-labelledby="opensource-heading"
            >
              <div className="opensource-header">
                <div>
                  <SectionLabel number="04" label={copy.openSource.label} />
                  <h2 id="opensource-heading">
                    <RevealLines
                      lines={[copy.openSource.title[0], <span>{copy.openSource.title[1]}</span>]}
                    />
                  </h2>
                </div>
                <a
                  className="button button-secondary scroll-fade"
                  href={profile.github || '#contact'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github size={16} />{' '}
                  {profile.github ? new URL(profile.github).pathname.replace('/', '@') : 'GitHub'}{' '}
                  <ArrowUpRight size={14} />
                </a>
              </div>
              <p className="open-intro scroll-fade">{copy.openSource.description}</p>
              <Reveal>
                <div className="repo-grid">
                  {repositories.map((repo) => (
                    <a
                      className="repo-card spotlight"
                      key={repo.name}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="repo-top">
                        <span className="repo-prompt" aria-hidden="true">
                          &gt;
                          <i />
                        </span>
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
              <SectionLabel number="05" label={copy.contact.label} />
              <div className="contact-title">
                <h2 id="contact-heading">
                  <RevealLines
                    lines={[
                      copy.contact.title[0],
                      <>
                        <span>{copy.contact.title[1]}</span>
                        <em>{copy.contact.title[2]}</em>
                      </>,
                    ]}
                  />
                </h2>
                <div className="contact-orbit scroll-fade">
                  <OrbitText text={copy.contact.label} />
                  <MagneticLink
                    className="contact-orb"
                    href={emailUrl}
                    ariaLabel={`Email ${profile.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowUpRight strokeWidth={1} size={60} />
                  </MagneticLink>
                </div>
              </div>
              <div className="contact-bottom scroll-fade">
                <p>{copy.contact.description}</p>
                <a
                  className="email-link"
                  href={emailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail size={17} />
                  {profile.email}
                  <ArrowUpRight size={16} />
                </a>
              </div>
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
            {sections.contact && <a href="#contact">Contact</a>}
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
    <p className="section-label scroll-fade">
      <span>{number}</span>
      {label}
    </p>
  );
}
function SectionHeading({
  number,
  label,
  lines,
  description,
}: {
  number: string;
  label: string;
  lines: ReactNode[];
  description: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <SectionLabel number={number} label={label} />
        <h2 id="work-heading">
          <RevealLines lines={lines} />
        </h2>
      </div>
      <p className="scroll-fade">{description}</p>
    </div>
  );
}
