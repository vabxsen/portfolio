import type { Project } from '@/data/portfolio';

// Infers which hero platform labels (e.g. "WEB · MOBILE · DESKTOP · AI") a project belongs to
// from its technologies, name, and tagline. Unrecognized labels match by plain text.
const rules: [RegExp, RegExp][] = [
  [/web/i, /\b(react|next\.?js|vue|svelte|angular|typescript|javascript|pwa|express|html|web)\b/i],
  [/mobile|android|ios/i, /\b(kotlin|android|jetpack compose|swift|swiftui|ios|flutter|mobile)\b/i],
  [/desktop/i, /\b(tkinter|electron|tauri|qt|wpf|desktop)\b/i],
  [/\bai\b|ml/i, /\b(ai|ml|gemini|claude|openai|gpt|llm|speechrecognition)\b/i],
];

export function projectPlatforms(project: Project, platforms: string[]) {
  const haystack = [project.name, project.category, ...project.technologies].join(' ');
  return platforms.flatMap((platform, index) => {
    const rule = rules.find(([label]) => label.test(platform));
    const matches = rule
      ? rule[1].test(haystack)
      : haystack.toLowerCase().includes(platform.toLowerCase());
    return matches ? [index] : [];
  });
}
