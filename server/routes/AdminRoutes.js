import express from "express";
import { isAuthenticated, isAdmin } from "../middlewares/AuthMiddleware.js";
import {
  getAllUsers,
  updateUserRole,
  createAnnouncement,
  createGroupByAdmin,
} from "../controllers/AdminController.js";

const router = express.Router();

// ✅ ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะ admin)
router.get("/users", isAuthenticated, isAdmin, getAllUsers);

// ✅ เปลี่ยน role ของผู้ใช้
router.put("/users/:id/role", isAuthenticated, isAdmin, updateUserRole);

// ✅ สร้างประกาศ (broadcast message)
router.post("/announcement", isAuthenticated, isAdmin, createAnnouncement);

// ✅ สร้างกลุ่มโดย admin
router.post("/groups", isAuthenticated, isAdmin, createGroupByAdmin);

export default router;
