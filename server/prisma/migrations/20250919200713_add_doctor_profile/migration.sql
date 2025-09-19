-- CreateTable
CREATE TABLE `doctor_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `specialization` VARCHAR(191) NULL,
    `licenseNumber` VARCHAR(191) NULL,
    `yearsOfExperience` INTEGER NULL,
    `bio` TEXT NULL,
    `profileImageUrl` VARCHAR(191) NULL,
    `clinicName` VARCHAR(191) NULL,
    `clinicAddress` TEXT NULL,
    `clinicPhone` VARCHAR(191) NULL,
    `workingHours` JSON NULL,
    `timeZone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `consultationDuration` INTEGER NOT NULL DEFAULT 30,
    `bufferTime` INTEGER NOT NULL DEFAULT 10,
    `enableOnlineConsultation` BOOLEAN NOT NULL DEFAULT true,
    `enableOnsiteConsultation` BOOLEAN NOT NULL DEFAULT true,
    `enableLocalConsultation` BOOLEAN NOT NULL DEFAULT false,
    `onlineConsultationPrice` DECIMAL(10, 2) NULL,
    `onsiteConsultationPrice` DECIMAL(10, 2) NULL,
    `localConsultationPrice` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `websiteSlug` VARCHAR(191) NULL,
    `websiteBranding` JSON NULL,
    `bookingEnabled` BOOLEAN NOT NULL DEFAULT true,
    `bookingAdvanceDays` INTEGER NOT NULL DEFAULT 30,
    `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `smsNotifications` BOOLEAN NOT NULL DEFAULT false,
    `appointmentReminders` BOOLEAN NOT NULL DEFAULT true,
    `languages` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `doctor_profiles_userId_key`(`userId`),
    UNIQUE INDEX `doctor_profiles_websiteSlug_key`(`websiteSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `doctor_profiles` ADD CONSTRAINT `doctor_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
