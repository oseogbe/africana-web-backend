-- AlterTable
ALTER TABLE `Order` MODIFY `status` ENUM('Pending', 'Completed', 'Failed', 'Shipped', 'Delivered') NOT NULL DEFAULT 'Pending';
