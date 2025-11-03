// controllers/GroupCallController.js
import { generateToken04 } from "../utils/TokenGenerator.js";

export const generateGroupCallToken = async (req, res) => {
  try {
    const { userId } = req.params;

    // ข้อมูลจาก ZEGO Dashboard
    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET;
    const effectiveTimeInSeconds = 3600; // 1 ชั่วโมง

    // สร้าง token ด้วยฟังก์ชันของคุณเอง
    const token = generateToken04(appID, String(userId), serverSecret, effectiveTimeInSeconds, "");

    res.status(200).json({ token });
  } catch (err) {
    console.error("❌ Error generating ZEGO token:", err);
    res.status(500).json({ error: "ไม่สามารถสร้าง ZEGO token ได้" });
  }
};
