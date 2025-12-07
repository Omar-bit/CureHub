-- Add identifier related fields to doctor profiles
ALTER TABLE `doctor_profiles`
    ADD COLUMN `professionalStatus` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `dateOfBirth` DATE NULL,
    ADD COLUMN `confidentialCode` VARCHAR(191) NULL;
