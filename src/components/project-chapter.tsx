import type { CSSProperties } from 'react';
import type { Project } from '@/data/portfolio';
import { hasScreenshots, ProjectLinks } from './project-links';
import { ProjectPreview } from './project-preview';

// A featured project told as its own chapter, tinted with the project's accent color.
export function ProjectChapter({ project, index }: { project: Project; index: number }) {
  const screenshots = hasScreenshots(project);
  const href = project.demo || project.github;
  const visual = (
    <div className="project-visual">
      <span className="stage-label">{screenshots ? 'Product screenshots' : 'Interface study'}</span>
      <ProjectPreview project={project} />
    </div>
  );
  return (
    <article
      className={`chapter${screenshots ? ' screenshot-card' : ''}`}
      style={{ '--project-accent': project.accent } as CSSProperties}
      aria-labelledby={`project-${project.slug}`}
      data-project={project.slug}
    >
      <div className="chapter-rule" aria-hidden="true">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <i />
        <span>{project.name}</span>
      </div>
      <div className="chapter-body">
        <div className="chapter-stage">
          {href ? (
            // The preview repeats the primary link below for pointer users, so keyboard users
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
      </div>
    </article>
  );
}
