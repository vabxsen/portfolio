import { ChevronDown } from 'lucide-react';
import type { Content } from '@/lib/content';

import { ProjectCard } from './project-card';
import { Reveal } from './motion';

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
      <div className="work-caption">
        <span>{copy.work.caption}</span>
        <span>{String(featured.length).padStart(2, '0')} FEATURED PROJECTS</span>
      </div>
      <div className="projects-grid" id="featured-projects">
        {featured.map((project, index) => (
          <Reveal key={project.slug} delay={(index % 2) * 0.07}>
            <ProjectCard project={project} index={index} />
          </Reveal>
        ))}
      </div>
      {additional.length > 0 && (
        <details className="project-disclosure">
          <summary className="button button-secondary" aria-controls="additional-projects">
            <span className="disclosure-more">{copy.work.showMore}</span>
            <span className="disclosure-less">{copy.work.showLess}</span>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div className="projects-grid" id="additional-projects">
            {additional.map((project, index) => (
              <Reveal key={project.slug} delay={(index % 2) * 0.07}>
                <ProjectCard project={project} index={featured.length + index} />
              </Reveal>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
