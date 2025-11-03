import React, { useState, useRef } from "react";
import Avatar from "@/components/common/Avatar";
import axios from "axios";
import { CHANGE_PASSWORD_ROUTE, UPDATE_PROFILE_PIC_ROUTE, UPDATE_USER_PROFILE_ROUTE } from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

export default function ProfileModal({ open, onClose }) {
  const [{ userInfo }, dispatch] = useStateProvider();
  const [about, setAbout] = useState(userInfo?.about || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [imagePreview, setImagePreview] = useState(userInfo?.profilePicture || "/default-avatar.png");
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSaveAbout = async () => {
    try {
      setLoading(true);
      const res = await axios.patch(UPDATE_USER_PROFILE_ROUTE, { about }, { withCredentials: true });
      dispatch({ type: reducerCases.SET_USER_INFO, userInfo: res.data.user });
      alert(res.data.msg || "อัปเดตข้อมูลสำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "อัปเดตโปรไฟล์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return alert("กรอกข้อมูลให้ครบ");
    try {
      setLoading(true);
      const res = await axios.post(CHANGE_PASSWORD_ROUTE, { currentPassword, newPassword }, { withCredentials: true });
      alert(res.data.msg || res.data.message || "เปลี่ยนรหัสผ่านสำเร็จ");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || err.response?.data?.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append("image", file);
    try {
      setLoading(true);
      const res = await axios.post(UPDATE_PROFILE_PIC_ROUTE, form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch({ type: reducerCases.SET_USER_INFO, userInfo: res.data.user });
      alert(res.data.msg || res.data.message || "อัปเดตรูปสำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || err.response?.data?.error || "อัปเดตรูปไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative bg-white w-11/12 max-w-2xl rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">แก้ไขโปรไฟล์</h3>
          <button onClick={onClose} className="text-gray-600">ปิด</button>
        </div>

        <div className="flex gap-6">
          <div>
            <div className="w-40 h-40 rounded-full overflow-hidden">
              <Avatar type="xl" image={imagePreview} setImage={setImagePreview} />
            </div>
            <div className="mt-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadPhoto} style={{ display: "none" }} />
              <button onClick={() => fileRef.current?.click()} className="bg-blue-600 text-white px-3 py-1 rounded mt-2">อัปโหลดรูปใหม่</button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">เกี่ยวกับฉัน</label>
            <textarea value={about} onChange={(e) => setAbout(e.target.value)} className="w-full p-2 border rounded h-24" />
            <div className="mt-2 flex gap-2">
              <button onClick={handleSaveAbout} className="bg-yellow-500 px-3 py-1 rounded">บันทึกข้อมูล</button>
            </div>

            <hr className="my-4" />

            <label className="block text-sm font-medium mb-1">เปลี่ยนรหัสผ่าน</label>
            <input type="password" placeholder="รหัสปัจจุบัน" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <input type="password" placeholder="รหัสใหม่" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <div>
              <button onClick={handleChangePassword} className="bg-green-600 px-3 py-1 rounded">เปลี่ยนรหัสผ่าน</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
