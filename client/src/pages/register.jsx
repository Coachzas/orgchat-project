import React, { useEffect } from "react";
import { useRouter } from "next/router";
// ถ้าไม่ได้ใช้ dispatch หลังสมัครเสร็จ สามารถลบ 2 บรรทัดด้านล่างออกได้เลย
// import { reducerCases } from "@/context/constants";
// import { useStateProvider } from "@/context/StateContext";
import Input from "@/components/common/Input";
import Avatar from "@/components/common/Avatar";
import Image from "next/image";

function Register() {
  const router = useRouter();

  useEffect(() => {
    // Registration disabled: redirect users to login
    router.replace("/login");
  }, [router]);

  return (
    <div className="bg-panel-header-background h-screen w-screen text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg mb-2">การลงทะเบียนถูกปิดใช้งาน</h2>
        <p className="text-sm">กรุณาติดต่อผู้ดูแลระบบหากต้องการบัญชีผู้ใช้</p>
        <div className="mt-4">
          <button onClick={() => router.push('/login')} className="bg-search-input-container-background p-2 rounded-lg">ไปยังหน้าล็อกอิน</button>
        </div>
      </div>
    </div>
  );
}

export default Register;
