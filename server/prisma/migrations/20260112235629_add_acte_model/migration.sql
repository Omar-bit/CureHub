/*
  Warnings:

  - Made the column `modeExerciceId` on table `doctor_consultation_types` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `doctor_consultation_types` DROP FOREIGN KEY `doctor_consultation_types_modeExerciceId_fkey`;

-- DropIndex
DROP INDEX `doctor_consultation_types_modeExerciceId_fkey` ON `doctor_consultation_types`;

-- AlterTable
ALTER TABLE `doctor_consultation_types` MODIFY `modeExerciceId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `actes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `displayedElsewhere` VARCHAR(191) NULL,
    `color` VARCHAR(191) NOT NULL,
    `regularPrice` DOUBLE NULL,
    `duration` INTEGER NOT NULL,
    `placementDuration` INTEGER NOT NULL,
    `minReservationGap` INTEGER NOT NULL,
    `stopUntilNextAppt` INTEGER NOT NULL,
    `eligibilityRule` TEXT NULL,
    `blockReservationAfter` INTEGER NULL,
    `canals` VARCHAR(191) NOT NULL,
    `instructions` TEXT NULL,
    `reminderType` VARCHAR(191) NULL,
    `reminderMessage` TEXT NULL,
    `notifyConfirmation` BOOLEAN NOT NULL DEFAULT true,
    `notifyReminder` BOOLEAN NOT NULL DEFAULT true,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,

    INDEX `actes_doctorId_idx`(`doctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `acte_consultation_types` (
    `id` VARCHAR(191) NOT NULL,
    `acteId` VARCHAR(191) NOT NULL,
    `consultationTypeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `acte_consultation_types_acteId_consultationTypeId_key`(`acteId`, `consultationTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `doctor_consultation_types` ADD CONSTRAINT `doctor_consultation_types_modeExerciceId_fkey` FOREIGN KEY (`modeExerciceId`) REFERENCES `mode_exercice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actes` ADD CONSTRAINT `actes_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acte_consultation_types` ADD CONSTRAINT `acte_consultation_types_acteId_fkey` FOREIGN KEY (`acteId`) REFERENCES `actes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acte_consultation_types` ADD CONSTRAINT `acte_consultation_types_consultationTypeId_fkey` FOREIGN KEY (`consultationTypeId`) REFERENCES `doctor_consultation_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
