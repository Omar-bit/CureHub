/*
  Warnings:

  - A unique constraint covering the columns `[doctorId,dayOfWeek,specificDate]` on the table `doctor_timeplans` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `doctor_timeplans` ADD COLUMN `specificDate` DATE NULL;

-- CreateIndex
CREATE UNIQUE INDEX `doctor_timeplans_doctorId_dayOfWeek_specificDate_key` ON `doctor_timeplans`(`doctorId`, `dayOfWeek`, `specificDate`);

-- Drop old index (after new one is created)
ALTER TABLE `doctor_timeplans` DROP INDEX `doctor_timeplans_doctorId_dayOfWeek_key`;
