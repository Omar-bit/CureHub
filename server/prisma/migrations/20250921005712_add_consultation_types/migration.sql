-- CreateTable
CREATE TABLE `doctor_consultation_types` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `location` ENUM('ONSITE', 'ONLINE', 'ATHOME') NOT NULL,
    `duration` INTEGER NOT NULL,
    `restAfter` INTEGER NOT NULL,
    `type` ENUM('REGULAR', 'URGENT') NOT NULL,
    `canBookBefore` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `doctor_consultation_types` ADD CONSTRAINT `doctor_consultation_types_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
