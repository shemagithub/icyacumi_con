-- AlterTable
ALTER TABLE `Product` ADD COLUMN `credits` JSON NULL;
ALTER TABLE `Event` ADD COLUMN `credits` JSON NULL;
ALTER TABLE `Ad` ADD COLUMN `credits` JSON NULL;

UPDATE `Product` SET `credits` = JSON_ARRAY() WHERE `credits` IS NULL;
UPDATE `Event` SET `credits` = JSON_ARRAY() WHERE `credits` IS NULL;
UPDATE `Ad` SET `credits` = JSON_ARRAY() WHERE `credits` IS NULL;
