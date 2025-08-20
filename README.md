OrgChat — ระบบแชทภายในองค์กร (Organizational Chat App)

สถานะโปรเจกต์: ใช้งานได้ (กำลังพัฒนา/เติมฟีเจอร์)
สรุปสั้น: เว็บแอปสำหรับการสื่อสารภายในองค์กร รองรับแชท 1:1/กลุ่ม, แชร์ไฟล์มีเดีย, สถานะอ่าน/ออนไลน์, และโทรเสียง/วิดีโอผ่าน ZegoCloud

เทคโนโลยีที่ใช้ (Tech Stack)
Frontend: Next.js (React), Tailwind CSS
Backend: Node.js (Express), Socket.IO, Multer (อัปโหลดไฟล์)
Database/ORM: PostgreSQL + Prisma ORM
Auth & Security: bcrypt, (JWT/Session — ตามการตั้งค่าโปรเจกต์)
Calling: ZegoCloud (App ID / Server Secret สำหรับออกโทเค็น)

การตั้งค่าและรันโครงการ (Getting Started)
1) เตรียมเครื่อง
- Node.js ≥ 18
- PostgreSQL ≥ 14 (สร้างฐานข้อมูล เช่น whatsapp หรือ orgchat)
- Git
  
2) โคลนโปรเจกต์
- git clone https://github.com/Coachzas/orgchat-project.git
- cd orgchat-project
  
3) ตั้งค่า Backend (server/)
- cd server
- cp .env.example .env
- npm install

**ตัวอย่างไฟล์ .env**
- DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/whatsapp?schema=public"
- PORT=3005
# ZegoCloud (ฝั่งเซิร์ฟเวอร์ใช้สำหรับออกโทเค็น)
- ZEGO_APP_ID="1818181818" # ตัวเลข App ID
- ZEGO_SERVER_SECRET="<your_server_secret>"
# (ถ้าใช้ JWT)
- JWT_SECRET="<your_jwt_secret>"

**Prisma & Database**
- npx prisma migrate dev --name init
- npx prisma generate

**รันเซิร์ฟเวอร์**
- npm run start # ใช้ nodemon index.js ตาม package.json

4)ตั้งค่า Frontend (client/)
- cd ../client
- cp .env.local.example .env.local
- npm install
  
**ตัวอย่างไฟล์ .env.local**
- NEXT_PUBLIC_SERVER_URL="http://localhost:3005"
- NEXT_PUBLIC_ZEGO_APP_ID="1818181818"
# สำหรับฝั่ง client บางโปรเจกต์ใช้ SERVER_ID หรือคีย์สาธารณะ
- NEXT_PUBLIC_ZEGO_SERVER_ID="<public_or_temp_key_if_used>"

**รันฝั่งหน้าเว็บ**
- npm run dev # เปิด http://localhost:3000

ทดสอบ: สมัครผู้ใช้ → ล็อกอิน → แชท 1:1 → อัปโหลดภาพ/เสียง/ไฟล์ → สร้างกลุ่ม → โทรเสียง/วิดีโอ

