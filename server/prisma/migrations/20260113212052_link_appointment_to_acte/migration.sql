-- DropForeignKey
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_consultationTypeId_fkey`;

-- DropIndex
DROP INDEX `appointments_consultationTypeId_fkey` ON `appointments`;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_consultationTypeId_fkey` FOREIGN KEY (`consultationTypeId`) REFERENCES `actes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
