// index.js
// 🔹 ไฟล์หลักสำหรับรัน server OrgChat (รองรับ group chat, voice/video call, และ realtime แล้ว)

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";

import AuthRoutes from "./routes/AuthRoutes.js";
import MessageRoutes from "./routes/MessageRoutes.js";
import FileRoutes from "./routes/FileRoutes.js";
import GroupRoutes from "./routes/GroupRoutes.js";
import AdminRoutes from "./routes/AdminRoutes.js";
import GroupCallRoutes from "./routes/GroupCallRoutes.js";

import { Server } from "socket.io";
import prisma from "./utils/PrismaClient.js";

dotenv.config();
const app = express();

// 🔧 Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// 🔐 Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "orgchat-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true ถ้าใช้ https
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 วัน
    },
  })
);

// 🖼 Static Files
app.use("/uploads/images/", express.static("uploads/images"));
app.use("/uploads/audios/", express.static("uploads/audios"));
app.use("/uploads/files/", express.static("uploads/files"));
app.use("/uploads/group-files/", express.static("uploads/group-files"));

// 🔹 Routes
app.use("/api/auth", AuthRoutes);
app.use("/api/messages", MessageRoutes);
app.use("/api/files", FileRoutes);
app.use("/api/groups", GroupRoutes);
app.use("/api/admin", AdminRoutes);
app.use("/api/group-call", GroupCallRoutes);

// 🚀 Start Server
const PORT = process.env.PORT || 3005;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server รันที่ http://localhost:${PORT}`);
});

// 🔌 Socket.io Setup
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

