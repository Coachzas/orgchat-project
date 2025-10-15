/*
  Warnings:

  - You are about to drop the column `message` on the `Message` table. All the data in the column will be lost.
  - The `type` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `messageStatus` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'audio', 'video', 'file');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read');

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "message",
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "text" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'text',
DROP COLUMN "messageStatus",
ADD COLUMN     "messageStatus" "MessageStatus" NOT NULL DEFAULT 'sent';

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_groupId_createdAt_idx" ON "Message"("senderId", "receiverId", "groupId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
