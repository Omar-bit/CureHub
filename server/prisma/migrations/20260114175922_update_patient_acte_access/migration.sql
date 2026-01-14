/*
  Warnings:

  - You are about to drop the `patient_consultation_type_access` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `patient_consultation_type_access` DROP FOREIGN KEY `patient_consultation_type_access_consultationTypeId_fkey`;

-- DropForeignKey
ALTER TABLE `patient_consultation_type_access` DROP FOREIGN KEY `patient_consultation_type_access_patientId_fkey`;

-- DropTable
DROP TABLE `patient_consultation_type_access`;

-- CreateTable
CREATE TABLE `patient_acte_access` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `acteId` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `patient_acte_access_patientId_acteId_key`(`patientId`, `acteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patient_acte_access` ADD CONSTRAINT `patient_acte_access_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_acte_access` ADD CONSTRAINT `patient_acte_access_acteId_fkey` FOREIGN KEY (`acteId`) REFERENCES `actes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
