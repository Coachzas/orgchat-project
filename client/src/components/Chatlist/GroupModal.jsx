import React, { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { useStateProvider } from "@/context/StateContext";
import axios from "axios";
import { reducerCases } from "@/context/constants";
import {
  ADD_GROUP_ROUTE,
  ADMIN_USERS_PUBLIC_ROUTE,
  DELETE_GROUP_ROUTE, //  เพิ่มบรรทัดนี้
} from "@/utils/ApiRoutes";

function GroupModal({ onClose }) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  //  เพิ่ม currentGroup เพื่อใช้ตอนลบกลุ่ม
  const [{ userContacts = [], userInfo, socket, currentGroup }, dispatch] = useStateProvider();
  const [usersList, setUsersList] = useState([]);

  //  โหลดรายชื่อผู้ใช้ทั้งหมดตั้งแต่เปิด modal
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (userInfo?.role === "admin" || userInfo?.role === "manager") {
          const res = await axios.get(ADMIN_USERS_PUBLIC_ROUTE, {
            withCredentials: true,
          });
          setUsersList(res.data || []);
        } else {
          setUsersList(userContacts || []);
        }
      } catch (err) {
        console.error("❌ โหลดรายชื่อผู้ใช้ล้มเหลว:", err);
      }
    };
    fetchUsers();
  }, [userInfo, userContacts]);

  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return alert("กรุณากรอกชื่อกลุ่ม");
    if (selectedMembers.length === 0) return alert("กรุณาเลือกสมาชิกอย่างน้อย 1 คน");

    try {
      const membersIds = selectedMembers.map((id) => Number(id));

      const response = await axios.post(
        ADD_GROUP_ROUTE,
        {
          name: groupName.trim(),
          about: groupDescription.trim() || null,
          members: membersIds,
        },
        { withCredentials: true }
      );

      const newGroup = response.data;
      console.log(" Group created:", newGroup);

      socket?.current?.emit("join-group", newGroup.id);
      dispatch({ type: reducerCases.SET_CURRENT_GROUP, group: newGroup });
      dispatch({ type: reducerCases.SET_MESSAGES, messages: [] });

      onClose();
    } catch (err) {
      console.error("❌ Failed to create group:", err.response?.data || err);
      alert("สร้างกลุ่มไม่สำเร็จ");
    }
  };

  const importAllUsers = async () => {
    try {
      if (userInfo?.role === "admin" || userInfo?.role === "manager") {
        const res = await axios.get(ADMIN_USERS_PUBLIC_ROUTE, { withCredentials: true });
        const all = res.data || [];
        setUsersList(all);
        setSelectedMembers(all.map((u) => u.id));
      } else {
        setUsersList(userContacts || []);
        setSelectedMembers((userContacts || []).map((u) => u.id));
      }
    } catch (err) {
      console.error("❌ นำเข้าผู้ใช้ทั้งหมดล้มเหลว:", err);
      alert("ไม่สามารถนำเข้าผู้ใช้ทั้งหมดได้");
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

          <div className="flex gap-2 mb-2">
            <button
              onClick={importAllUsers}
              className="px-3 py-1 bg-blue-600 rounded text-white text-sm"
            >
              นำเข้าทั้งหมด
            </button>
            <small className="text-secondary text-xs self-center">
              (admin/manager จะนำเข้าทุกคนจากระบบ)
            </small>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1">
            {usersList.map((user) => (
              <label key={user.id} className="flex items-center gap-2">
                <img
                  src={
                    user.role === "admin"
                      ? "/avatars/3.png"
                      : user.role === "manager"
                        ? "/avatars/2.png"
                        : user.profilePicture || "/default-avatar.png"
                  }
                  alt="role"
                  className="h-6 w-6 rounded-full"
                />
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
