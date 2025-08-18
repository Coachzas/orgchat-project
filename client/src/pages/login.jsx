import React, { useState } from "react";
import { useRouter } from "next/router"; 
import axios from "axios";
import { LOGIN_ROUTE } from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import Input from "@/components/common/Input";
import Image from "next/image";

function Login() {
  const router = useRouter();
  const [, dispatch] = useStateProvider();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg("");
    const emailLower = (email || "").trim().toLowerCase(); 
    if (!emailLower || !password) {
      setErrorMsg("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(LOGIN_ROUTE, { email: emailLower, password });

      if (data.status) {
        dispatch({
          type: reducerCases.SET_USER_INFO,
          userInfo: {
            id: data.user.id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            profilePicture: data.user.profilePicture,
            about: data.user.about,
          },
        });
        router.push("/"); // ไปหน้าหลักหลังเข้าสู่ระบบ
      } else {
        setErrorMsg(data.msg || "การเข้าสู่ระบบล้มเหลว");
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.msg || error.message || "การเข้าสู่ระบบล้มเหลว โปรดตรวจสอบข้อมูลของคุณ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-panel-header-background h-screen w-screen text-white flex flex-col items-center justify-center gap-6">
      <div className="flex items-center justify-center gap-4">
        <Image src="/orgchat.png" alt="OrgChat" width={80} height={80} />
        <h1 className="text-4xl font-bold">OrgChat</h1>
      </div>

      <h2 className="text-xl">ลงชื่อเข้าใช้บัญชีของคุณ</h2>

      <div className="flex flex-col gap-4 w-80">
        <Input name="อีเมล" state={email} setState={(val) => setEmail(val.toLowerCase())} type="email" label />
        <Input name="รหัสผ่าน" state={password} setState={setPassword} type="password" label />
        {errorMsg && <span className="text-red-500 text-sm">{errorMsg}</span>}

        <button
          className="bg-search-input-container-background text-white py-2 px-4 rounded-lg disabled:opacity-60"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <span className="text-sm text-gray-400">
          ยังไม่มีบัญชีใช่ไหม?{" "}
          <span onClick={() => router.push("/register")} className="text-blue-500 cursor-pointer">
            ลงทะเบียน
          </span>
        </span>
      </div>
    </div>
  );
}

export default Login;
