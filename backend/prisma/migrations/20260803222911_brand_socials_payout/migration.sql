-- AlterTable
ALTER TABLE `Brand` ADD COLUMN `facebook` VARCHAR(255) NULL,
    ADD COLUMN `instagram` VARCHAR(255) NULL,
    ADD COLUMN `payoutAccount` VARCHAR(120) NULL,
    ADD COLUMN `payoutProvider` VARCHAR(40) NULL,
    ADD COLUMN `tiktok` VARCHAR(255) NULL,
    ADD COLUMN `twitter` VARCHAR(255) NULL,
    ADD COLUMN `website` VARCHAR(255) NULL,
    ADD COLUMN `youtube` VARCHAR(255) NULL;
