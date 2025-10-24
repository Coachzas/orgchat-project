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

import { Server } from "socket.io";

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
      secure: false, // ✅ true ถ้าใช้ https
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

// 🔹 Routes
app.use("/api/auth", AuthRoutes);
app.use("/api/messages", MessageRoutes);
app.use("/api/files", FileRoutes);
app.use("/api/groups", GroupRoutes);
app.use("/api/admin", AdminRoutes);

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

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("✅ ผู้ใช้เชื่อมต่อ socket:", socket.id);
  global.chatSocket = socket;

  // 🧍‍♂️ เพิ่มผู้ใช้เข้าสู่ onlineUsers
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`✅ ผู้ใช้ที่เชื่อมต่อ: ${userId}`);
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
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);

    const message = {
      id: Date.now(),
      senderId: data.from,
      receiverId: data.to,
      message: data.message,
      type: data.type,
      createdAt: new Date().toISOString(),
      messageStatus: "delivered",
    };

    // ✅ ถ้ามี socket ของผู้รับ — ส่งให้ผู้รับ
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", { message });
    }

    // ✅ ส่งกลับให้ผู้ส่งด้วย — เพื่อให้ขึ้นทันทีโดยไม่ต้องรีเฟรช
    socket.emit("msg-receive", { message });
  });

  // 📢 ส่วนของ Group Chat
  // 🧩 เมื่อผู้ใช้เข้าห้องกลุ่ม
  socket.on("join-group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`👥 ผู้ใช้ ${socket.id} เข้าห้อง group_${groupId}`);
  });

  // 📨 ส่งข้อความในกลุ่ม (เรียลไทม์ทั้งผู้ส่งและผู้รับ)
  socket.on("group-message-send", (data) => {
    const { groupId, from, message, type } = data;
    console.log(`📨 ข้อความใหม่ใน group_${groupId} จาก user ${from}: ${message}`);

    const msgData = {
      message: {
        id: Date.now(),
        senderId: from,
        groupId,
        message,
        type,
        createdAt: new Date().toISOString(),
        messageStatus: "delivered",
      },
    };

    // ส่งให้สมาชิกในห้อง (ยกเว้นคนส่ง)
    socket.to(`group_${groupId}`).emit("group-message-receive", msgData);

    // ส่งกลับให้คนส่งด้วย (เพื่อให้ขึ้นทันที)
    socket.emit("group-message-receive", msgData);
  });

  // 🔊 Voice & Video Calls
  // -----------------------------------------------

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

  // 📹 Video Call
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

  // ❌ ปฏิเสธการโทร (ใช้ชื่อ unified: reject-call)
  socket.on("reject-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("reject-call");
      console.log("📴 ส่ง reject-call กลับไปยัง:", data.from);
    }
  });

  // ✅ รับสายเรียกเข้า (พร้อมส่ง roomId กลับไปยัง caller)
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
});
