import fs from "fs";
import path from "path";
import prisma from "../utils/PrismaClient.js";

//  ตรวจสอบและสร้างโฟลเดอร์อัปโหลด (ภาพ/เสียง)
const ensureUploadsFolder = () => {
  const uploadDir = path.join("uploads", "images");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
};
const ensureAudioUploadsFolder = () => {
  const uploadDir = path.join("uploads", "audios");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
};

//  ฟังก์ชันส่งข้อความปกติ (1-1)
export const addMessage = async (req, res, next) => {
  try {
    const { message, from, to } = req.body;
    console.log("🧾 addMessage payload:", req.body);
    const getUser = onlineUsers?.get?.(to);

    if (message && from && to) {
      const newMessage = await prisma.message.create({
        data: {
          message,
          sender: { connect: { id: parseInt(from) } },
          receiver: { connect: { id: parseInt(to) } },
          messageStatus: getUser ? "delivered" : "sent",
        },
        include: { sender: true },
      });
      // Prepare response with absolute fields if needed
      const responseMessage = { ...newMessage };

      // Emit via socket to recipient and sender so clients receive real-time update
      try {
        const io = req.app.get("io") || global.io;
        const sendUserSocket = global.onlineUsers.get(parseInt(to));
        if (sendUserSocket) io.to(sendUserSocket).emit("msg-receive", { message: responseMessage });
        const senderSocket = global.onlineUsers.get(parseInt(from));
        if (senderSocket) io.to(senderSocket).emit("msg-receive", { message: responseMessage });
      } catch (emitErr) {
        console.warn("Could not emit addMessage via socket:", emitErr);
      }

      return res.status(201).send({ message: responseMessage });
    }
    return res.status(400).send("From, to and message are required.");
  } catch (err) {
    console.error("❌ addMessage error:", err);
    next(err);
    return;
  }
};

//  ดึงข้อความระหว่างผู้ใช้สองคน
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

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await prisma.message.findMany({
      where: { groupId: parseInt(groupId) },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ [getGroupMessages] Error:", error);
    res.status(500).json({ error: "Failed to fetch group messages" });
  }
};

// ---------- NEW: Group Notes (store as message.type = 'note') ----------
export const getGroupNotes = async (req, res) => {
  try {
    const { groupId } = req.params;
    const notes = await prisma.message.findMany({
      where: { groupId: parseInt(groupId), type: "note" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(notes);
  } catch (error) {
    console.error("❌ [getGroupNotes] Error:", error);
    res.status(500).json({ error: "Failed to fetch group notes" });
  }
};

// เพิ่มโน้ตโดย admin เท่านั้น
export const addGroupNote = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { from, message } = req.body;

    if (!from || !groupId || !message) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบสำหรับโน้ต" });
    }

    // ตรวจสิทธิ์: ต้องเป็น admin เท่านั้น
    const role = req.session?.user?.role;
    if (role !== "admin") {
      return res.status(403).json({ error: "ห้าม: เฉพาะ admin เท่านั้นในการลงโน้ต" });
    }

    const newNote = await prisma.message.create({
      data: {
        message,
        sender: { connect: { id: parseInt(from) } },
        group: { connect: { id: parseInt(groupId) } },
        type: "note",
      },
      include: { sender: true },
    });

    // Broadcast ในนามของกลุ่ม
    if (global.io) {
      try {
        global.io.to(`group_${groupId}`).emit("group-note-receive", { note: newNote });
      } catch (err) {
        console.warn("Could not emit group-note-receive:", err);
      }
    }

    return res.status(201).json({ note: newNote });
  } catch (err) {
    console.error("❌ addGroupNote error:", err);
    next(err);
    return;
  }
};

