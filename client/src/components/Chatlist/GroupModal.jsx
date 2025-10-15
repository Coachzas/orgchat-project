import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useStateProvider } from "@/context/StateContext";
import axios from "axios";

function GroupModal({ onClose }) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const [{ userContacts }] = useStateProvider();

  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("กรุณากรอกชื่อกลุ่ม");
      return;
    }

    if (selectedMembers.length === 0) {
      alert("กรุณาเลือกสมาชิกอย่างน้อย 1 คน");
      return;
    }

    try {
      // แปลงสมาชิกเป็น array ของ number
      const membersIds = selectedMembers.map((id) => Number(id));

      const response = await axios.post(
        "http://localhost:3005/api/groups/create",
        {
          name: groupName.trim(),
          about: groupDescription.trim() || null, // ให้ backend รับ null ถ้าว่าง
          members: membersIds,
        },
        { withCredentials: true }
      );

      console.log("✅ Group created:", response.data);
      onClose();
    } catch (err) {
      console.error("❌ Failed to create group:", err.response?.data || err);
      alert("สร้างกลุ่มไม่สำเร็จ");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-panel-header-background rounded-lg shadow-lg w-[90%] max-w-md p-6 text-white relative">
        <button
          className="absolute top-3 right-3 text-xl text-white hover:text-red-400"
          onClick={onClose}
        >
          <IoMdClose />
        </button>
        <h2 className="text-xl font-semibold mb-4">สร้างกลุ่ม</h2>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="ชื่อกลุ่ม"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="bg-input-background p-2 rounded outline-none"
          />
          <textarea
            placeholder="คำอธิบายกลุ่ม (ไม่บังคับ)"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            className="bg-input-background p-2 rounded outline-none resize-none h-24"
          />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">เพิ่มสมาชิก</h3>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {userContacts.map((user) => (
              <label key={user.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(user.id)}
                  onChange={() => toggleMember(user.id)}
                />
                <span>{user.firstName} {user.lastName}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 hover:opacity-80"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-2 rounded bg-teal-light hover:opacity-90"
          >
            สร้างกลุ่ม
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupModal;
