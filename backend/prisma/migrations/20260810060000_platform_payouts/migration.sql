-- CreateTable
CREATE TABLE `PlatformPayout` (
    `id` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'RWF',
    `status` VARCHAR(40) NOT NULL DEFAULT 'paid',
    `method` VARCHAR(40) NULL,
    `destination` VARCHAR(120) NULL,
    `note` VARCHAR(500) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PlatformPayout_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
