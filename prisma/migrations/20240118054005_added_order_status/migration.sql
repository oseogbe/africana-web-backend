-- AlterTable
ALTER TABLE `Order` ADD COLUMN `status` ENUM('Pending', 'Shipping', 'Delivered') NOT NULL DEFAULT 'Pending';
