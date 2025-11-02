import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import prisma from "../utils/PrismaClient.js";

const router = express.Router();

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


   //📌 Upload File + Emit Realtime
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
        console.log("📩 รับ request upload เข้ามาแล้ว");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    const { from, to, groupId } = req.body;

    if (!req.file || !from || (!to && !groupId)) {
      return res.status(400).json({ error: "Missing required fields or file" });
    }

    // ✅ เก็บเป็น relative path
    const fileUrl = `/uploads/files/${req.file.filename}`;

    // ✅ บันทึก DB
    const newMessage = await prisma.message.create({
      data: {
        senderId: parseInt(from),
        receiverId: to ? parseInt(to) : null,
        groupId: groupId ? parseInt(groupId) : null,
        type: "file",
        message: req.file.originalname,
        fileUrl,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });

    console.log("✅ บันทึก DB สำเร็จ:", newMessage);

    // ✅ ทำ absolute url สำหรับส่งกลับ
    const staticUrl = `${req.protocol}://${req.get("host")}`;
    const responseMessage = {
      ...newMessage,
      absoluteUrl: `${staticUrl}${newMessage.fileUrl}`,
    };

    // 📡 Emit Realtime via Socket.io
    const io = req.app.get("io");

    if (to) {
      const sendUserSocket = global.onlineUsers.get(parseInt(to));
      if (sendUserSocket) {
        io.to(sendUserSocket).emit("msg-receive", { message: responseMessage });
      }
      // also emit back to sender
      const senderSocket = global.onlineUsers.get(parseInt(from));
      if (senderSocket) io.to(senderSocket).emit("msg-receive", { message: responseMessage });
    }

    if (groupId) {
      try {
        io.to(`group_${groupId}`).emit("group-message-receive", { message: responseMessage });
      } catch (err) {
        console.warn("Could not emit group file message:", err);
      }
    }

    // ส่งกลับไปหา client ที่ upload เอง
    res.status(201).json(responseMessage);
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

export default router;
