import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import AuthRoutes from "./routes/AuthRoutes.js";
import MessageRoutes from "./routes/MessageRoutes.js";
import { Server } from "socket.io";
import FileRoutes from "./routes/FileRoutes.js";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads/images/", express.static("uploads/images"));
app.use("/uploads/audios/", express.static("uploads/audios"));
app.use("/uploads/files/", express.static("uploads/files"));

// Routes
app.use("/api/auth", AuthRoutes);
app.use("/api/messages", MessageRoutes); 
app.use("/api/files", FileRoutes);    


const PORT = process.env.PORT || 3005;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server started on PORT ${PORT}`);
});

const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`✅ User connected: ${userId}`);
    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  });

  // ✅ แก้พิมพ์ผิดจาก "singout" => "signout"
  socket.on("signout", (id) => {
    onlineUsers.delete(id);
    console.log(`❌ User signed out: ${id}`);
    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  });

  socket.on("send-msg", (data) => {
  const sendUserSocket = onlineUsers.get(data.to);
  if (sendUserSocket) {
    const message = {
      id: Date.now(), // หรือจะใช้ uuid ก็ได้
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

  socket.on("reject-voice-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("voice-call-rejected");
    }
  });

  socket.on("reject-video-call", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("video-call-rejected");
    }
  });

  socket.on("accept-incoming-call", ({ id }) => {
    const sendUserSocket = onlineUsers.get(id);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("accept-call");
    }
  });
});
