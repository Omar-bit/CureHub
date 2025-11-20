-- Add new columns to doctor_profiles table for Profile Settings

ALTER TABLE `doctor_profiles` 
ADD COLUMN `rppsNumber` VARCHAR(191) NULL UNIQUE,
ADD COLUMN `sirenNumber` VARCHAR(191) NULL UNIQUE,
ADD COLUMN `languagesSpoken` VARCHAR(191) NULL,
ADD COLUMN `diplomas` LONGTEXT NULL,
ADD COLUMN `additionalDiplomas` LONGTEXT NULL,
ADD COLUMN `publications` LONGTEXT NULL,
ADD COLUMN `signature` VARCHAR(191) NULL,
ADD COLUMN `absenceMessage` LONGTEXT NULL,
ADD COLUMN `tooManyAbsencesInfo` LONGTEXT NULL,
ADD COLUMN `cabinetName` VARCHAR(191) NULL,
ADD COLUMN `cabinetGender` VARCHAR(191) NULL,
ADD COLUMN `clinicAddress2` LONGTEXT NULL,
ADD COLUMN `clinicPostalCode` VARCHAR(191) NULL,
ADD COLUMN `clinicCity` VARCHAR(191) NULL,
ADD COLUMN `prmAccess` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `videoSurveillance` BOOLEAN NOT NULL DEFAULT false;
