-- CreateTable
CREATE TABLE `appointment_history` (
    `id` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATED', 'UPDATED', 'STATUS_CHANGED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'RESCHEDULED', 'PATIENT_ADDED', 'PATIENT_REMOVED', 'CONSULTATION_TYPE_CHANGED') NOT NULL,
    `description` VARCHAR(191) NULL,
    `changedFields` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `appointmentId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `performedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `appointment_history` ADD CONSTRAINT `appointment_history_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_history` ADD CONSTRAINT `appointment_history_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctor_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
