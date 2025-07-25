// server/routes/FileRoutes.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// 📁 ตั้งค่าเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/files/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ อัปโหลดไฟล์ทั่วไป (pdf, zip, docx, etc.)
router.post("/upload", upload.single("file"), (req, res) => {
  const { from, to } = req.body;
  const fileUrl = `/uploads/files/${req.file.filename}`;

  res.status(201).json({
    message: fileUrl,
    from,
    to,
    type: "file",
    originalName: req.file.originalname,
  });
});

export default router;
