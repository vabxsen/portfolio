import type { CSSProperties } from 'react';
import type { Project } from '@/data/portfolio';
import { hasScreenshots, ProjectLinks } from './project-links';
import { ProjectPreview } from './project-preview';

// A featured project as a full-width showcase tile, tinted with the project's accent color:
// centered copy and links above, the preview rising from the bottom edge below.
export function ProjectChapter({ project }: { project: Project }) {
  const screenshots = hasScreenshots(project);
  const href = project.demo || project.github;
  const visual = (
    <div className="project-visual">
      <ProjectPreview project={project} />
      <span className="stage-glare" aria-hidden="true" />
    </div>
  );
  return (
    <article
      className={`chapter${screenshots ? ' screenshot-card' : ''}`}
      style={{ '--project-accent': project.accent } as CSSProperties}
      aria-labelledby={`project-${project.slug}`}
      data-project={project.slug}
    >
      <span className="stage-label" aria-hidden="true">
        {screenshots ? 'Product screenshots' : 'Interface study'}
      </span>
      <div className="chapter-copy scroll-fade">
        <h3 id={`project-${project.slug}`}>{project.name}</h3>
        <p className="chapter-tagline">{project.category}</p>
        <p className="chapter-description">{project.description}</p>
        <ul className="chapter-tech" aria-label={`${project.name} technologies`}>
          {project.technologies.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
        <ProjectLinks project={project} />
      </div>
      <div className="chapter-stage">
        {href ? (
          // The preview repeats the primary link above for pointer users, so keyboard users
          // reach that link instead of tabbing through both.
          <a
            className="stage-link"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            aria-label={`Open ${project.name}`}
          >
            {visual}
          </a>
        ) : (
          visual
        )}
      </div>
    </article>
  );
}
