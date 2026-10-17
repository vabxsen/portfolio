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
      {featured.length > 0 && (
        <div className="chapters" id="featured-projects">
          {featured.map((project) => (
            <ProjectChapter key={project.slug} project={project} />
          ))}
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
