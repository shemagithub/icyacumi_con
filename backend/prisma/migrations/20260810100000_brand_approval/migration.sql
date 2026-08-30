-- AlterTable
ALTER TABLE `Brand`
    ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    ADD COLUMN `applicationNote` VARCHAR(1000) NULL,
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedReason` VARCHAR(500) NULL;

-- Existing marketplace brands are already live
UPDATE `Brand` SET `status` = 'approved', `approvedAt` = COALESCE(`approvedAt`, `createdAt`) WHERE `status` = 'pending';
