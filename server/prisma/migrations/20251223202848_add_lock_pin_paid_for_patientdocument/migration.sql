-- AlterTable
ALTER TABLE `patient_documents` ADD COLUMN `locked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pinned` BOOLEAN NOT NULL DEFAULT false;
