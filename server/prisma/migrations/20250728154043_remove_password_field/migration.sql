/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Group" DROP COLUMN "createdBy";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password";
