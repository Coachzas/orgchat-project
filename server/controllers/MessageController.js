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

// ✅ ตรวจสอบและสร้างโฟลเดอร์ `uploads/audios/` ถ้ายังไม่มี
const ensureAudioUploadsFolder = () => {
  const uploadDir = path.join("uploads", "audios");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

// ✅ ฟังก์ชันส่งข้อความปกติ (Text Message)
export const addMessage = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
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
    ensureUploadsFolder();

    if (!req.file) {
      return res.status(400).send("Image is required.");
    }

    const { from, to } = req.body;
    if (!from || !to) {
      return res.status(400).send("From and To are required.");
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join("uploads", "images", fileName);
    fs.renameSync(req.file.path, filePath);

    const imageUrl = `http://localhost:3005/uploads/images/${fileName}`;

    const prisma = getPrismaInstance();
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
    console.error("❌ Error saving image message:", err);
    next(err);
  }
};

// ✅ ฟังก์ชันอัปโหลดเสียงและส่งข้อความแบบ Audio Message
export const addAudioMessage = async (req, res, next) => {
  try {
    ensureAudioUploadsFolder();

    if (!req.file) {
      return res.status(400).send("Audio file is required.");
    }

    const { from, to } = req.body;
    if (!from || !to) {
      return res.status(400).send("From and To are required.");
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join("uploads", "audios", fileName);
    fs.renameSync(req.file.path, filePath);

    const audioUrl = `http://localhost:3005/uploads/audios/${fileName}`;

    const prisma = getPrismaInstance();
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
    console.error("❌ Error saving audio message:", err);
    next(err);
  }
};

export const getInitialContactswithMessages = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.from);
    const prisma = getPrismaInstance();

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

    const messages = [...user.sentMessages, ...user.receivedMessages];
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const users = new Map();
    const messagesStatusChange = [];

    messages.forEach((msg) => {
      const isSender = msg.senderId === userId;
      const calculatedId = isSender ? msg.receiverId : msg.senderId;

      if (msg.messageStatus === "sent") {
        messagesStatusChange.push(msg.id);
      }

      if (!users.get(calculatedId)) {
        const {
          id, type, message, messageStatus, createdAt, senderId, receiverId
        } = msg;

        let userObj = {
          messageId: id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          receiverId,
        };

        if (isSender) {
          userObj = { ...userObj, ...msg.receiver, totalUnreadMessages: 0 };
        } else {
          userObj = {
            ...userObj,
            ...msg.sender,
            totalUnreadMessages: messageStatus !== "read" ? 1 : 0,
          };
        }

        users.set(calculatedId, userObj);
      } else if (msg.messageStatus !== "read" && !isSender) {
        const existingUser = users.get(calculatedId);
        users.set(calculatedId, {
          ...existingUser,
          totalUnreadMessages: existingUser.totalUnreadMessages + 1,
        });
      }
    });

    // ✅ อัปเดตสถานะ messageStatus
    if (messagesStatusChange.length) {
      await prisma.message.updateMany({
        where: {
          id: { in: messagesStatusChange },
        },
        data: {
          messageStatus: "delivered",
        },
      });
    }

    // ✅ ส่งข้อมูลกลับเสมอ
    return res.status(200).json({
      users: Array.from(users.values()),
      onlineUsers: Array.from(onlineUsers.keys()),
    });

  } catch (err) {
    console.error("❌ getInitialContactswithMessages error:", err);
    next(err);
  }
};
