/*
  Warnings:

  - You are about to drop the column `count` on the `ProductView` table. All the data in the column will be lost.
  - Added the required column `visitors` to the `ProductView` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ProductView` DROP COLUMN `count`,
    ADD COLUMN `visitors` JSON NOT NULL;
