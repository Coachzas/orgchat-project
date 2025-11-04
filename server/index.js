// index.js
//  ไฟล์หลักสำหรับรัน server OrgChat

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

// โหลดค่าตัวแปรจาก .env
dotenv.config();
const app = express(); // สร้างแอป Express

// 🔧 Middleware
app.use(
  // ตั้งค่า CORS เพื่อให้ client (Next.js ที่ http://localhost:3000) ส่ง request + cookie มาได้
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json()); // ให้ Express แปลง JSON body (req.body) ให้อัตโนมัติ
app.use(cookieParser()); // ใช้ cookie-parser เพื่ออ่าน cookie จาก request (ใช้กับ session)

// 🔐 Session
// ใช้ express-session จัดการ session ของผู้ใช้ เช่นเก็บ user ที่ล็อกอิน
app.use(
  session({
    secret: process.env.SESSION_SECRET || "orgchat-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // ถ้าใช้ https จริง ๆ ค่อยเปลี่ยนเป็น true
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // อายุ session = 1 วัน (ms)
    },
  })
);

// 🖼 Static Files
// กำหนด path ให้ client เข้าถึงไฟล์ static ที่อัปโหลดได้ รูป, เสียง, ไฟล์, ไฟล์กลุ่ม 
app.use("/uploads/images/", express.static("uploads/images"));
app.use("/uploads/audios/", express.static("uploads/audios"));
app.use("/uploads/files/", express.static("uploads/files"));
app.use("/uploads/group-files/", express.static("uploads/group-files"));

//  Routes
// ผูก path หลักกับไฟล์ routes ที่แยกตามฟีเจอร์
app.use("/api/auth", AuthRoutes); // Auth (login, logout, check-auth)
app.use("/api/messages", MessageRoutes); // Message (ส่งข้อความ, โหลดข้อความ 1-1 และกลุ่ม)
app.use("/api/files", FileRoutes); // File (อัปโหลดไฟล์, ดาวน์โหลดไฟล์)
app.use("/api/groups", GroupRoutes); // Group (จัดการกลุ่ม)
app.use("/api/admin", AdminRoutes); // Admin (จัดการผู้ใช้, กลุ่ม)
app.use("/api/group-call", GroupCallRoutes); // Group Call (จัดการการโทรกลุ่ม)

// 🚀 Start Server
const PORT = process.env.PORT || 3005;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server รันที่ http://localhost:${PORT}`);
});

// 🔌 Socket.io Setup ผูก Socket.IO เข้ากับ HTTP server
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

app.set("io", io); // เก็บ io ไว้ใน app และเป็น global เผื่อใช้ใน controller อื่น ๆ
global.io = io;
global.onlineUsers = new Map(); // Map สำหรับเก็บ userId เพื่อรู้ว่า user คนไหน online อยู่บน socket ไหน

