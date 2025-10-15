// prismaClient.js
// ไฟล์นี้สร้าง Prisma Client instance แบบ singleton
// เพื่อให้ทุกไฟล์ที่ import ใช้ instance เดียวกัน

import { PrismaClient } from "@prisma/client";

let prismaInstance = null;

function getPrismaInstance() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

const prisma = getPrismaInstance();
export default prisma;
