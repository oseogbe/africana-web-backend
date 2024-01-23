/*
  Warnings:

  - You are about to drop the column `exchange_rate` on the `Currency` table. All the data in the column will be lost.
  - Added the required column `exchangeRate` to the `Currency` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Currency` DROP COLUMN `exchange_rate`,
    ADD COLUMN `exchangeRate` DECIMAL(6, 4) NOT NULL;
