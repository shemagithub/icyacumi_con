CREATE TABLE `SharedCart` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(40) NOT NULL,
    `ownerClientId` VARCHAR(191) NULL,
    `ownerName` VARCHAR(120) NULL,
    `ownerEmail` VARCHAR(190) NULL,
    `message` VARCHAR(500) NULL,
    `lines` JSON NOT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'open',
    `expiresAt` DATETIME(3) NOT NULL,
    `paidOrderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SharedCart_token_key`(`token`),
    INDEX `SharedCart_ownerClientId_idx`(`ownerClientId`),
    INDEX `SharedCart_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(40) NOT NULL,
    `clientId` VARCHAR(191) NULL,
    `email` VARCHAR(190) NOT NULL,
    `customerName` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `shippingAddress` TEXT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'paid',
    `trackingCode` VARCHAR(80) NULL,
    `carrier` VARCHAR(80) NULL,
    `subtotal` INTEGER NOT NULL,
    `shipping` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'RWF',
    `stripeSessionId` VARCHAR(120) NULL,
    `sharedCartToken` VARCHAR(40) NULL,
    `notes` VARCHAR(500) NULL,
    `paidAt` DATETIME(3) NULL,
    `shippedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_reference_key`(`reference`),
    UNIQUE INDEX `Order_stripeSessionId_key`(`stripeSessionId`),
    INDEX `Order_clientId_idx`(`clientId`),
    INDEX `Order_email_idx`(`email`),
    INDEX `Order_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(80) NULL,
    `kind` VARCHAR(40) NOT NULL DEFAULT 'product',
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(160) NOT NULL,
    `size` VARCHAR(20) NOT NULL,
    `color` VARCHAR(80) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitAmount` INTEGER NOT NULL,
    `imageSrc` VARCHAR(255) NULL,
    `brandId` VARCHAR(80) NULL,
    `brandName` VARCHAR(160) NULL,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
