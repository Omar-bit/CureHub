-- AlterTable
ALTER TABLE `users` ADD COLUMN `emailVerificationCode` VARCHAR(191) NULL,
    ADD COLUMN `emailVerificationExpiry` DATETIME(3) NULL,
    ADD COLUMN `isEmailVerified` BOOLEAN NOT NULL DEFAULT false;
