-- CreateTable
CREATE TABLE `mode_exercice` (
    `id` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `nomDesPlages` BOOLEAN NOT NULL DEFAULT false,
    `color` VARCHAR(191) NOT NULL DEFAULT '#3B82F6',
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mode_exercice_doctorId_idx`(`doctorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mode_exercice` ADD CONSTRAINT `mode_exercice_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
