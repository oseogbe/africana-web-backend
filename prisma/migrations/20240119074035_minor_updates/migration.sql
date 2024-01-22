/*
  Warnings:

  - You are about to drop the column `stats` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Currency` MODIFY `isDefault` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `stats`,
    ADD COLUMN `rating` DECIMAL(65, 30) NULL;
