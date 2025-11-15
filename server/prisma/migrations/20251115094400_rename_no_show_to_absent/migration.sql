-- Step 1: Update existing NO_SHOW values to ABSENT
UPDATE `appointments` SET `status` = 'ABSENT' WHERE `status` = 'NO_SHOW';

-- Step 2: Modify the enum to replace NO_SHOW with ABSENT
ALTER TABLE `appointments` MODIFY `status` ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ABSENT') NOT NULL DEFAULT 'SCHEDULED';
