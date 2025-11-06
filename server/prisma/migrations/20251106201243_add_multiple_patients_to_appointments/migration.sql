/*
  Warnings:

  - You are about to drop the `appointment_patients` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `appointment_patients` DROP FOREIGN KEY `appointment_patients_appointmentId_fkey`;

-- DropForeignKey
ALTER TABLE `appointment_patients` DROP FOREIGN KEY `appointment_patients_patientId_fkey`;

-- DropTable
DROP TABLE `appointment_patients`;