io.on("connection", (socket) => { // ฟังก์ชันหลักของ Socket.IO เมื่อ client เชื่อมต่อเข้ามา
  console.log(" ผู้ใช้เชื่อมต่อ socket:", socket.id);
  global.chatSocket = socket;

  // 🧍‍♂️ เพิ่มผู้ใช้เข้าสู่ onlineUsers
  socket.on("add-user", (userId) => { // event: เมื่อ client แจ้งว่า userId นี้ออนไลน์ 
    onlineUsers.set(userId, socket.id); // ผูก userId กับ socket.id ปัจจุบัน
    console.log(` ผู้ใช้ที่เชื่อมต่อ: ${userId}`);
    socket.broadcast.emit("online-users", { // ส่งรายการ online users ไปแจ้งคนอื่น
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  });

  // 🚪 ผู้ใช้ออกจากระบบ
  socket.on("signout", (id) => { // event: เมื่อผู้ใช้ signout
    onlineUsers.delete(id);
    console.log(`❌ ผู้ใช้ออกจากระบบ: ${id}`);
    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  });

  // 💬 ส่งข้อความส่วนตัว (1-1)
  socket.on("send-msg", async (data) => { // event: "send-msg" สำหรับส่งข้อความส่วนตัว (1-1) แบบ realtime
    const sendUserSocket = onlineUsers.get(data.to); // ดึง socket ของผู้รับจาก onlineUsers

    const baseMessage = { // สร้างโครง message พื้นฐาน (เหมือน structure ใน DB)
      id: Date.now(),
      senderId: data.from,
      receiverId: data.to,
      message: data.message,
      type: data.type,
      createdAt: new Date().toISOString(),
      messageStatus: "delivered",
    };

    // พยายามดึงข้อมูล sender จาก DB เพื่อส่งไปให้ front แสดงโปรไฟล์ของผู้ส่งได้ทันที
    let senderObj = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(data.from) },
        select: { id: true, firstName: true, lastName: true, profilePicture: true, email: true },
      });
      if (user) senderObj = user;
    } catch (err) {
      console.warn("ไม่สามารถดึงผู้ส่งสำหรับข้อความเรียลไทม์ส่วนตัวได้:", err);
    }

    const message = { ...baseMessage, sender: senderObj }; // รวม baseMessage กับข้อมูล sender

    // ถ้าผู้รับออนไลน์ (มี socket) → ส่ง event "msg-receive" ไปยัง socket ของผู้รับ
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", { message });
    }
    // ส่งกลับไปให้ผู้ส่งด้วย (ทำให้ UI ฝั่ง sender อัปเดต message เดียวกัน)
    socket.emit("msg-receive", { message });
  });

  // 📢 ส่วนของ Group Chat
  socket.on("leave-all-groups", () => { // event: ให้ user ออกจากทุก group room ที่ join อยู่ (ใช้ตอนสลับ group หรือออกจากกลุ่มทั้งหมด)
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => {
      if (room.startsWith("group_")) socket.leave(room);
    });
    console.log(`🚪 ผู้ใช้ ${socket.id} ออกจากทุกห้องกลุ่มแล้ว`);
  });
  
  // event: เข้าร่วมห้องกลุ่มตาม groupId
  socket.on("join-group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`👥 ผู้ใช้ ${socket.id} เข้าห้อง group_${groupId}`);
  });

  // 📨 ส่งข้อความในกลุ่ม (เรียลไทม์ทั้งผู้ส่งและผู้รับ)
  socket.on("group-message-send", async (data) => { // event: ส่งข้อความในกลุ่มแบบ realtime ให้สมาชิกในกลุ่ม
    const { groupId, from, message, type } = data;
    console.log(`📨 ข้อความใหม่ใน group_${groupId} จาก user ${from}: ${message}`);

    const baseMessage = {// สร้างโครงข้อความพื้นฐานเหมือนด้านบนแต่มี groupId
      id: Date.now(),
      senderId: from,
      groupId,
      message,
      type,
      createdAt: new Date().toISOString(),
      messageStatus: "delivered",
    };

     // ดึงข้อมูล sender จาก DB เพื่อแนบไปด้วย (ใช้แสดง avatar, ชื่อ)
    let senderObj = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(from) },
        select: { id: true, firstName: true, lastName: true, profilePicture: true, email: true },
      });
      if (user) senderObj = user;
    } catch (err) {
      console.warn("ไม่สามารถดึงข้อมูล sender สำหรับข้อความเรียลไทม์ในกลุ่มได้:", err);
    }

    const msgData = { message: { ...baseMessage, sender: senderObj } }; // จัด payload ที่จะส่งให้ client
    socket.to(`group_${groupId}`).emit("group-message-receive", msgData); // ส่งให้สมาชิกคนอื่นในห้อง
    socket.emit("group-message-receive", msgData);  // ส่งกลับให้ผู้ส่งเพื่อให้ UI ตัวเองอัปเดตด้วย
  });

  // 📝 เพิ่มประกาศโน้ตของแอดมิน 
  socket.on("group-note-send", async (data) => {  // event: ส่งโน้ต/ประกาศในกลุ่ม (เฉพาะ admin )
    const { groupId, from, message } = data;
    
    const baseNote = { // โครง note พื้นฐาน (คล้าย message แต่คนละ type = "note")
      id: Date.now(),
      senderId: from,
      groupId,
      message,
      createdAt: new Date().toISOString(),
    };

    let senderObj = null; // ดึงข้อมูลเจ้าของโน้ต (admin) จาก DB
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(from) },
        select: { id: true, firstName: true, lastName: true, profilePicture: true },
      });
      if (user) senderObj = user;
    } catch (err) {
      console.warn("ไม่สามารถดึงข้อมูล sender ได้:", err);
    }
    
    const notePayload = { note: { ...baseNote, sender: senderObj } };// payload ที่จะส่งให้ client
    socket.to(`group_${groupId}`).emit("group-note-receive", notePayload); // ส่งให้สมาชิกคนอื่นในกลุ่ม
    socket.emit("group-note-receive", notePayload); // ส่งกลับให้ผู้ส่ง (admin) ด้วย
  });

  // 🗑️ เมื่อโน้ตถูกลบ
  // event: เมื่อ note ถูกลบ (จากฝั่ง admin)  แจ้งคนอื่นให้ลบออกจาก UI
  socket.on("group-note-delete", ({ groupId, noteId }) => { 
    socket.to(`group_${groupId}`).emit("group-note-deleted", { noteId }); // event: เมื่อ note ถูกลบ (จากฝั่ง admin) → แจ้งคนอื่นให้ลบออกจาก UI
    socket.emit("group-note-deleted", { noteId });
  });

  // 🔊 Voice & Video Calls
   // event: Caller ส่ง outgoing-voice-call ไปหา receiver
  socket.on("outgoing-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.to); // หาว่า user ปลายทางออนไลน์บน socket ไหน
    console.log("📞 Caller:", data.from.id, "→ Receiver:", data.to);
    console.log("🧭 Online users map:", Array.from(onlineUsers.entries()));
    
    if (sendUserSocket) { // ส่ง event "incoming-voice-call" ไปให้ผู้รับ (ให้ขึ้น UI แสดงสายเข้า)
      io.to(sendUserSocket).emit("incoming-voice-call", {
        id: data.from.id,
        from: data.from,  // ข้อมูลผู้โทร (ใช้แสดงชื่อ/รูป)
        callType: data.callType,
        roomId: data.roomId, // ใช้เชื่อมกับ ZEGOCLOUD
      });
      console.log("📞 ส่งสัญญาณ incoming-voice-call ไปยัง:", data.to);
    } else {
      console.log("⚠️ ไม่พบ socket ของผู้รับ:", data.to);
    }
  });

  // event: Caller ส่ง outgoing-video-call ไปหา receiver
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

  // event: ฝั่งผู้รับกดปฏิเสธสาย  แจ้งกลับไปให้ฝั่ง caller
  socket.on("reject-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("reject-call");
      console.log("📴 ส่ง reject-call กลับไปยัง:", data.from);
    }
  });

  // event: ฝั่งผู้รับกด “รับสาย” → แจ้ง caller ว่ารับแล้ว และส่ง roomId ให้
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

  // 🔊 โทรออกแบบกลุ่ม 
  socket.on("outgoing-group-call", async ({ groupId, from, roomId, callType, groupName }) => {
    try {
      const members = await prisma.groupMember.findMany({ // ดึงสมาชิกในกลุ่มทั้งหมดจาก DB
        where: { groupId: parseInt(groupId) },
        select: { userId: true },
      });
      
      // ส่ง event "incoming-group-call" ไปให้สมาชิกในกลุ่มที่ออนไลน์
      members.forEach((m) => {
        const socketId = onlineUsers.get(m.userId);
        if (socketId && m.userId !== from.id) {
          io.to(socketId).emit("incoming-group-call", {
            groupId,
            from,
            groupName, 
            callType,
            roomId,  // room สำหรับ ZEGOCLOUD
          });
        }
      });

      console.log(`📞 Group call started in group_${groupId} by user ${from.id}`);
    } catch (err) {
      console.error("❌ Error in group call:", err);
    }
  });

  // event: ผู้ใช้เข้าร่วมสายกลุ่ม  ให้เข้าห้อง ของ Socket.IO
  socket.on("join-group-call", ({ groupId, user }) => {
    socket.join(`groupcall_${groupId}`);
    io.to(`groupcall_${groupId}`).emit("group-call-joined", { user }); // แจ้งทุกคนในห้องว่า user นี้เข้าร่วมแล้ว
  });

  // event: ผู้ใช้ออกจากสายกลุ่ม  ออกจากห้อง
  socket.on("leave-group-call", ({ groupId, userId }) => {
    socket.leave(`groupcall_${groupId}`);
    io.to(`groupcall_${groupId}`).emit("group-call-left", { userId });
  });
});
