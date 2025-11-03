// server/controllers/AuthController.js
import prisma from "../utils/PrismaClient.js";
import { generateToken04 } from "../utils/TokenGenerator.js";
import bcrypt from "bcrypt";

//  Regex ตรวจอีเมลแบบเบื้องต้น
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// (ทางเลือก) ถ้าต้องการบล็อกอีเมลชั่วคราว/โดเมนไม่พึงประสงค์
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "10minutemail.com", "guerrillamail.com",
  "tempmail.com", "dispostable.com"
]);

/* Registration removed - admin will create users */

/* ----------------------------------------
 LOGIN - เข้าสู่ระบบ
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ status: false, msg: "ไม่พบผู้ใช้" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: false, msg: "ข้อมูลผู้ใช้ไม่ถูกต้อง" });
    }

    //  เซต session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      about: user.about,
      profilePicture: user.profilePicture,
      role: user.role,
    };

    return res.status(200).json({ status: true, msg: "เข้าสู่ระบบสำเร็จ", user: safeUser });
  } catch (err) {
    next(err);
  }
};

/* ----------------------------------------
 LOGOUT - ออกจากระบบ
---------------------------------------- */
export const logoutUser = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Logout Error:", err);
      return res.status(500).json({ status: false, msg: "ไม่สามารถออกจากระบบได้" });
    }
    res.clearCookie("connect.sid"); 
    return res.status(200).json({ status: true, msg: "ออกจากระบบสำเร็จ" });
  });
};

/* ----------------------------------------
 GET CURRENT USER - ตรวจสอบ session ปัจจุบัน
---------------------------------------- */
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ status: false, msg: "ยังไม่ได้เข้าสู่ระบบ" });
    }

    return res.status(200).json({ status: true, user: req.session.user });
  } catch (err) {
    console.error("❌ GetCurrentUser Error:", err);
    return res.status(500).json({ status: false, msg: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

/* ----------------------------------------
 CHANGE PASSWORD - ผู้ใช้เปลี่ยนรหัสผ่าน
 ---------------------------------------- */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) return res.status(401).json({ status: false, msg: "ยังไม่ได้เข้าสู่ระบบ" });
    if (!currentPassword || !newPassword) return res.status(400).json({ status: false, msg: "ข้อมูลไม่ครบ" });
    if (newPassword.length < 3) return res.status(400).json({ status: false, msg: "รหัสผ่านต้องอย่างน้อย 3 ตัวอักษร" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ status: false, msg: "ไม่พบผู้ใช้" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ status: false, msg: "รหัสปัจจุบันไม่ถูกต้อง" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return res.status(200).json({ status: true, msg: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error("❌ changePassword error:", err);
    return res.status(500).json({ status: false, msg: "ไม่สามารถเปลี่ยนรหัสผ่านได้" });
  }
};

/* ----------------------------------------
 UPDATE PROFILE PHOTO - อัปโหลดรูปโปรไฟล์
 ---------------------------------------- */
export const updateProfilePhoto = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ status: false, msg: "ยังไม่ได้เข้าสู่ระบบ" });
    if (!req.file) return res.status(400).json({ status: false, msg: "ยังไม่ได้อัปโหลดไฟล์" });

    const fileUrl = `/uploads/images/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: fileUrl },
      select: { id: true, profilePicture: true, firstName: true, lastName: true, email: true, role: true },
    });

    // update session
    req.session.user = { ...req.session.user, profilePicture: fileUrl };

    return res.status(200).json({ status: true, msg: "อัปเดตรูปโปรไฟล์สำเร็จ", user: updated });
  } catch (err) {
    console.error("❌ updateProfilePhoto error:", err);
    return res.status(500).json({ status: false, msg: "ไม่สามารถอัปเดตรูปได้" });
  }
};

/* ----------------------------------------
 UPDATE USER PROFILE - แก้ about / firstName / lastName
 ---------------------------------------- */
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;
    const { firstName, lastName, about } = req.body;
    if (!userId) return res.status(401).json({ status: false, msg: "ยังไม่ได้เข้าสู่ระบบ" });

    const data = {};
    if (typeof firstName === "string" && firstName.trim() !== "") data.firstName = firstName.trim();
    if (typeof lastName === "string" && lastName.trim() !== "") data.lastName = lastName.trim();
    if (typeof about === "string") data.about = about.trim();

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ status: false, msg: "ไม่มีข้อมูลให้แก้ไข" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, about: true, profilePicture: true, role: true },
    });

    // update session
    req.session.user = { ...req.session.user, firstName: updated.firstName, lastName: updated.lastName, about: updated.about, profilePicture: updated.profilePicture };

    return res.status(200).json({ status: true, msg: "อัปเดตโปรไฟล์สำเร็จ", user: updated });
  } catch (err) {
    console.error("❌ updateUserProfile error:", err);
    return res.status(500).json({ status: false, msg: "ไม่สามารถอัปเดตโปรไฟล์ได้" });
  }
};

/* ----------------------------------------
 GET ALL USERS - ดึงผู้ใช้ทั้งหมด (group by ตัวอักษร)
---------------------------------------- */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        about: true,
        role: true,
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
 TOKEN GENERATOR - ใช้สำหรับ Video/Voice Call (Zego)
---------------------------------------- */
export const generateToken = (req, res, next) => {
  try {
    const appId = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET;
    const userId = req.params.userId;
    const effectiveTime = 3600;
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
