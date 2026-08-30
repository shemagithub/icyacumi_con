-- AlterTable
ALTER TABLE `Product` ADD COLUMN `stockQuantity` INTEGER NOT NULL DEFAULT 0;

-- Backfill existing catalog: in-stock items get a default inventory; sold-out stay at 0.
UPDATE `Product` SET `stockQuantity` = 25 WHERE `inStock` = true AND `stockQuantity` = 0;
UPDATE `Product` SET `inStock` = false WHERE `stockQuantity` = 0;
