/*
  Warnings:

  - You are about to drop the column `visitors` on the `ProductView` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ProductView` DROP COLUMN `visitors`;

-- CreateTable
CREATE TABLE `Visitor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productViewId` INTEGER NOT NULL,
    `visitor` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Visitor` ADD CONSTRAINT `Visitor_productViewId_fkey` FOREIGN KEY (`productViewId`) REFERENCES `ProductView`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
