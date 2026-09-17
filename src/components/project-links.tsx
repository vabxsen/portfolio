import { ArrowUpRight, Github } from 'lucide-react';
import type { Project } from '@/data/portfolio';

// Real screenshots are labeled as such; the other previews are illustrative interface studies.
export const hasScreenshots = (project: Project) =>
  project.slug === 'scoop' || Boolean(project.image);

export function ProjectLinks({ project }: { project: Project }) {
  if (!project.demo && !project.github) return null;
  return (
    <div className="project-links">
      {project.demo && (
        <a
          className="project-link project-link-primary"
          href={project.demo}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.name} live site`}
        >
          {project.slug === 'scoop' ? 'Visit project' : 'Live demo'} <ArrowUpRight size={15} />
        </a>
      )}
      {project.github && (
        <a
          className="project-link"
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${project.name} source code on GitHub`}
        >
          <Github size={15} /> View source <ArrowUpRight size={14} />
        </a>
      )}
    </div>
  );
}
