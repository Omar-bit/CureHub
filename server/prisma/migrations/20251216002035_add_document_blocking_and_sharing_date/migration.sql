-- AlterTable
ALTER TABLE `appointment_documents` ADD COLUMN `blockClientDownload` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `shareUntilDate` DATETIME(3) NULL;
