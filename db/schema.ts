import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const owner = sqliteTable('admin_owner', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull(),
  email: text('email').notNull(),
});
export const content = sqliteTable('site_content', {
  id: integer('id').primaryKey(),
  draft: text('draft').notNull(),
  published: text('published').notNull(),
  version: integer('version').notNull(),
  publishedVersion: integer('published_version').notNull(),
  publicationId: text('publication_id'),
  updatedAt: text('updated_at').notNull(),
});
export const revisions = sqliteTable('site_revisions', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull(),
  createdAt: text('created_at').notNull(),
  author: text('author').notNull(),
});
export const media = sqliteTable('site_media', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  size: integer('size').notNull(),
  createdAt: text('created_at').notNull(),
});
export const sessions = sqliteTable('admin_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  credentialHash: text('credential_hash').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
export const loginLimits = sqliteTable('admin_login_limits', {
  key: text('key').primaryKey(),
  attempts: integer('attempts').notNull(),
  windowStart: integer('window_start').notNull(),
});
