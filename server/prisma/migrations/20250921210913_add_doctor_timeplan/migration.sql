-- CreateTable
CREATE TABLE `doctor_timeplans` (
    `id` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `dayOfWeek` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `doctor_timeplans_doctorId_dayOfWeek_key`(`doctorId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_time_slots` (
    `id` VARCHAR(191) NOT NULL,
    `timeplanId` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_slot_consultation_types` (
    `id` VARCHAR(191) NOT NULL,
    `timeSlotId` VARCHAR(191) NOT NULL,
    `consultationTypeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `time_slot_consultation_types_timeSlotId_consultationTypeId_key`(`timeSlotId`, `consultationTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `doctor_timeplans` ADD CONSTRAINT `doctor_timeplans_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_time_slots` ADD CONSTRAINT `doctor_time_slots_timeplanId_fkey` FOREIGN KEY (`timeplanId`) REFERENCES `doctor_timeplans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_slot_consultation_types` ADD CONSTRAINT `time_slot_consultation_types_timeSlotId_fkey` FOREIGN KEY (`timeSlotId`) REFERENCES `doctor_time_slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_slot_consultation_types` ADD CONSTRAINT `time_slot_consultation_types_consultationTypeId_fkey` FOREIGN KEY (`consultationTypeId`) REFERENCES `doctor_consultation_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
