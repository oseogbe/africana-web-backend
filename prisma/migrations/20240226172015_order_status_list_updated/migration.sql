/*
  Warnings:

  - The values [Shipping] on the enum `Order_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Order` MODIFY `status` ENUM('Pending', 'Completed', 'Shipped', 'Delivered') NOT NULL DEFAULT 'Pending';
