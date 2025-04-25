import express from "express";
import { addImageMessage, addMessage, getMessages } from "../controllers/MessageController.js";
import multer from "multer";

const router = express.Router();
const uploadImage = multer({ dest: "uploads/images/" });

// 📩 เส้นทางสำหรับเพิ่มข้อความ
router.post("/add-message", addMessage);

// 📩 เส้นทางสำหรับดึงข้อความ
router.get("/get-messages/:from/:to", getMessages);

// 📩 เส้นทางสำหรับอัปโหลดรูปภาพ
router.post("/add-image-message", uploadImage.single("image"), addImageMessage);

export default router;
