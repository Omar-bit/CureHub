-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `notifyConfirmation` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyRappel` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `rappelMessage` TEXT NULL;
