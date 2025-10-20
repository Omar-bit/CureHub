-- AlterTable
ALTER TABLE `patients` ADD COLUMN `canAddRelatives` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `canBookForRelatives` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `patient_relationships` (
    `id` VARCHAR(191) NOT NULL,
    `relationshipType` ENUM('FAMILY', 'OTHER') NOT NULL,
    `familyRelationship` ENUM('SON', 'DAUGHTER', 'FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'SPOUSE', 'GRANDFATHER', 'GRANDMOTHER', 'GRANDSON', 'GRANDDAUGHTER', 'UNCLE', 'AUNT', 'NEPHEW', 'NIECE', 'COUSIN') NULL,
    `customRelationship` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `mainPatientId` VARCHAR(191) NOT NULL,
    `relatedPatientId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `patient_relationships_mainPatientId_relatedPatientId_key`(`mainPatientId`, `relatedPatientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patient_relationships` ADD CONSTRAINT `patient_relationships_mainPatientId_fkey` FOREIGN KEY (`mainPatientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_relationships` ADD CONSTRAINT `patient_relationships_relatedPatientId_fkey` FOREIGN KEY (`relatedPatientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
