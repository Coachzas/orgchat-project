import prisma from "../utils/PrismaClient.js";

/**
 * 🧩 ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะ Admin เท่านั้น)
 * รวมข้อมูลสำคัญ เช่น id, ชื่อ, email, role
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
 * 🛠 เปลี่ยน role ของผู้ใช้
 * เช่น เปลี่ยน user → admin หรือ admin → user
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // ✅ ตรวจสอบว่า role ที่ส่งมาอยู่ในระบบหรือไม่
    if (!["employee", "admin", "manager"].includes(role)) {
      return res.status(400).json({ error: "role ไม่ถูกต้อง" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

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
 * จะถูกส่งเป็น message แบบไม่มี receiverId หรือ groupId
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

    console.log("📢 ประกาศใหม่:", newAnnouncement.message);

    // (ถ้าคุณมีระบบ socket.io สามารถ emit ให้ทุก client ได้ที่นี่)
    const io = req.app.get("io");
    if (io) io.emit("announcement", newAnnouncement);

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

    if (!["admin", "manager", "employee"].includes(creatorRole)) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์สร้างกลุ่ม" });
    }

    if (!name || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: "กรุณาระบุชื่อกลุ่มและสมาชิกอย่างน้อยหนึ่งคน" });
    }

    // ✅ เพิ่ม creator (admin/manager) เข้าไปในรายชื่อสมาชิกด้วย
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
    res.status(201).json({
      message: `สร้างกลุ่ม ${name} สำเร็จ`,
      group: newGroup,
    });
  } catch (error) {
    console.error("❌ [AdminController] createGroupByAdmin:", error);
    res.status(500).json({ error: "ไม่สามารถสร้างกลุ่มได้" });
  }
};