//  ฟังก์ชันส่งข้อความแบบภาพ
export const addImageMessage = async (req, res, next) => {
  try {
    ensureUploadsFolder();
    if (!req.file) return res.status(400).send("Image is required.");
    const { from, to, groupId } = req.body;
    if (!from || (!to && !groupId))
      return res.status(400).send("From and (To or groupId) are required.");

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join("uploads", "images", fileName);
    fs.renameSync(req.file.path, filePath);

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/images/${fileName}`;

    const newMessage = await prisma.message.create({
      data: {
        message: imageUrl,
        sender: { connect: { id: parseInt(from) } },
        receiver: to ? { connect: { id: parseInt(to) } } : undefined,
        group: groupId ? { connect: { id: parseInt(groupId) } } : undefined,
        type: "image",
      },
      include: { sender: true },
    });

    const responseMessage = { ...newMessage, absoluteUrl: imageUrl };

    // Emit via socket
    try {
      const io = req.app.get("io") || global.io;
      if (groupId) {
        io.to(`group_${groupId}`).emit("group-message-receive", { message: responseMessage });
      } else if (to) {
        const sendUserSocket = global.onlineUsers.get(parseInt(to));
        if (sendUserSocket) io.to(sendUserSocket).emit("msg-receive", { message: responseMessage });
        // also emit back to sender so their UI gets the saved message via socket
        const senderSocket = global.onlineUsers.get(parseInt(from));
        if (senderSocket) io.to(senderSocket).emit("msg-receive", { message: responseMessage });
      }

    } catch (emitErr) {
      console.warn("Could not emit image message via socket:", emitErr);
    }

    return res.status(201).json(responseMessage);
  } catch (err) {
    console.error("❌ addImageMessage error:", err);
    next(err);
    return;
  }
};

//  ฟังก์ชันส่งข้อความแบบเสียง
export const addAudioMessage = async (req, res, next) => {
  try {
    ensureAudioUploadsFolder();
    if (!req.file) return res.status(400).send("Audio file is required.");
    const { from, to, groupId } = req.body;
    if (!from || (!to && !groupId))
      return res.status(400).send("From and (To or groupId) are required.");

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join("uploads", "audios", fileName);
    fs.renameSync(req.file.path, filePath);

    const audioUrl = `${req.protocol}://${req.get("host")}/uploads/audios/${fileName}`;

    const newMessage = await prisma.message.create({
      data: {
        message: audioUrl,
        sender: { connect: { id: parseInt(from) } },
        receiver: to ? { connect: { id: parseInt(to) } } : undefined,
        group: groupId ? { connect: { id: parseInt(groupId) } } : undefined,
        type: "audio",
      },
      include: { sender: true },
    });

    const responseMessage = { ...newMessage, absoluteUrl: audioUrl };

    try {
      const io = req.app.get("io") || global.io;
      if (groupId) {
        io.to(`group_${groupId}`).emit("group-message-receive", { message: responseMessage });
      } else if (to) {
        const sendUserSocket = global.onlineUsers.get(parseInt(to));
        if (sendUserSocket) io.to(sendUserSocket).emit("msg-receive", { message: responseMessage });
        const senderSocket = global.onlineUsers.get(parseInt(from));
        if (senderSocket) io.to(senderSocket).emit("msg-receive", { message: responseMessage });
      }
    } catch (emitErr) {
      console.warn("Could not emit audio message via socket:", emitErr);
    }

    return res.status(201).json(responseMessage);
  } catch (err) {
    console.error("❌ addAudioMessage error:", err);
    next(err);
    return;
  }
};

//  ฟังก์ชันดึงรายชื่อผู้ติดต่อพร้อมข้อความล่าสุด
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

//  ฟังก์ชันส่งข้อความในกลุ่ม
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

    //  ส่งข้อความ real-time ผ่าน socket (ใช้ global.io ซึ่งเป็น instance ของ socket.io)
    if (global.io) {
      try {
        global.io.to(`group_${groupId}`).emit("group-message-receive", {
          message: newMessage,
        });
      } catch (err) {
        console.warn("Could not emit group-message-receive via global.io:", err);
      }
    }

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error("❌ addGroupMessage error:", err);
    next(err);
    return;
  }
};
