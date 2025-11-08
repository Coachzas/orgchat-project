// GroupCallContainer.jsx
import dynamic from "next/dynamic";
import React from "react";
import { useStateProvider } from "@/context/StateContext";

// 🧩 โหลด GroupContainer แบบปิด SSR (เพื่อกัน document error)
const GroupContainer = dynamic(() => import("./GroupContainer"), { ssr: false });

function GroupCallContainer() {
  const [{ groupCall }] = useStateProvider();

  // ถ้าไม่มีสายกลุ่มที่กำลังโทรอยู่ ให้ return null ไปก่อน
  if (!groupCall) return null;

  // แสดง GroupContainer เมื่อมีข้อมูลการโทรกลุ่ม
  return <GroupContainer data={groupCall} />;
}

export default GroupCallContainer;
