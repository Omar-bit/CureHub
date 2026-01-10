/*
  Warnings:

  - You are about to drop the column `location` on the `doctor_consultation_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `doctor_consultation_types` DROP COLUMN `location`,
    ADD COLUMN `modeExerciceId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `doctor_consultation_types` ADD CONSTRAINT `doctor_consultation_types_modeExerciceId_fkey` FOREIGN KEY (`modeExerciceId`) REFERENCES `mode_exercice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
