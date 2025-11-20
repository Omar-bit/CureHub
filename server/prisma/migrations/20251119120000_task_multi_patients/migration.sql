-- Create table for task-patient assignments
CREATE TABLE `task_patients` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `task_patients_taskId_patientId_key`(`taskId`, `patientId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `task_patients_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `task_patients_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill existing task to patient relationships
INSERT INTO `task_patients` (`id`, `taskId`, `patientId`, `createdAt`)
SELECT UUID(), `id`, `patientId`, NOW()
FROM `tasks`
WHERE `patientId` IS NOT NULL;

-- Drop the old single patient relationship from tasks
ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_patientId_fkey`;
ALTER TABLE `tasks` DROP COLUMN `patientId`;
