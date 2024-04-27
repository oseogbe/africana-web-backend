/*
  Warnings:

  - You are about to alter the column `exchangeRate` on the `Currency` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(6,2)`.

*/
-- AlterTable
ALTER TABLE `Currency` MODIFY `exchangeRate` DECIMAL(6, 2) NOT NULL;
