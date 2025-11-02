import express from "express";
import { getGroupMessages, getGroupNotes, addGroupNote } from "../controllers/MessageController.js";
import prisma from "../utils/PrismaClient.js";
import { upload, uploadGroupFile, getGroupFiles } from "../controllers/GroupFileController.js";
import { isAuthenticated } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// ✅ สร้างกลุ่มใหม่ (จำกัดเฉพาะ admin/manager)
router.post("/create", isAuthenticated, async (req, res) => {
  try {
    console.log("📦 กลุ่มที่รับจาก client:", req.body);
    const { name, about, members } = req.body;

    // ตรวจสิทธิ์: ต้องเป็น admin หรือ manager
    const role = req.session?.user?.role;
    if (!role || !["admin", "manager"].includes(role)) {
      return res.status(403).json({ error: "ห้าม: เฉพาะ admin/manager เท่านั้น" });
    }

    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "ชื่อกลุ่มและสมาชิกต้องระบุ" });
    }

    const group = await prisma.group.create({
      data: {
        name,
        about: about || null,
        members: {
          create: members.map((userId) => ({ userId: Number(userId) })),
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });

    console.log("✅ สร้างกลุ่มสำเร็จ:", group.name);
    res.json(group);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการสร้างกลุ่ม:", error);
    res.status(500).json({ error: "สร้างกลุ่มไม่สำเร็จ" });
  }
});

// ✅ ดึงข้อความในกลุ่มทั้งหมด
router.get("/get-group-messages/:groupId", getGroupMessages);

// ✅ ดึงโน้ตของกลุ่ม (notes stored as messages with type = 'note')
router.get("/:groupId/notes", isAuthenticated, getGroupNotes);

// ✅ เพิ่มโน้ตในกลุ่ม (เฉพาะ admin)
router.post("/:groupId/notes", isAuthenticated, addGroupNote);

// ✅ ดึงรายการกลุ่มทั้งหมด
router.get("/", async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: { members: { include: { user: true } } },
    });
    res.json(groups);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงกลุ่ม:", error);
    res.status(500).json({ error: "ดึงข้อมูลกลุ่มไม่สำเร็จ" });
  }
});

// ✅ เข้าร่วมกลุ่ม
router.post("/:groupId/join", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const existing = await prisma.groupMember.findFirst({
      where: { groupId: Number(groupId), userId: Number(userId) },
    });
    if (existing) return res.json({ message: "คุณเป็นสมาชิกอยู่แล้ว" });

    const newMember = await prisma.groupMember.create({
      data: { groupId: Number(groupId), userId: Number(userId) },
    });

    res.json(newMember);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการเข้าร่วมกลุ่ม:", error);
    res.status(500).json({ error: "เข้าร่วมกลุ่มไม่สำเร็จ" });
  }
});

// ✅ ออกจากกลุ่ม
router.post("/:groupId/leave", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    await prisma.groupMember.deleteMany({
      where: { groupId: Number(groupId), userId: Number(userId) },
    });

    res.json({ message: "ออกจากกลุ่มเรียบร้อย" });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการออกจากกลุ่ม:", error);
    res.status(500).json({ error: "ออกจากกลุ่มไม่สำเร็จ" });
  }
});

// ✅ ดึงข้อความในกลุ่ม
router.get("/:groupId/messages", async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await prisma.message.findMany({
      where: { groupId: Number(groupId) },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงข้อความกลุ่ม:", error);
    res.status(500).json({ error: "ไม่สามารถดึงข้อความกลุ่มได้" });
  }
});

// 📤 ฝากไฟล์ในกลุ่ม
router.post("/:groupId/files", isAuthenticated, upload.single("file"), uploadGroupFile);

// 📥 ดูไฟล์ทั้งหมดในกลุ่ม
router.get("/:groupId/files", isAuthenticated, getGroupFiles);
export default router;
