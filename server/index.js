// index.js
// 🔹 ไฟล์หลักสำหรับรัน server OrgChat (รองรับ group chat แล้ว)

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";

import AuthRoutes from "./routes/AuthRoutes.js";
import MessageRoutes from "./routes/MessageRoutes.js";
import FileRoutes from "./routes/FileRoutes.js";
import GroupRoutes from "./routes/GroupRoutes.js";

import { Server } from "socket.io";

dotenv.config();
const app = express();

// =========================
// 🔧 Middleware
// =========================
app.use(
  cors({
    origin: "http://localhost:3005",
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
      secure: false, // ❗ true ถ้าใช้ https
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 วัน
    },
  })
);

// 🖼 Static Files
app.use("/uploads/images/", express.static("uploads/images"));
app.use("/uploads/audios/", express.static("uploads/audios"));
app.use("/uploads/files/", express.static("uploads/files"));

// =========================
// 🔹 Routes
// =========================
app.use("/api/auth", AuthRoutes);
app.use("/api/messages", MessageRoutes);
app.use("/api/files", FileRoutes);
app.use("/api/groups", GroupRoutes);

// =========================
// 🚀 Start Server
// =========================
const PORT = process.env.PORT || 3005;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server รันที่ http://localhost:${PORT}`);
});

// =========================
// 🔌 Socket.io Setup
// =========================
const io = new Server(server, {
  cors: { origin: "http://localhost:3005", credentials: true },
});

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

  // 💬 ส่งข้อความส่วนตัว
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      const message = {
        id: Date.now(),
        senderId: data.from,
        receiverId: data.to,
        message: data.message,
        type: data.type,
        createdAt: new Date().toISOString(),
        messageStatus: "delivered",
      };
      socket.to(sendUserSocket).emit("msg-receive", { message });
    }
  });

  // =========================
  // 📢 ส่วนของ Group Chat
  // =========================

  // 🧩 เมื่อผู้ใช้เข้าห้องกลุ่ม
  socket.on("join-group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`👥 ผู้ใช้ ${socket.id} เข้าห้อง group_${groupId}`);
  });

  // 📨 ส่งข้อความในกลุ่ม
  socket.on("group-message-send", (data) => {
    const { groupId, from, message, type } = data;
    console.log(`📨 ข้อความใหม่ใน group_${groupId} จาก user ${from}: ${message}`);

    // Broadcast ข้อความให้สมาชิกในห้อง (ยกเว้นคนส่ง)
    socket.to(`group_${groupId}`).emit("group-message-receive", {
      message: {
        id: Date.now(),
        senderId: from,
        groupId,
        message,
        type,
        createdAt: new Date().toISOString(),
        messageStatus: "delivered",
      },
    });
  });

  // =========================
  // 📞 Voice & Video Calls
  // =========================

  // 📞 Voice Call
  socket.on("outgoing-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("incoming-voice-call", {
        from: data.from,
        roomId: data.roomId,
        callType: data.callType,
      });
    }
  });

  // 📹 Video Call
  socket.on("outgoing-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("incoming-video-call", {
        from: data.from,
        roomId: data.roomId,
        callType: data.callType,
      });
    }
  });

  // ❌ ปฏิเสธการโทร
  socket.on("reject-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) socket.to(sendUserSocket).emit("voice-call-rejected");
  });

  socket.on("reject-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) socket.to(sendUserSocket).emit("video-call-rejected");
  });

  // ✅ รับสายเรียกเข้า
  socket.on("accept-incoming-call", ({ id }) => {
    const sendUserSocket = onlineUsers.get(id);
    if (sendUserSocket) socket.to(sendUserSocket).emit("accept-call");
  });
});
