import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { REGISTER_ROUTE } from "@/utils/ApiRoutes";
// ถ้าไม่ได้ใช้ dispatch หลังสมัครเสร็จ สามารถลบ 2 บรรทัดด้านล่างออกได้เลย
// import { reducerCases } from "@/context/constants";
// import { useStateProvider } from "@/context/StateContext";
import Input from "@/components/common/Input";
import Avatar from "@/components/common/Avatar";
import Image from "next/image";

function Register() {
  const router = useRouter();
  // const [, dispatch] = useStateProvider();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [image, setImage] = useState("/default-avatar.png");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    const emailLower = (email || "").trim().toLowerCase();

    if (!emailLower || !password || !firstName || !lastName) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(REGISTER_ROUTE, {
        email: emailLower,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        about: (about || "").trim(),
        image,
      });

      if (data.status) {
        // ❌ ไม่ต้องตั้ง userInfo/สถานะล็อกอินที่ context
        // dispatch({ type: reducerCases.SET_USER_INFO, userInfo: { ... }});
        // dispatch({ type: reducerCases.SET_NEW_USER, newUser: false });

        // ✅ เปลี่ยนเส้นทางไปหน้า Login พร้อมพารามิเตอร์แจ้งเตือน
        router.push("/login?registered=1");
      } else {
        setError(data.msg || "เกิดข้อผิดพลาดในการลงทะเบียน");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-panel-header-background text-white">
      <div className="flex items-center justify-center gap-4 mb-4">
        <Image src="/orgchat.png" alt="OrgChat" width={80} height={80} />
        <h1 className="text-4xl font-bold">OrgChat</h1>
      </div>

      <h2 className="text-xl mb-4">สมัครสมาชิก</h2>

      <div className="flex gap-6 items-start">
        <div className="flex flex-col gap-4 w-96">
          <Input name="อีเมล" state={email} setState={(val) => setEmail(val.toLowerCase())} type="email" label />
          <Input name="ชื่อ" state={firstName} setState={setFirstName} label />
          <Input name="นามสกุล" state={lastName} setState={setLastName} label />
          <Input name="เกี่ยวกับคุณ" state={about} setState={setAbout} label />
          <Input name="รหัสผ่าน" state={password} setState={setPassword} type="password" label />

          {error && <span className="text-red-500 text-sm">{error}</span>}

          <button
            className="bg-search-input-container-background p-3 rounded-lg mt-4 disabled:opacity-60"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
          </button>

          <span className="text-sm mt-2">
            มีบัญชีอยู่แล้ว?{" "}
            <span className="text-blue-400 cursor-pointer" onClick={() => router.push("/login")}>
              เข้าสู่ระบบ
            </span>
          </span>
        </div>

        <div>
          <Avatar type="xl" image={image} setImage={setImage} />
        </div>
      </div>
    </div>
  );
}
export default Register;
