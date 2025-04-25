import fs from "fs";
import path from "path";
import getPrismaInstance from "../utils/PrismaClient.js";

// ✅ ตรวจสอบและสร้างโฟลเดอร์ `uploads/images/` ถ้ายังไม่มี
const ensureUploadsFolder = () => {
  const uploadDir = path.join("uploads", "images");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

// ✅ ฟังก์ชันส่งข้อความปกติ (Text Message)
export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { message, from, to } = req.body;
    const getUser = onlineUsers.get(to);

    if (message && from && to) {
      const newMessage = await prisma.message.create({
        data: {
          message,
          sender: { connect: { id: parseInt(from) } },
          receiver: { connect: { id: parseInt(to) } },
          messageStatus: getUser ? "delivered" : "sent",
        },
      });

      return res.status(201).send({ message: newMessage });
    }

    return res.status(400).send("From, to and message are required.");
  } catch (err) {
    next(err);
  }
};

// ✅ ฟังก์ชันดึงข้อความระหว่างผู้ใช้สองคน
export const getMessages = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    const { from, to } = req.params;

    if (!from || !to || isNaN(from) || isNaN(to)) {
      return res.status(400).json({ error: "Sender and Receiver ID required and must be numbers" });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: parseInt(from), receiverId: parseInt(to) },
          { senderId: parseInt(to), receiverId: parseInt(from) },
        ],
      },
      orderBy: { id: "asc" },
    });

    return res.status(200).json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ ฟังก์ชันอัปโหลดรูปภาพและส่งข้อความแบบ Image Message
export const addImageMessage = async (req, res, next) => {
  try {
    ensureUploadsFolder(); // ✅ ตรวจสอบและสร้างโฟลเดอร์ `uploads/images/` ถ้ายังไม่มี

    if (!req.file) {
      return res.status(400).send("Image is required.");
    }

    const { from, to } = req.body;
    if (!from || !to) {
      return res.status(400).send("From and To are required.");
    }

    // ✅ สร้างชื่อไฟล์ใหม่เพื่อป้องกันชื่อซ้ำ
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join("uploads", "images", fileName);
    
    // ✅ ย้ายไฟล์ไปยังโฟลเดอร์ `uploads/images/`
    fs.renameSync(req.file.path, filePath);

    // ✅ สร้าง URL เต็มของรูปภาพ
    const imageUrl = `http://localhost:3005/uploads/images/${fileName}`;

    // ✅ บันทึกข้อความลงฐานข้อมูล
    const prisma = getPrismaInstance();
    const message = await prisma.message.create({
      data: {
        message: imageUrl, // ✅ บันทึก URL เต็ม
        sender: { connect: { id: parseInt(from) } },
        receiver: { connect: { id: parseInt(to) } },
        type: "image",
      },
    });

    // ✅ ส่ง URL เต็มกลับไปให้ Frontend
    return res.status(201).json({ message: imageUrl });
  } catch (err) {
    console.error("❌ Error saving image message:", err);
    next(err);
  }
};
