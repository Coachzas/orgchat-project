import express from "express";
import { getGroupMessages, getGroupNotes, addGroupNote } from "../controllers/MessageController.js";
import prisma from "../utils/PrismaClient.js";
import { upload, uploadGroupFile, getGroupFiles } from "../controllers/GroupFileController.js";
import { isAuthenticated } from "../middlewares/AuthMiddleware.js";
import { getLatestGroupNote } from "../controllers/MessageController.js";

const router = express.Router();

//  สร้างกลุ่มใหม่ (เฉพาะ admin/manager)
router.post("/create", isAuthenticated, async (req, res) => {
  try {
    console.log("📦 กลุ่มที่รับจาก client:", req.body);
    const { name, about, members } = req.body;
    const creator = req.session?.user;

    //  ตรวจสิทธิ์: เฉพาะ admin หรือ manager เท่านั้น
    if (!creator || !["admin", "manager"].includes(creator.role)) {
      return res.status(403).json({ error: "อนุญาตเฉพาะ admin หรือ manager เท่านั้น" });
    }

    if (!name || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "ชื่อกลุ่มและสมาชิกต้องระบุ" });
    }

    //  เพิ่มคนสร้างกลุ่มเข้าเป็นสมาชิกด้วย
    const groupMembers = members.includes(creator.id)
      ? members
      : [...members, creator.id];

    const group = await prisma.group.create({
      data: {
        name,
        about: about || null,
        members: {
          create: groupMembers.map((userId) => ({ userId: Number(userId) })),
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });

    console.log(` ${creator.role} (${creator.id}) สร้างกลุ่ม: ${group.name}`);

    //  ส่ง event เรียลไทม์ให้ทุก client
    const io = req.app.get("io");
    if (io) io.emit("group-created", group);

    res.json(group);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการสร้างกลุ่ม:", error);
    res.status(500).json({ error: "สร้างกลุ่มไม่สำเร็จ" });
  }
});


//  ดึงข้อความในกลุ่มทั้งหมด
router.get("/get-group-messages/:groupId", getGroupMessages);

//  ดึงโน้ตของกลุ่ม (notes stored as messages with type = 'note')
router.get("/:groupId/notes", isAuthenticated, getGroupNotes);

//  เพิ่มโน้ตในกลุ่ม (เฉพาะ admin)
router.post("/:groupId/notes", isAuthenticated, addGroupNote);

//  ดึงรายการกลุ่มทั้งหมด
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

//  เข้าร่วมกลุ่ม
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

//  ออกจากกลุ่ม
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

//  ดึงข้อความในกลุ่ม
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

// ดึงโน้ตล่าสุดของกลุ่ม
router.get("/:groupId/latest-note", getLatestGroupNote);

// 🗑️ ลบกลุ่ม (เฉพาะ admin หรือ manager)
router.delete("/:groupId/delete", isAuthenticated, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userRole = req.session.user?.role;

    //  ตรวจสิทธิ์
    if (!["admin", "manager"].includes(userRole)) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบกลุ่มนี้" });
    }

    // ตรวจสอบว่ากลุ่มมีอยู่ไหม
    const existingGroup = await prisma.group.findUnique({
      where: { id: Number(groupId) },
    });

    if (!existingGroup) {
      return res.status(404).json({ error: "ไม่พบกลุ่มที่ต้องการลบ" });
    }

    //  ลบกลุ่ม (Prisma จะ cascade ลบ member, file, message ด้วย)
    await prisma.group.delete({
      where: { id: Number(groupId) },
    });

    // Broadcast event ให้ client ทั้งหมดอัปเดต
    const io = req.app.get("io");
    if (io) io.emit("group-deleted", { groupId: Number(groupId) });

    res.json({ message: "ลบกลุ่มสำเร็จ", groupId: Number(groupId) });
  } catch (error) {
    console.error("❌ ลบกลุ่มล้มเหลว:", error);
    res.status(500).json({ error: "ไม่สามารถลบกลุ่มได้" });
  }
});
export default router;
