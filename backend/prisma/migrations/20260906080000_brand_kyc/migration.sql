-- AlterTable
ALTER TABLE `Brand` ADD COLUMN `kycIdDocument` LONGTEXT NULL,
    ADD COLUMN `kycRdbCertificate` LONGTEXT NULL,
    ADD COLUMN `kycSubmittedAt` DATETIME(3) NULL;
