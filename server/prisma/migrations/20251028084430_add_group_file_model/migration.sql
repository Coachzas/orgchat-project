-- CreateTable
CREATE TABLE "GroupFile" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "uploaderId" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupFile" ADD CONSTRAINT "GroupFile_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupFile" ADD CONSTRAINT "GroupFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
