-- AlterTable
ALTER TABLE `patients` ADD COLUMN `visitor` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `dateOfBirth` DATETIME(3) NULL;
