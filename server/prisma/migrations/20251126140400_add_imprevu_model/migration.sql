-- CreateTable
CREATE TABLE `imprevus` (
    `id` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `notifyPatients` BOOLEAN NOT NULL DEFAULT true,
    `blockTimeSlots` BOOLEAN NOT NULL DEFAULT true,
    `reason` TEXT NULL,
    `message` TEXT NULL,
    `cancelledAppointmentsCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `imprevus_doctorId_idx`(`doctorId`),
    INDEX `imprevus_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `imprevus` ADD CONSTRAINT `imprevus_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
