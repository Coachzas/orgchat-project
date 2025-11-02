import prisma from "../utils/PrismaClient.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/group-files";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });

// 📤 ฝากไฟล์เข้ากลุ่ม
export const uploadGroupFile = async (req, res) => {
  try {
    const { groupId } = req.params;
    const uploaderId = req.session.user?.id;
    const uploaderRole = req.session.user?.role;
    const note = req.body.note || "";

    // จำกัดสิทธิ์ฝากไฟล์ในกลุ่ม: admin และ manager เท่านั้น
    if (!uploaderRole || !["admin", "manager"].includes(uploaderRole)) {
      return res.status(403).json({ error: "ห้าม: เฉพาะ admin/manager เท่านั้นในการฝากไฟล์" });
    }

    if (!req.file) return res.status(400).json({ error: "กรุณาเลือกไฟล์ก่อนอัปโหลด" });
    if (!groupId) return res.status(400).json({ error: "ไม่พบ groupId" });

    const fileUrl = `/uploads/group-files/${req.file.filename}`;
    const newFile = await prisma.groupFile.create({
      data: {
        groupId: Number(groupId),
        uploaderId: Number(uploaderId),
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        note,
      },
    });

    res.status(201).json({ message: "อัปโหลดไฟล์สำเร็จ", file: newFile });
  } catch (error) {
    console.error("uploadGroupFile error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" });
  }
};

// 📥 ดึงไฟล์ทั้งหมดในกลุ่ม
export const getGroupFiles = async (req, res) => {
  try {
    const { groupId } = req.params;
    const files = await prisma.groupFile.findMany({
      where: { groupId: Number(groupId) },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(files);
  } catch (error) {
    console.error("getGroupFiles error:", error);
    res.status(500).json({ error: "ไม่สามารถดึงไฟล์ได้" });
  }
};
