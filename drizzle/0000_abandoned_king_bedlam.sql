CREATE TABLE `site_content` (
	`id` integer PRIMARY KEY NOT NULL,
	`draft` text NOT NULL,
	`published` text NOT NULL,
	`version` integer NOT NULL,
	`published_version` integer NOT NULL,
	`publication_id` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_media` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_owner` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`author` text NOT NULL
);
