/*
  Warnings:

  - You are about to alter the column `emailVerifiedAt` on the `Customer` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.

*/
-- AlterTable
ALTER TABLE `Customer` MODIFY `emailVerifiedAt` DATETIME(3) NULL;
