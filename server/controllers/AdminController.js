import prisma from "../utils/PrismaClient.js";
import bcrypt from "bcrypt";

/**
 * 🧩 ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะ Admin เท่านั้น)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        about: true,
      },
      orderBy: { id: "asc" },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ [AdminController] getAllUsers:", error);
    res.status(500).json({ error: "ไม่สามารถดึงรายชื่อผู้ใช้ได้" });
  }
};

/**
 * 🛠 เปลี่ยน role ของผู้ใช้ + broadcast เรียลไทม์ผ่าน Socket.IO
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // ✅ ตรวจสอบ role ให้ถูกต้อง
    if (!["employee", "admin", "manager"].includes(role)) {
      return res.status(400).json({ error: "role ไม่ถูกต้อง" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    // ✅ Broadcast event เรียลไทม์
    const io = req.app.get("io");
    if (io) {
      io.emit("role-updated", {
        id: updatedUser.id,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      });
      console.log(
        `⚡ [Socket.IO] role-updated -> user ${updatedUser.id} (${updatedUser.firstName}): ${updatedUser.role}`
      );
    }

    res.status(200).json({
      message: `อัปเดต role ของผู้ใช้เป็น ${role} สำเร็จ`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ [AdminController] updateUserRole:", error);
    res.status(500).json({ error: "ไม่สามารถอัปเดต role ผู้ใช้ได้" });
  }
};

/**
 * 📢 สร้างประกาศ (broadcast message)
 */
export const createAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.session.user?.id;

    if (!message || !senderId) {
      return res.status(400).json({ error: "กรุณาระบุข้อความประกาศ" });
    }

    const newAnnouncement = await prisma.message.create({
      data: {
        senderId,
        message,
        type: "text",
      },
    });

    // ✅ Broadcast ไปทุก client
    const io = req.app.get("io");
    if (io) {
      io.emit("announcement", newAnnouncement);
      console.log("📢 ประกาศใหม่ broadcast:", message);
    }

    res.status(201).json({
      message: "ประกาศสำเร็จ",
      announcement: newAnnouncement,
    });
  } catch (error) {
    console.error("❌ [AdminController] createAnnouncement:", error);
    res.status(500).json({ error: "ไม่สามารถสร้างประกาศได้" });
  }
};

/**
 * 👥 สร้างกลุ่มโดยผู้ใช้ที่เป็น Admin หรือ Manager เท่านั้น
 */
export const createGroupByAdmin = async (req, res) => {
  try {
    const { name, about, memberIds } = req.body;
    const creatorRole = req.session.user?.role;
    const creatorId = req.session.user?.id;

    // ✅ ตรวจสอบสิทธิ์ก่อนสร้างกลุ่ม
    if (!["admin", "manager", "employee"].includes(creatorRole)) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์สร้างกลุ่ม" });
    }

    if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: "กรุณาระบุชื่อกลุ่มและสมาชิกอย่างน้อยหนึ่งคน" });
    }

    if (!memberIds.includes(creatorId)) {
      memberIds.push(creatorId);
    }

    const newGroup = await prisma.group.create({
      data: {
        name,
        about: about || null,
        members: {
          create: memberIds.map((userId) => ({ userId: Number(userId) })),
        },
      },
      include: { members: { include: { user: true } } },
    });

    console.log(`✅ [AdminController] ${creatorRole} สร้างกลุ่ม "${name}" สำเร็จ`);

    // ✅ แจ้ง event สร้างกลุ่มใหม่แบบเรียลไทม์
    const io = req.app.get("io");
    if (io) io.emit("group-created", newGroup);

    res.status(201).json({
      message: `สร้างกลุ่ม ${name} สำเร็จ`,
      group: newGroup,
    });
  } catch (error) {
    console.error("❌ [AdminController] createGroupByAdmin:", error);
    res.status(500).json({ error: "ไม่สามารถสร้างกลุ่มได้" });
  }
};

/**
 * 👤 สร้างผู้ใช้โดย Admin
 */
export const createUserByAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = "employee", about = "", profilePicture = "/default-avatar.png" } = req.body;

    // validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "กรอกข้อมูลให้ครบถ้วน" });
    }

    const exist = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (exist) return res.status(409).json({ error: "อีเมลนี้ถูกใช้งานแล้ว" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashed,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        about,
        profilePicture,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        about: true,
        profilePicture: true,
        role: true,
      },
    });

    // broadcast event
    const io = req.app.get("io");
    if (io) io.emit("user-created", newUser);

    return res.status(201).json({ message: "สร้างผู้ใช้สำเร็จ", user: newUser });
  } catch (err) {
    console.error("❌ createUserByAdmin error:", err);
    return res.status(500).json({ error: "สร้างผู้ใช้ไม่สำเร็จ" });
  }
};
