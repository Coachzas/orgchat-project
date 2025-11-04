import React, { useEffect, useState } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import GroupModal from "./GroupModal";
import axios from "axios";
import {
  GET_GROUP_MESSAGES_ROUTE,
  DELETE_GROUP_ROUTE, 
} from "@/utils/ApiRoutes";

function GroupsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [{ userInfo, socket }, dispatch] = useStateProvider();

  //  โหลดรายการกลุ่มทั้งหมด
  const fetchGroups = async () => {
    try {
      const res = await axios.get(`/api/groups`, { withCredentials: true });
      const all = res.data || [];

      //  กรองเฉพาะกลุ่มที่ user เป็นสมาชิก
      if (!userInfo?.id) {
        setGroups(all);
        setFilteredGroups(all);
        return;
      }

      const myGroups = all.filter((g) =>
        Array.isArray(g.members) &&
        g.members.some(
          (m) => Number(m.userId ?? m.user?.id ?? m.userId) === Number(userInfo.id)
        )
      );

      setGroups(myGroups);
      setFilteredGroups(myGroups);
    } catch (err) {
      console.error("❌ เกิดข้อผิดพลาดในการดึงกลุ่ม:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [userInfo]);

  //  ฟิลเตอร์กลุ่มตามคำค้น
  useEffect(() => {
    if (searchTerm.length) {
      const filtered = groups.filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [searchTerm, groups]);

  //  กลับไปหน้า ChatList
  const handleBack = () => {
    dispatch({ type: reducerCases.SET_GROUPS_PAGE, payload: false });
  };

  //  เมื่อเลือกกลุ่ม
  const handleSelectGroup = async (group) => {
    console.log("🔥 คลิกเข้ากลุ่ม:", group.name, "(ID:", group.id, ")");
    try {
      dispatch({ type: reducerCases.SET_MESSAGES, messages: [] });
      dispatch({ type: reducerCases.CHANGE_CURRENT_CHAT_USER, user: undefined });

      const res = await axios.get(GET_GROUP_MESSAGES_ROUTE(group.id), {
        withCredentials: true,
      });

      console.log("📨 ข้อความกลุ่มที่โหลดได้:", res.data);

      dispatch({ type: reducerCases.SET_CURRENT_GROUP, group });
      dispatch({ type: reducerCases.SET_MESSAGES, messages: res.data });
      dispatch({ type: reducerCases.SET_GROUPS_PAGE, payload: false });

      if (socket?.current) {
        socket.current.emit("join-group", group.id);
        console.log(` เข้าห้อง group_${group.id} สำเร็จ`);
      }
    } catch (err) {
      console.error("❌ โหลดข้อความกลุ่มไม่สำเร็จ:", err);
    }
  };

  //  ฟังก์ชันลบกลุ่ม (เฉพาะ admin / manager)
  const handleDeleteGroup = async (groupId, groupName) => {
    if (!["admin", "manager"].includes(userInfo?.role)) return;
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่ม "${groupName}" ?`)) return;

    try {
      await axios.delete(DELETE_GROUP_ROUTE(groupId), { withCredentials: true });
      alert(`ลบกลุ่ม "${groupName}" สำเร็จ`);
      fetchGroups(); // โหลดใหม่หลังลบ
    } catch (err) {
      console.error("❌ ลบกลุ่มล้มเหลว:", err);
      alert("ไม่สามารถลบกลุ่มได้");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-24 flex items-end px-3 py-4">
        <div className="flex items-center gap-12 text-white">
          <BiArrowBack className="cursor-pointer text-xl" onClick={handleBack} />
          <span>แชทกลุ่ม</span>
        </div>
      </div>

      {/* Body */}
      <div className="bg-search-input-container-background h-full flex-auto overflow-auto custom-scrollbar">
        {/* Search Bar */}
        <div className="flex py-3 items-center gap-3 h-14">
          <div className="bg-panel-header-background flex items-center gap-5 px-5 py-1 rounded-lg flex-grow mx-4">
            <BiSearchAlt2 className="text-panel-header-icon text-xl" />
            <input
              type="text"
              placeholder="ค้นหาแชทกลุ่ม"
              className="bg-transparent text-sm focus:outline-none text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* รายการกลุ่ม */}
        <div className="px-5 text-white">
          {filteredGroups.length === 0 && (
            <p className="text-secondary text-sm mt-4">ไม่พบกลุ่ม</p>
          )}

          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="flex justify-between items-center py-2 px-4 hover:bg-background-default-hover rounded cursor-pointer"
            >
              {/*  ชื่อกลุ่ม (คลิกเพื่อเข้าห้องแชท) */}
              <div onClick={() => handleSelectGroup(group)}>
                <p className="font-medium">{group.name}</p>
                <p className="text-secondary text-xs">
                  {group.about || "ไม่มีคำอธิบายกลุ่ม"}
                </p>
              </div>

              {/*  ปุ่มลบกลุ่ม (เฉพาะ admin / manager) */}
              {(userInfo?.role === "admin" || userInfo?.role === "manager") && (
                <button
                  onClick={() => handleDeleteGroup(group.id, group.name)}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
                >
                  ลบ
                </button>
              )}
            </div>
          ))}

          {/*  ปุ่มสร้างกลุ่ม */}
          <div className="mt-6">
            {(userInfo?.role === "admin" || userInfo?.role === "manager") ? (
              <button
                onClick={() => setShowModal(true)}
                className="bg-teal-light text-white px-4 py-2 rounded-xl text-sm hover:opacity-90 flex items-center gap-2"
              >
                ➕ สร้างแชทกลุ่ม
              </button>
            ) : (
              <div className="flex flex-col">
                <button
                  disabled
                  className="bg-gray-500 text-white px-4 py-2 rounded-xl text-sm opacity-60 cursor-not-allowed flex items-center gap-2"
                >
                  ➕ สร้างแชทกลุ่ม
                </button>
                <p className="text-secondary text-xs mt-2">
                  เฉพาะผู้ดูแล (admin) และผู้จัดการ (manager)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal สร้างกลุ่ม */}
      {showModal && <GroupModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default GroupsList;
