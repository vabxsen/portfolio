import { ArrowUpRight, Github } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Project } from '@/data/portfolio';
import { ProjectSurface } from './motion';
import { ProjectPreview } from './project-preview';

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <ProjectSurface
      style={{ '--project-accent': project.accent } as CSSProperties}
      className={`project-${project.slug}`}
    >
      <div className="project-visual">
        <div className="visual-meta">
          <span>
            {String(index + 1).padStart(2, '0')} / {project.name}
          </span>
          <span>
            {project.slug === 'scoop' || project.image ? 'Product screenshots' : 'Interface study'}
          </span>
        </div>
        <ProjectPreview project={project} />
      </div>
      <div className="project-content">
        <div className="project-title">
          <h3>{project.name}</h3>
          <div className="project-actions">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} source code on GitHub`}
              >
                <Github size={18} />
              </a>
            )}
            {project.demo && (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} live website`}
              >
                <ArrowUpRight size={20} />
              </a>
            )}
          </div>
        </div>
        <p className="project-category">{project.category}</p>
        <p className="project-description">{project.description}</p>
        <ul className="project-tags" aria-label={`${project.name} technologies`}>
          {project.technologies.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
        <div className="project-bottom">
          {project.demo ? (
            <a href={project.demo} target="_blank" rel="noopener noreferrer">
              {project.slug === 'scoop' ? 'Visit project' : 'Live demo'}
              <ArrowUpRight size={14} />
            </a>
          ) : (
            <span>
              {project.slug === 'native-ai'
                ? 'Desktop application'
                : ['gecko-ai', 'kimi', 'budgie'].includes(project.slug)
                  ? 'Android project'
                  : 'Demo coming soon'}
            </span>
          )}
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer">
              View source <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      </div>
    </ProjectSurface>
  );
}
