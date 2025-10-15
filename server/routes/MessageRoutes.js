import express from "express";
import multer from "multer";
import {
  addMessage,
  getMessages,
  addImageMessage,
  addAudioMessage,
  getInitialContactswithMessages,
  addGroupMessage,
} from "../controllers/MessageController.js";

const router = express.Router();

// 📦 ตั้งค่า multer
const uploadImage = multer({ dest: "uploads/images/" });
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

// 💬 ส่งข้อความในกลุ่ม
router.post("/add-group-message", addGroupMessage);

export default router;
