-- CreateTable
CREATE TABLE `patient_consultation_type_access` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `consultationTypeId` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `patient_consultation_type_access_patientId_consultationTypeI_key`(`patientId`, `consultationTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patient_consultation_type_access` ADD CONSTRAINT `patient_consultation_type_access_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_consultation_type_access` ADD CONSTRAINT `patient_consultation_type_access_consultationTypeId_fkey` FOREIGN KEY (`consultationTypeId`) REFERENCES `doctor_consultation_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
