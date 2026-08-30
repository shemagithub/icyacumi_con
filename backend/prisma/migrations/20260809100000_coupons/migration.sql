-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `type` VARCHAR(40) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,
    `minSubtotal` INTEGER NOT NULL DEFAULT 0,
    `maxDiscount` INTEGER NULL,
    `maxUses` INTEGER NULL,
    `usesCount` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `discount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `couponCode` VARCHAR(40) NULL,
    ADD COLUMN `couponId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Order_couponCode_idx` ON `Order`(`couponCode`);
