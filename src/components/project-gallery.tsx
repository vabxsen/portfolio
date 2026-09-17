import type { CSSProperties } from 'react';
import type { Content } from '@/lib/content';

import { ProjectChapter } from './project-chapter';
import { ProjectIndex } from './project-index';

export function ProjectGallery({
  projects,
  featuredProjectSlugs,
  copy,
}: Pick<Content, 'projects' | 'featuredProjectSlugs' | 'copy'>) {
  const featured = featuredProjectSlugs.flatMap((slug) =>
    projects.filter((project) => project.slug === slug),
  );
  const additional = projects.filter(
    (project) => !featuredProjectSlugs.some((slug) => slug === project.slug),
  );

  return (
    <>
      <div className="work-caption scroll-fade">
        <span>{copy.work.caption}</span>
        <span>{String(projects.length).padStart(2, '0')} PROJECTS</span>
      </div>
      {featured.length > 0 && (
        <div className="chapters" id="featured-projects">
          {featured.map((project, index) => (
            <ProjectChapter key={project.slug} project={project} index={index} />
          ))}
          {/* Last, so the chapters' alternating layout still counts only chapters. */}
          {featured.length > 1 && (
            <div
              className="chapter-counter"
              aria-hidden="true"
              style={{ '--counter-accent': featured[0].accent } as CSSProperties}
            >
              <div className="counter-pin">
                <span className="counter-window">
                  <span className="counter-reel">
                    {featured.map((project, index) => (
                      <span key={project.slug}>{String(index + 1).padStart(2, '0')}</span>
                    ))}
                  </span>
                </span>
                <span className="counter-total">/ {String(featured.length).padStart(2, '0')}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {additional.length > 0 && (
        <ProjectIndex
          projects={additional}
          startIndex={featured.length}
          showMore={copy.work.showMore}
          showLess={copy.work.showLess}
        />
      )}
    </>
  );
}
