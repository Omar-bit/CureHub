-- CreateTable
CREATE TABLE `agenda_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `doctorProfileId` VARCHAR(191) NOT NULL,
    `mainColor` VARCHAR(191) NOT NULL DEFAULT '#FFA500',
    `startHour` INTEGER NOT NULL DEFAULT 8,
    `endHour` INTEGER NOT NULL DEFAULT 20,
    `verticalZoom` DOUBLE NOT NULL DEFAULT 1.0,
    `schoolVacationZone` ENUM('A', 'B', 'C') NOT NULL DEFAULT 'C',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agenda_preferences_doctorProfileId_key`(`doctorProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agenda_preferences` ADD CONSTRAINT `agenda_preferences_doctorProfileId_fkey` FOREIGN KEY (`doctorProfileId`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
