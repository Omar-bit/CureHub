/*
  Warnings:

  - You are about to drop the column `cabinetGender` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `cabinetName` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `clinicAddress` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `clinicAddress2` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `clinicCity` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `clinicPhone` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `clinicPostalCode` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `prmAccess` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `videoSurveillance` on the `doctor_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `doctor_profiles` DROP COLUMN `cabinetGender`,
    DROP COLUMN `cabinetName`,
    DROP COLUMN `clinicAddress`,
    DROP COLUMN `clinicAddress2`,
    DROP COLUMN `clinicCity`,
    DROP COLUMN `clinicPhone`,
    DROP COLUMN `clinicPostalCode`,
    DROP COLUMN `prmAccess`,
    DROP COLUMN `videoSurveillance`,
    MODIFY `diplomas` TEXT NULL,
    MODIFY `additionalDiplomas` TEXT NULL,
    MODIFY `publications` TEXT NULL,
    MODIFY `absenceMessage` TEXT NULL,
    MODIFY `tooManyAbsencesInfo` TEXT NULL;

-- CreateTable
CREATE TABLE `clinics` (
    `id` VARCHAR(191) NOT NULL,
    `doctorProfileId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `address2` TEXT NULL,
    `postalCode` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `prmAccess` BOOLEAN NOT NULL DEFAULT false,
    `videoSurveillance` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clinics_doctorProfileId_key`(`doctorProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clinics` ADD CONSTRAINT `clinics_doctorProfileId_fkey` FOREIGN KEY (`doctorProfileId`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `doctor_profiles` RENAME INDEX `rppsNumber` TO `doctor_profiles_rppsNumber_key`;

-- RenameIndex
ALTER TABLE `doctor_profiles` RENAME INDEX `sirenNumber` TO `doctor_profiles_sirenNumber_key`;
