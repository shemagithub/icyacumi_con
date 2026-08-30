-- AlterTable
ALTER TABLE `BrandUser` ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Client` ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `EmailCode` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `codeHash` VARCHAR(255) NOT NULL,
    `purpose` VARCHAR(40) NOT NULL,
    `account` VARCHAR(40) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailCode_email_purpose_idx`(`email`, `purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
