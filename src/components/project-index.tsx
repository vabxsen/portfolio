'use client';
import { Plus } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { Project } from '@/data/portfolio';
import { useMotionPreference } from './motion';
import { hasScreenshots, ProjectLinks } from './project-links';
import { ProjectPreview } from './project-preview';

const follow = { stiffness: 260, damping: 28, mass: 0.6 };
const floatWidth = 420;
const floatHeight = 280;

// The remaining projects as a numbered index. Rows expand for details everywhere; with a mouse,
// hovering a row also floats that project's preview beside the cursor.
export function ProjectIndex({
  projects,
  startIndex,
  showMore,
  showLess,
}: {
  projects: Project[];
  startIndex: number;
  showMore: string;
  showLess: string;
}) {
  const reduced = useMotionPreference();
  const [active, setActive] = useState<string | null>(null);
  const finePointer = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, follow);
  const smoothY = useSpring(y, follow);

  useEffect(() => {
    finePointer.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  function place(event: PointerEvent<HTMLElement>, jump = false) {
    if (!finePointer.current) return;
    const right = event.clientX + 36;
    x.set(right + floatWidth > window.innerWidth - 16 ? event.clientX - floatWidth - 36 : right);
    y.set(
      Math.min(
        Math.max(event.clientY - floatHeight / 2, 16),
        window.innerHeight - floatHeight - 16,
      ),
    );
    if (jump) {
      smoothX.jump(x.get());
      smoothY.jump(y.get());
    }
  }

  function enter(event: PointerEvent<HTMLElement>, slug: string) {
    if (!finePointer.current) return;
    place(event, active === null);
    setActive(slug);
  }

  return (
    <div className="project-index">
      <div className="index-header scroll-fade">
        <span>More work</span>
        <span>{String(projects.length).padStart(2, '0')} projects</span>
      </div>
      <ol
        className="index-list"
        id="additional-projects"
        onPointerMove={(event) => place(event)}
        onPointerLeave={() => setActive(null)}
      >
        {projects.map((project, index) => (
          <li
            key={project.slug}
            data-project={project.slug}
            style={{ '--project-accent': project.accent } as CSSProperties}
            onPointerEnter={(event) => enter(event, project.slug)}
          >
            <details className="index-row">
              <summary>
                <span className="index-number">
                  {String(startIndex + index + 1).padStart(2, '0')}
                </span>
                <span className="index-name">{project.name}</span>
                <span className="index-tagline">{project.category}</span>
                <span className="index-tech">{project.technologies.slice(0, 3).join(' · ')}</span>
                <span className="index-toggle">
                  <span className="disclosure-more">{showMore}</span>
                  <span className="disclosure-less">{showLess}</span>
                  <Plus size={16} aria-hidden="true" />
                </span>
              </summary>
              <div className="index-details">
                <div
                  className={`index-inline-preview${hasScreenshots(project) ? ' screenshot-card' : ''}`}
                >
                  <div className="project-visual">
                    <span className="stage-label">
                      {hasScreenshots(project) ? 'Product screenshots' : 'Interface study'}
                    </span>
                    <ProjectPreview project={project} />
                  </div>
                </div>
                <div className="index-details-copy">
                  <p>{project.description}</p>
                  <ul className="chapter-tech" aria-label={`${project.name} technologies`}>
                    {project.technologies.map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                  <ProjectLinks project={project} />
                </div>
              </div>
            </details>
          </li>
        ))}
      </ol>
      <motion.div
        className="index-float"
        aria-hidden="true"
        data-visible={active ? 'true' : undefined}
        style={{ x: reduced ? x : smoothX, y: reduced ? y : smoothY }}
      >
        {projects.map((project) => (
          <div
            key={project.slug}
            className={`index-float-item${hasScreenshots(project) ? ' screenshot-card' : ''}`}
            data-active={active === project.slug ? 'true' : undefined}
            style={{ '--project-accent': project.accent } as CSSProperties}
          >
            <div className="project-visual">
              <ProjectPreview project={project} />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