app.set("io", io);
global.io = io;
global.onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(" ผู้ใช้เชื่อมต่อ socket:", socket.id);
  global.chatSocket = socket;

  // 🧍‍♂️ เพิ่มผู้ใช้เข้าสู่ onlineUsers
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(` ผู้ใช้ที่เชื่อมต่อ: ${userId}`);
    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  });

  // 🚪 ผู้ใช้ออกจากระบบ
  socket.on("signout", (id) => {
    onlineUsers.delete(id);
    console.log(`❌ ผู้ใช้ออกจากระบบ: ${id}`);
    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  });

  // 💬 ส่งข้อความส่วนตัว (1-1)
  socket.on("send-msg", async (data) => {
    const sendUserSocket = onlineUsers.get(data.to);

    const baseMessage = {
      id: Date.now(),
      senderId: data.from,
      receiverId: data.to,
      message: data.message,
      type: data.type,
      createdAt: new Date().toISOString(),
      messageStatus: "delivered",
    };

    // Try to include sender info so recipient can render profile immediately
    let senderObj = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(data.from) },
        select: { id: true, firstName: true, lastName: true, profilePicture: true, email: true },
      });
      if (user) senderObj = user;
    } catch (err) {
      console.warn("Could not fetch sender for private realtime message:", err);
    }

    const message = { ...baseMessage, sender: senderObj };

    // ถ้ามี socket ของผู้รับ — ส่งให้ผู้รับ
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", { message });
    }
    // Also emit back to sender (optional)
    socket.emit("msg-receive", { message });
  });

  // 📢 ส่วนของ Group Chat
  socket.on("leave-all-groups", () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => {
      if (room.startsWith("group_")) socket.leave(room);
    });
    console.log(`🚪 ผู้ใช้ ${socket.id} ออกจากทุกห้องกลุ่มแล้ว`);
  });

  socket.on("join-group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`👥 ผู้ใช้ ${socket.id} เข้าห้อง group_${groupId}`);
  });

  // 📨 ส่งข้อความในกลุ่ม (เรียลไทม์ทั้งผู้ส่งและผู้รับ)
  socket.on("group-message-send", async (data) => {
    const { groupId, from, message, type } = data;
    console.log(`📨 ข้อความใหม่ใน group_${groupId} จาก user ${from}: ${message}`);

    const baseMessage = {
      id: Date.now(),
      senderId: from,
      groupId,
      message,
      type,
      createdAt: new Date().toISOString(),
      messageStatus: "delivered",
    };

    let senderObj = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(from) },
        select: { id: true, firstName: true, lastName: true, profilePicture: true, email: true },
      });
      if (user) senderObj = user;
    } catch (err) {
      console.warn("Could not fetch sender for realtime group message:", err);
    }

    const msgData = { message: { ...baseMessage, sender: senderObj } };
    socket.to(`group_${groupId}`).emit("group-message-receive", msgData);
    socket.emit("group-message-receive", msgData);
  });

  // 📝 เพิ่มประกาศโน้ตของแอดมิน (Realtime)
  socket.on("group-note-send", async (data) => {
    const { groupId, from, message } = data;
    console.log(`📝 [Realtime] โน้ตใหม่จาก admin (${from}) ใน group_${groupId}`);

    const baseNote = {
      id: Date.now(),
      senderId: from,
      groupId,
      message,
      createdAt: new Date().toISOString(),
    };

    let senderObj = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(from) },
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      });
      if (user) senderObj = user;
    } catch (err) {
      console.warn("ไม่สามารถดึงข้อมูล sender ได้:", err);
    }

    const notePayload = { note: { ...baseNote, sender: senderObj } };
    socket.to(`group_${groupId}`).emit("group-note-receive", notePayload);
    socket.emit("group-note-receive", notePayload);
  });

  // 🗑️ เมื่อโน้ตถูกลบ
  socket.on("group-note-delete", ({ groupId, noteId }) => {
    socket.to(`group_${groupId}`).emit("group-note-deleted", { noteId });
    socket.emit("group-note-deleted", { noteId });
  });

  // 🔊 Voice & Video Calls
  socket.on("outgoing-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    console.log("📞 Caller:", data.from.id, "→ Receiver:", data.to);
    console.log("🧭 Online users map:", Array.from(onlineUsers.entries()));
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("incoming-voice-call", {
        id: data.from.id,
        from: data.from,
        callType: data.callType,
        roomId: data.roomId,
      });
      console.log("📞 ส่งสัญญาณ incoming-voice-call ไปยัง:", data.to);
    } else {
      console.log("⚠️ ไม่พบ socket ของผู้รับ:", data.to);
    }
  });

  socket.on("outgoing-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      io.to(sendUserSocket).emit("incoming-video-call", {
        id: data.from.id,
        from: data.from,
        roomId: data.roomId,
        callType: data.callType,
      });
      console.log("🎥 ส่งสัญญาณ incoming-video-call ไปยัง:", data.to);
    } else {
      console.log("⚠️ No socket found for receiver", data.to);
    }
  });

  socket.on("reject-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("reject-call");
      console.log("📴 ส่ง reject-call กลับไปยัง:", data.from);
    }
  });

  socket.on("accept-incoming-call", ({ id, roomId }) => {
    const sendUserSocket = onlineUsers.get(id);
    console.log("📩 [Server] รับ event accept-incoming-call จาก:", socket.id);
    console.log("↩️ ส่งต่อ event accept-call ไปหา caller:", id, "roomId:", roomId);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("accept-call", { roomId });
      console.log("📲 ผู้รับสายตอบรับ call:", id, "roomId:", roomId);
    } else {
      console.log("⚠️ [Server] ไม่พบ socket ของ caller:", id);
    }
  });

  // 🔊 โทรออกแบบกลุ่ม (แก้ groupName)
  socket.on("outgoing-group-call", async ({ groupId, from, roomId, callType, groupName }) => {
    try {
      const members = await prisma.groupMember.findMany({
        where: { groupId: parseInt(groupId) },
        select: { userId: true },
      });

      members.forEach((m) => {
        const socketId = onlineUsers.get(m.userId);
        if (socketId && m.userId !== from.id) {
          io.to(socketId).emit("incoming-group-call", {
            groupId,
            from,
            groupName, // ✅ ป้องกัน undefined
            callType,
            roomId,
          });
        }
      });

      console.log(`📞 Group call started in group_${groupId} by user ${from.id}`);
    } catch (err) {
      console.error("❌ Error in group call:", err);
    }
  });

  socket.on("join-group-call", ({ groupId, user }) => {
    socket.join(`groupcall_${groupId}`);
    io.to(`groupcall_${groupId}`).emit("group-call-joined", { user });
  });

  socket.on("leave-group-call", ({ groupId, userId }) => {
    socket.leave(`groupcall_${groupId}`);
    io.to(`groupcall_${groupId}`).emit("group-call-left", { userId });
  });
});
