-- AlterTable: allow uploaded About hero images (data URLs)
ALTER TABLE `SiteSettings` MODIFY `aboutHeroImageUrl` LONGTEXT NOT NULL;
