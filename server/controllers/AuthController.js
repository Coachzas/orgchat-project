// server/controllers/AuthController.js
import getPrismaInstance from "../utils/PrismaClient.js";
import { generateToken04 } from "../utils/TokenGenerator.js";
import bcrypt from "bcrypt";

// 🔹 Regex ตรวจอีเมลแบบเบื้องต้น
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// (ทางเลือก) ถ้าต้องการบล็อกอีเมลชั่วคราว/โดเมนไม่พึงประสงค์
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "10minutemail.com", "guerrillamail.com",
  "tempmail.com", "dispostable.com"
]);

/* ----------------------------------------
📌 REGISTER - สมัครสมาชิก
---------------------------------------- */
export const registerUser = async (req, res, next) => {
  try {
    let { email, password, firstName, lastName, about = "", image = "" } = req.body;

    // ✅ ปรับรูปแบบ-เคลียร์ช่องว่าง
    email = (email || "").trim().toLowerCase();
    firstName = (firstName || "").trim();
    lastName = (lastName || "").trim();
    about = (about || "").trim();

    // ✅ ตรวจความครบถ้วน
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ status: false, msg: "ข้อมูลไม่ครบถ้วน" });
    }

    // ✅ ตรวจรูปแบบอีเมล
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ status: false, msg: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    // (ตัวเลือก) บล็อกโดเมนชั่วคราว
    const domain = email.split("@")[1];
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return res.status(400).json({ status: false, msg: "ไม่อนุญาตโดเมนอีเมลนี้" });
    }

    // ✅ ข้อกำหนดขั้นต่ำ
    if (password.length < 8) {
      return res.status(400).json({ status: false, msg: "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร" });
    }
    if (firstName.length < 2 || lastName.length < 2) {
      return res.status(400).json({ status: false, msg: "ชื่อ/นามสกุลต้องอย่างน้อย 2 ตัวอักษร" });
    }
    if (about.length > 200) {
      return res.status(400).json({ status: false, msg: "เกี่ยวกับคุณต้องไม่เกิน 200 ตัวอักษร" });
    }

    const prisma = getPrismaInstance();

    // 🔎 ตรวจซ้ำด้วยอีเมล (lowercase)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ status: false, msg: "อีเมล์ได้ถูกลงทะเบียนเรียบร้อยแล้ว" });
    }

    // 🔐 Hash รหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ สร้างผู้ใช้ใหม่ (เลือก field ที่จำเป็นตอนส่งกลับ)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        about,
        profilePicture: image,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        about: true,
        profilePicture: true,
      },
    });

    return res.status(201).json({ status: true, msg: "ลงทะเบียนสำเร็จแล้ว", user });
  } catch (err) {
    next(err);
  }
};

/* ----------------------------------------
📌 LOGIN - เข้าสู่ระบบ
---------------------------------------- */
export const loginUser = async (req, res, next) => {
  try {
    let { email, password } = req.body;
    email = (email || "").trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ status: false, msg: "กรอกอีเมลและรหัสผ่าน" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ status: false, msg: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    const prisma = getPrismaInstance();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ status: false, msg: "ไม่พบผู้ใช้" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: false, msg: "ข้อมูลผู้ใช้ไม่ถูกต้อง" });
    }

    // ✅ ส่งกลับเฉพาะฟิลด์ปลอดภัย
    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      about: user.about,
      profilePicture: user.profilePicture,
    };

    return res.status(200).json({ status: true, msg: "เข้าสู่ระบบสำเร็จ", user: safeUser });
  } catch (err) {
    next(err);
  }
};

/* ----------------------------------------
📌 GET ALL USERS - ดึงผู้ใช้ทั้งหมด (group by ตัวอักษร)
---------------------------------------- */
export const getAllUsers = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();

    const users = await prisma.user.findMany({
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        about: true,
      },
    });

    const usersGroupByInitialLetter = {};
    users.forEach((user) => {
      const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : "#";
      if (!usersGroupByInitialLetter[initial]) usersGroupByInitialLetter[initial] = [];
      usersGroupByInitialLetter[initial].push(user);
    });

    return res.status(200).json({ users: usersGroupByInitialLetter });
  } catch (err) {
    next(err);
  }
};

/* ----------------------------------------
📌 TOKEN GENERATOR - ใช้สำหรับ Video/Voice Call (Zego)
---------------------------------------- */
export const generateToken = (req, res, next) => {
  try {
    const appId = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_ID;
    const userId = req.params.userId;
    const effectiveTime = 3600; // 1 ชั่วโมง
    const payload = "";

    if (appId && serverSecret && userId) {
      const token = generateToken04(appId, userId, serverSecret, effectiveTime, payload);
      return res.status(200).json({ status: true, msg: "สร้างโทเค็นสำเร็จแล้ว", token });
    } else {
      return res.status(400).json({ status: false, msg: "จำเป็นต้องมีรหัสผู้ใช้ รหัสแอป และความลับของเซิร์ฟเวอร์" });
    }
  } catch (err) {
    next(err);
  }
};
