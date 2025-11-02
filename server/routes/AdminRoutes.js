import express from "express";
import { isAuthenticated, isAdmin } from "../middlewares/AuthMiddleware.js";
import {
  getAllUsers,
  updateUserRole,
  createAnnouncement,
  createGroupByAdmin,
  createUserByAdmin,
} from "../controllers/AdminController.js";

const router = express.Router();

//  ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะ admin)
router.get("/users", isAuthenticated, isAdmin, getAllUsers);

//  สร้างผู้ใช้ใหม่โดย Admin
router.post("/users", isAuthenticated, isAdmin, createUserByAdmin);

//  เปลี่ยน role ของผู้ใช้
router.put("/users/:id/role", isAuthenticated, isAdmin, updateUserRole);

//  สร้างประกาศ (broadcast message)
router.post("/announcement", isAuthenticated, isAdmin, createAnnouncement);

//  สร้างกลุ่มโดย admin
router.post("/groups", isAuthenticated, isAdmin, createGroupByAdmin);

export default router;
