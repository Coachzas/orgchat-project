-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "about" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profilePicture" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
