CREATE TABLE `content_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL DEFAULT 'GENERAL',
	`playbackUrl` text NOT NULL,
	`logoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`sourceType` enum('url','m3u','m3u8') NOT NULL,
	`sourceUrl` text,
	`rawContent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_items` ADD CONSTRAINT `content_items_sourceId_content_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `content_sources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_sources` ADD CONSTRAINT `content_sources_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;