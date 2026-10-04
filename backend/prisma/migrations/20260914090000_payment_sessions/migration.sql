-- CreateTable
CREATE TABLE `PaymentSession` (
    `id` VARCHAR(191) NOT NULL,
    `customerRef` VARCHAR(80) NOT NULL,
    `refid` VARCHAR(80) NULL,
    `tid` VARCHAR(80) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `pmethod` VARCHAR(20) NOT NULL,
    `paymentMethod` VARCHAR(20) NOT NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'RWF',
    `payload` JSON NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `errorMessage` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentSession_customerRef_key`(`customerRef`),
    UNIQUE INDEX `PaymentSession_refid_key`(`refid`),
    INDEX `PaymentSession_status_idx`(`status`),
    INDEX `PaymentSession_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PaymentSession` COMMENT = 'XentriPay collection sessions (MoMo / card) before an order is paid';
