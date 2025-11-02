import React, { useState, useRef } from "react";
import axios from "axios";
import Avatar from "@/components/common/Avatar";
import { CHANGE_PASSWORD_ROUTE, UPDATE_PROFILE_PIC_ROUTE } from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { useRouter } from "next/router";

export default function ProfilePage() {
  const [{ userInfo }, dispatch] = useStateProvider();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [imagePreview, setImagePreview] = useState(userInfo?.profilePicture || "/default-avatar.png");
  const fileRef = useRef(null);
  const router = useRouter();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return alert("กรอกข้อมูลให้ครบ");
    try {
      const res = await axios.post(CHANGE_PASSWORD_ROUTE, { currentPassword, newPassword }, { withCredentials: true });
      alert(res.data.msg || res.data.message || "เปลี่ยนรหัสผ่านสำเร็จ");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || err.response?.data?.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append("image", file);
    try {
      const res = await axios.post(UPDATE_PROFILE_PIC_ROUTE, form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(res.data.msg || res.data.message || "อัปเดตรูปสำเร็จ");
      dispatch({ type: reducerCases.SET_USER_INFO, userInfo: res.data.user });
      // optional: reload to refresh any server-rendered data
      router.reload();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || err.response?.data?.error || "อัปเดตรูปไม่สำเร็จ");
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-semibold mb-4">โปรไฟล์ของฉัน</h2>

      <div className="flex gap-6 items-center mb-6">
        <Avatar type="xl" image={imagePreview} setImage={setImagePreview} />
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadPhoto} style={{ display: "block", marginTop: 8 }} />
          <button onClick={() => fileRef.current?.click()} className="mt-2 bg-blue-600 px-3 py-1 rounded">
            อัปโหลดรูปใหม่
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium">เปลี่ยนรหัสผ่าน</h3>
        <input type="password" placeholder="รหัสปัจจุบัน" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="p-2 rounded mt-2 w-full bg-input-background" />
        <input type="password" placeholder="รหัสใหม่" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="p-2 rounded mt-2 w-full bg-input-background" />
        <button onClick={handleChangePassword} className="mt-2 bg-green-600 px-3 py-1 rounded">เปลี่ยนรหัสผ่าน</button>
      </div>
    </div>
  );
}
