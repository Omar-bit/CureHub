/*
  Warnings:

  - You are about to drop the column `appointmentReminders` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `bookingAdvanceDays` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `bookingEnabled` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `bufferTime` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `clinicName` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `consultationDuration` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `emailNotifications` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `enableLocalConsultation` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `enableOnlineConsultation` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `enableOnsiteConsultation` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `licenseNumber` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `localConsultationPrice` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `onlineConsultationPrice` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `onsiteConsultationPrice` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `smsNotifications` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `timeZone` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `websiteBranding` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `websiteSlug` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `workingHours` on the `doctor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `yearsOfExperience` on the `doctor_profiles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `doctor_profiles_websiteSlug_key` ON `doctor_profiles`;

-- AlterTable
ALTER TABLE `doctor_profiles` DROP COLUMN `appointmentReminders`,
    DROP COLUMN `bookingAdvanceDays`,
    DROP COLUMN `bookingEnabled`,
    DROP COLUMN `bufferTime`,
    DROP COLUMN `clinicName`,
    DROP COLUMN `consultationDuration`,
    DROP COLUMN `currency`,
    DROP COLUMN `emailNotifications`,
    DROP COLUMN `enableLocalConsultation`,
    DROP COLUMN `enableOnlineConsultation`,
    DROP COLUMN `enableOnsiteConsultation`,
    DROP COLUMN `languages`,
    DROP COLUMN `licenseNumber`,
    DROP COLUMN `localConsultationPrice`,
    DROP COLUMN `onlineConsultationPrice`,
    DROP COLUMN `onsiteConsultationPrice`,
    DROP COLUMN `smsNotifications`,
    DROP COLUMN `timeZone`,
    DROP COLUMN `websiteBranding`,
    DROP COLUMN `websiteSlug`,
    DROP COLUMN `workingHours`,
    DROP COLUMN `yearsOfExperience`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `language` VARCHAR(191) NOT NULL DEFAULT 'en';
