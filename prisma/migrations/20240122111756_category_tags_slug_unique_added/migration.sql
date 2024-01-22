/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Category_name_key` ON `Category`;

-- DropIndex
DROP INDEX `Tag_name_key` ON `Tag`;

-- CreateIndex
CREATE UNIQUE INDEX `Category_slug_key` ON `Category`(`slug`);

-- CreateIndex
CREATE UNIQUE INDEX `Tag_slug_key` ON `Tag`(`slug`);
