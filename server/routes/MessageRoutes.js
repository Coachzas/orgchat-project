import express from "express";
import multer from "multer";
import {
  addMessage,
  getMessages,
  addImageMessage,
  addAudioMessage,
  getInitialContactswithMessages,
} from "../controllers/MessageController.js";

const router = express.Router();

// 📦 ตั้งค่า multer สำหรับรูปภาพ
const uploadImage = multer({ dest: "uploads/images/" });

// 📦 ตั้งค่า multer สำหรับเสียง (ให้ตรงกับโฟลเดอร์ที่ MessageController.js ใช้)
const uploadAudio = multer({ dest: "uploads/audios/" });

// 📩 เพิ่มข้อความปกติ
router.post("/add-message", addMessage);

// 📩 ดึงข้อความทั้งหมดระหว่าง 2 คน
router.get("/get-messages/:from/:to", getMessages);

// 📷 เพิ่มข้อความแบบรูปภาพ
router.post("/add-image-message", uploadImage.single("image"), addImageMessage);

// 🎙 เพิ่มข้อความแบบเสียง
router.post("/add-audio-message", uploadAudio.single("audio"), addAudioMessage);

// 📞 ดึงรายการแชตเริ่มต้น
router.get("/get-initial-contacts/:from", getInitialContactswithMessages);

export default router;
