-- CreateTable
CREATE TABLE `appointment_documents` (
    `id` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `category` ENUM('PHARMACIE', 'BIOLOGIE', 'RADIOLOGIE', 'OPTIQUE', 'MATERIEL', 'AUTRE', 'COMPTES_RENDUS', 'IMAGERIE', 'OPERATION', 'CONSULTATION', 'HOSPITALISATION', 'SOINS_PARAMEDICAUX', 'KINE', 'INFIRMIER', 'PODOLOGUE', 'ORTHOPTISTE', 'ORTHOPHONISTE', 'ADMINISTRATIF', 'COURRIER', 'CERTIFICAT', 'HONORAIRES', 'CONSENTEMENT', 'ASSURANCE', 'DEVIS') NOT NULL DEFAULT 'AUTRE',
    `description` VARCHAR(191) NULL,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `appointmentId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `appointment_documents` ADD CONSTRAINT `appointment_documents_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment_documents` ADD CONSTRAINT `appointment_documents_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `doctor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
