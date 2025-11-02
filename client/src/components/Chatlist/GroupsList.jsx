import React, { useEffect, useState } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import GroupModal from "./GroupModal";
import axios from "axios";
import { GET_GROUP_MESSAGES_ROUTE } from "@/utils/ApiRoutes"; //  เพิ่ม import ที่หายไป

function GroupsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [{ userInfo, socket }, dispatch] = useStateProvider();

  //  โหลดรายการกลุ่ม (และกรองให้แสดงเฉพาะกลุ่มที่ user เป็นสมาชิก)
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(`/api/groups`, { withCredentials: true });
        const all = res.data || [];
        // หากไม่มี userInfo ให้เก็บทั้งหมดก่อน (เพื่อไม่ให้ error)
        if (!userInfo?.id) {
          setGroups(all);
          setFilteredGroups(all);
          return;
        }

        const myGroups = all.filter((g) =>
          Array.isArray(g.members) &&
          g.members.some((m) => Number(m.userId ?? m.user?.id ?? m.userId) === Number(userInfo.id))
        );

        setGroups(myGroups);
        setFilteredGroups(myGroups);
      } catch (err) {
        console.error("❌ เกิดข้อผิดพลาดในการดึงกลุ่ม:", err);
      }
    };
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

  const handleBack = () => {
    dispatch({ type: reducerCases.SET_GROUPS_PAGE, payload: false });
  };

  //  เมื่อเลือกกลุ่ม
  const handleSelectGroup = async (group) => {
    console.log("🔥 คลิกเข้ากลุ่ม:", group.name, "(ID:", group.id, ")");
    try {
      // 🧹 เคลียร์ state เก่าออกก่อนเพื่อกันซ้อน
      dispatch({ type: reducerCases.SET_MESSAGES, messages: [] });
      dispatch({ type: reducerCases.CHANGE_CURRENT_CHAT_USER, user: undefined });

      // 📥 โหลดข้อความกลุ่มจาก backend
      const res = await axios.get(GET_GROUP_MESSAGES_ROUTE(group.id), {
        withCredentials: true,
      });

      console.log("📨 ข้อความกลุ่มที่โหลดได้:", res.data);

      // 🧠 ตั้งค่า group ใหม่ + messages ใหม่
      dispatch({ type: reducerCases.SET_CURRENT_GROUP, group });
      dispatch({ type: reducerCases.SET_MESSAGES, messages: res.data });
      dispatch({ type: reducerCases.SET_GROUPS_PAGE, payload: false });

      //  เข้าห้อง group ด้วย socket.io
      if (socket?.current) {
        socket.current.emit("join-group", group.id);
        console.log(` เข้าห้อง group_${group.id} สำเร็จ`);
      }
    } catch (err) {
      console.error("❌ โหลดข้อความกลุ่มไม่สำเร็จ:", err);
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

      {/* รายการกลุ่ม */}
      <div className="bg-search-input-container-background h-full flex-auto overflow-auto custom-scrollbar">
        {/* ค้นหา */}
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

        {/* รายการ */}
        <div className="px-5 text-white">
          {filteredGroups.length === 0 && (
            <p className="text-secondary text-sm mt-4">ไม่พบกลุ่ม</p>
          )}

          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="py-2 px-4 hover:bg-background-default-hover rounded cursor-pointer"
              onClick={() => handleSelectGroup(group)}
            >
              <p className="font-medium">{group.name}</p>
              <p className="text-secondary text-sm">
                {group.about || "ไม่มีคำอธิบายกลุ่ม"}
              </p>
            </div>
          ))}

          {/* ปุ่มสร้างกลุ่ม */}
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
                <p className="text-secondary text-xs mt-2">เฉพาะผู้ดูแล (admin) และผู้จัดการ (manager)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && <GroupModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default GroupsList;
