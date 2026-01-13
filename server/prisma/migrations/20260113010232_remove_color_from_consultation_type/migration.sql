/*
  Warnings:

  - You are about to drop the column `canBookBefore` on the `doctor_consultation_types` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `doctor_consultation_types` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `doctor_consultation_types` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `doctor_consultation_types` table. All the data in the column will be lost.
  - You are about to drop the column `restAfter` on the `doctor_consultation_types` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `doctor_consultation_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `doctor_consultation_types` DROP COLUMN `canBookBefore`,
    DROP COLUMN `color`,
    DROP COLUMN `duration`,
    DROP COLUMN `price`,
    DROP COLUMN `restAfter`,
    DROP COLUMN `type`;
