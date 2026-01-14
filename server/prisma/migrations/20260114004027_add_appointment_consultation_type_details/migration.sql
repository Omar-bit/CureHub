-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `consultationTypeDetailsId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_consultationTypeDetailsId_fkey` FOREIGN KEY (`consultationTypeDetailsId`) REFERENCES `doctor_consultation_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
