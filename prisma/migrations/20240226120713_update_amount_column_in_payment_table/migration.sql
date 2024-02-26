/*
  Warnings:

  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(12,1)`.

*/
-- AlterTable
ALTER TABLE `Payment` MODIFY `amount` DECIMAL(12, 1) NOT NULL;
