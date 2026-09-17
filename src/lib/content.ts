import { z } from 'zod';
import * as data from '@/data/portfolio';
import { copy } from '@/data/copy';
const text = z.string().max(10000);
const short = z.string().max(200);
const url = z
  .string()
  .max(2048)
  .refine((v) => {
    try {
      return new URL(v).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Use a complete HTTPS URL');
const image = z
  .string()
  .max(2048)
  .refine(
    (v) => /^\/(projects|media)\/[a-zA-Z0-9._-]+$/.test(v),
    'Choose an uploaded image or a project image',
  );
const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a six-digit hex color');
const entry = z.object({ period: short, title: short, organization: short, description: text });
function copySchema(value: unknown): z.ZodTypeAny {
  if (typeof value === 'string') return text;
  if (Array.isArray(value)) return z.array(text).length(value.length);
  return z
    .object(Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, copySchema(v)])))
    .strict();
}
export const contentSchema = z
  .object({
    profile: z.object({
      name: short.min(1),
      role: short.min(1),
      introduction: text,
      bio: text,
      philosophy: text,
      email: z.string().email(),
      github: url.nullable(),
      linkedin: url.nullable(),
    }),
    projects: z
      .array(
        z.object({
          slug: z
            .string()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            .max(80),
          name: short.min(1),
          category: short,
          description: text,
          technologies: z.array(short).max(20),
          accent: color,
          github: url.nullable(),
          demo: url.nullable(),
          image: image.nullable(),
          imageAlt: short,
          verified: z.boolean(),
        }),
      )
      .max(100),
    featuredProjectSlugs: z.array(short).max(20),
    stack: z
      .array(z.object({ label: short, description: text, items: z.array(short).max(30) }))
      .max(20),
    journey: z.array(entry).max(100),
    approach: z.array(entry).max(100),
    repositories: z
      .array(
        z.object({
          name: short,
          description: text,
          url,
          language: short,
          activity: short.optional(),
        }),
      )
      .max(50),
    copy: copySchema(copy) as z.ZodType<typeof copy>,
    theme: z.object({ accent: color, background: color, foreground: color, motion: z.boolean() }),
    sections: z.object({
      work: z.boolean(),
      about: z.boolean(),
      journey: z.boolean(),
      opensource: z.boolean(),
      contact: z.boolean(),
    }),
    seo: z.object({ title: short.min(1), description: z.string().max(500) }),
  })
  .strict()
  .superRefine((c, ctx) => {
    const slugs = c.projects.map((p) => p.slug);
    if (new Set(slugs).size !== slugs.length)
      ctx.addIssue({ code: 'custom', path: ['projects'], message: 'Project slugs must be unique' });
    if (
      new Set(c.featuredProjectSlugs).size !== c.featuredProjectSlugs.length ||
      c.featuredProjectSlugs.some((s) => !slugs.includes(s))
    )
      ctx.addIssue({
        code: 'custom',
        path: ['featuredProjectSlugs'],
        message: 'Featured projects must be unique existing project slugs',
      });
  });
export type Content = z.infer<typeof contentSchema>;
export const defaultContent: Content = {
  profile: data.profile,
  projects: data.projects,
  featuredProjectSlugs: [...data.featuredProjectSlugs],
  stack: data.stack,
  journey: data.journey,
  approach: data.approach,
  repositories: data.repositories,
  copy,
  theme: { accent: '#d4bc94', background: '#0b0b0b', foreground: '#eeeae3', motion: true },
  sections: { work: true, about: true, journey: true, opensource: true, contact: true },
  seo: {
    title: 'Vaibhav Sen — Developer & UI/UX Designer',
    description: data.profile.introduction,
  },
};
