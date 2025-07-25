import getPrismaInstance from "../utils/PrismaClient.js";
import { generateToken04 } from "../utils/TokenGenerator.js";

// 📌 ฟังก์ชันตรวจสอบผู้ใช้ในฐานข้อมูล
export const checkUser = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required.", status: false });
    }

    const prisma = getPrismaInstance();

    // ค้นหาผู้ใช้ในฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found", status: false });
    } else {
      return res.status(200).json({ msg: "User found", status: true, data: user });
    }
  } catch (err) {
    next(err);
  }
};

// 📌 ฟังก์ชันเพิ่มผู้ใช้ใหม่ในฐานข้อมูล
export const onBoardUser = async (req, res, next) => {
  try {
    const { email, name, about = "", image: profilePicture } = req.body;

    if (!email || !name || !profilePicture) {
      return res.status(400).json({ msg: "Email, Name and Image are required.", status: false });
    }

    const prisma = getPrismaInstance();

    // ตรวจสอบว่าผู้ใช้นั้นมีอยู่แล้วหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ msg: "User already exists", status: false });
    }

    // สร้างผู้ใช้ใหม่
    const user = await prisma.user.create({
      data: { email, name, about, profilePicture },
    });

    return res.status(201).json({ msg: "User onboarded successfully", status: true, user });
  } catch (err) {
    next(err);
  }
};

// 📌 ฟังก์ชันดึงข้อมูลผู้ใช้ทั้งหมด
export const getAllUsers = async (req, res, next) => {
  console.log("🔍 Request Object:", req);
  try {
    const prisma = getPrismaInstance();
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        profilePicture: true,
        about: true,
      },
    });

    const usersGroupByInitialLetter = {};

    users.forEach((user) => {
      const initialLetter = user.name ? user.name.charAt(0).toUpperCase() : "#"; // ✅ ป้องกัน name เป็น null
      if (!usersGroupByInitialLetter[initialLetter]) {
        usersGroupByInitialLetter[initialLetter] = [];
      }
      usersGroupByInitialLetter[initialLetter].push(user);
    });

    return res.status(200).json({ users: usersGroupByInitialLetter });
  } catch (err) {
    next(err);
  }
};

export const generateToken = (req, res, next) => {
  try {
    const appId = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_ID;
    const userId = req.params.userId;
    const effectiveTime = 3600;
    const payload = "";

    if (appId && serverSecret && userId) {
      const token = generateToken04(appId, userId, serverSecret, effectiveTime, payload);
      return res.status(200).json({
        msg: "Token generated successfully",
        status: true,
        token,
      });
    } else {
      return res.status(400).json({
        msg: "User id, app id and server secret are required",
        status: false,
      });
    }
  } catch (err) {
    next(err);
  }
};
