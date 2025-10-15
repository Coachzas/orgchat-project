import fs from "fs";
import path from "path";
import prisma from "../utils/PrismaClient.js";

// ✅ ตรวจสอบและสร้างโฟลเดอร์อัปโหลด (ภาพ/เสียง)
const ensureUploadsFolder = () => {
  const uploadDir = path.join("uploads", "images");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
};
const ensureAudioUploadsFolder = () => {
  const uploadDir = path.join("uploads", "audios");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
};

// ✅ ฟังก์ชันส่งข้อความปกติ (1-1)
export const addMessage = async (req, res, next) => {
  try {
    const { message, from, to } = req.body;
    const getUser = onlineUsers?.get?.(to);

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
    console.error("❌ addMessage error:", err);
    next(err);
    return;
  }
};

// ✅ ดึงข้อความระหว่างผู้ใช้สองคน
export const getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.params;
    if (!from || !to) return res.status(400).json({ error: "Missing from/to" });

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
    console.error("❌ getMessages error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ ฟังก์ชันส่งข้อความแบบภาพ
export const addImageMessage = async (req, res, next) => {
  try {
    ensureUploadsFolder();
    if (!req.file) return res.status(400).send("Image is required.");

    const { from, to } = req.body;
    if (!from || !to) return res.status(400).send("From and To are required.");

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join("uploads", "images", fileName);
    fs.renameSync(req.file.path, filePath);

    const imageUrl = `http://localhost:3005/uploads/images/${fileName}`;
    const message = await prisma.message.create({
      data: {
        message: imageUrl,
        sender: { connect: { id: parseInt(from) } },
        receiver: { connect: { id: parseInt(to) } },
        type: "image",
      },
    });

    return res.status(201).json({ message: imageUrl });
  } catch (err) {
    console.error("❌ addImageMessage error:", err);
    next(err);
    return;
  }
};

// ✅ ฟังก์ชันส่งข้อความแบบเสียง
export const addAudioMessage = async (req, res, next) => {
  try {
    ensureAudioUploadsFolder();
    if (!req.file) return res.status(400).send("Audio file is required.");

    const { from, to } = req.body;
    if (!from || !to) return res.status(400).send("From and To are required.");

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join("uploads", "audios", fileName);
    fs.renameSync(req.file.path, filePath);

    const audioUrl = `http://localhost:3005/uploads/audios/${fileName}`;
    const message = await prisma.message.create({
      data: {
        message: audioUrl,
        sender: { connect: { id: parseInt(from) } },
        receiver: { connect: { id: parseInt(to) } },
        type: "audio",
      },
    });

    return res.status(201).json({ message: audioUrl });
  } catch (err) {
    console.error("❌ addAudioMessage error:", err);
    next(err);
    return;
  }
};

// ✅ ฟังก์ชันดึงรายชื่อผู้ติดต่อพร้อมข้อความล่าสุด
export const getInitialContactswithMessages = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.from);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sentMessages: {
          include: { receiver: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
        receivedMessages: {
          include: { receiver: true, sender: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const messages = [...user.sentMessages, ...user.receivedMessages];
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const users = new Map();
    const messagesStatusChange = [];

    messages.forEach((msg) => {
      const isSender = msg.senderId === userId;
      const targetId = isSender ? msg.receiverId : msg.senderId;

      if (msg.messageStatus === "sent") messagesStatusChange.push(msg.id);

      if (!users.get(targetId)) {
        const { id, type, message, messageStatus, createdAt, senderId, receiverId } = msg;
        let userObj = { messageId: id, type, message, messageStatus, createdAt, senderId, receiverId };

        if (isSender) {
          userObj = { ...userObj, ...msg.receiver, totalUnreadMessages: 0 };
        } else {
          userObj = {
            ...userObj,
            ...msg.sender,
            totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
          };
        }

        users.set(targetId, userObj);
      } else if (msg.messageStatus !== "read" && !isSender) {
        const existingUser = users.get(targetId);
        users.set(targetId, {
          ...existingUser,
          totalUnreadMessages: existingUser.totalUnreadMessages + 1,
        });
      }
    });

    if (messagesStatusChange.length) {
      await prisma.message.updateMany({
        where: { id: { in: messagesStatusChange } },
        data: { messageStatus: "delivered" },
      });
    }

    return res.status(200).json({
      users: Array.from(users.values()),
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  } catch (err) {
    console.error("❌ getInitialContactswithMessages error:", err);
    next(err);
    return;
  }
};

// ✅ ฟังก์ชันส่งข้อความในกลุ่ม
export const addGroupMessage = async (req, res, next) => {
  try {
    const { from, groupId, message, type } = req.body;
    if (!from || !groupId || !message)
      return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

    const newMessage = await prisma.message.create({
      data: {
        message,
        sender: { connect: { id: parseInt(from) } },
        group: { connect: { id: parseInt(groupId) } },
        type: type || "text",
      },
      include: { sender: true },
    });

    // ✅ ส่งข้อความ real-time ผ่าน socket
    if (global.chatSocket) {
      global.chatSocket.to(`group_${groupId}`).emit("group-message-receive", {
        message: newMessage,
      });
    }

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error("❌ addGroupMessage error:", err);
    next(err);
    return;
  }
};
