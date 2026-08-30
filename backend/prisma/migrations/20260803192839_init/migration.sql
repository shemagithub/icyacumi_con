-- CreateTable
CREATE TABLE `Brand` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `shortBio` VARCHAR(500) NOT NULL,
    `location` VARCHAR(120) NOT NULL,
    `icon` VARCHAR(40) NOT NULL,
    `stripeAccountId` VARCHAR(120) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Brand_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BrandUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `role` VARCHAR(40) NOT NULL DEFAULT 'owner',
    `brandId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BrandUser_email_key`(`email`),
    INDEX `BrandUser_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `tagline` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `price` INTEGER NOT NULL,
    `compareAtPrice` INTEGER NULL,
    `category` VARCHAR(60) NOT NULL,
    `collection` VARCHAR(60) NOT NULL,
    `colors` JSON NOT NULL,
    `sizes` JSON NOT NULL,
    `images` JSON NOT NULL,
    `fabric` VARCHAR(255) NOT NULL DEFAULT 'See brand',
    `fit` VARCHAR(255) NOT NULL DEFAULT 'True to size',
    `details` JSON NOT NULL,
    `badge` VARCHAR(60) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `inStock` BOOLEAN NOT NULL DEFAULT true,
    `views` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    INDEX `Product_brandId_idx`(`brandId`),
    INDEX `Product_views_idx`(`views`),
    INDEX `Product_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `summary` VARCHAR(500) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(20) NOT NULL,
    `venue` VARCHAR(200) NOT NULL,
    `city` VARCHAR(120) NOT NULL,
    `price` INTEGER NOT NULL,
    `capacity` INTEGER NOT NULL,
    `ticketsLeft` INTEGER NOT NULL,
    `imageSrc` VARCHAR(255) NOT NULL,
    `imageAlt` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Event_slug_key`(`slug`),
    INDEX `Event_brandId_idx`(`brandId`),
    INDEX `Event_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ad` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `type` VARCHAR(40) NOT NULL,
    `summary` VARCHAR(500) NOT NULL,
    `mediaSrc` VARCHAR(255) NOT NULL,
    `mediaAlt` VARCHAR(255) NOT NULL,
    `mediaUrl` VARCHAR(500) NULL,
    `ctaHref` VARCHAR(255) NOT NULL DEFAULT '/shop',
    `ctaLabel` VARCHAR(80) NOT NULL DEFAULT 'Shop now',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Ad_slug_key`(`slug`),
    INDEX `Ad_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payout` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `status` VARCHAR(40) NOT NULL DEFAULT 'pending',
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payout_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BrandUser` ADD CONSTRAINT `BrandUser_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ad` ADD CONSTRAINT `Ad_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
