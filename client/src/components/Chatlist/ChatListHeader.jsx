import React, { useState } from "react";
import Avatar from "../common/Avatar";
import { useStateProvider } from "@/context/StateContext";
import { BsFillChatLeftTextFill, BsThreeDotsVertical } from "react-icons/bs";
import { reducerCases } from "@/context/constants";
import { useRouter } from "next/router";
import ContextMenu from "../common/ContextMenu";
import ProfileModal from "@/components/Profile/ProfileModal";
import { FiUsers } from "react-icons/fi";

function ChatListHeader() {
  const router = useRouter();
  const [{ userInfo, contactsPage }, dispatch] = useStateProvider();

  const [contextMenuCoordinates, setContextMenuCoordinates] = useState({ x: 0, y: 0 });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const showContextMenu = (e) => {
    e.preventDefault();
    setContextMenuCoordinates({ x: e.pageX, y: e.pageY });
    setIsContextMenuVisible(true);
  };

  const contextMenuOptions = [
    {
      name: "แก้ไขโปรไฟล์",
      callback: () => {
        setIsContextMenuVisible(false);
        setShowProfileModal(true);
      },
    },
    {
      name: "Logout",
      callback: async () => {
        setIsContextMenuVisible(false);
        router.push("/logout");
      },
    },
  ];

  const handleAllContactsPage = () => {
    dispatch({
      type: reducerCases.SET_ALL_CONTACTS_PAGE,
      payload: !contactsPage,
    });
    dispatch({ type: reducerCases.SET_GROUPS_PAGE, payload: false });
  };

  return (
    <div className="h-16 px-4 py-3 flex justify-between items-center">
      {/* 🧩 โปรไฟล์ผู้ใช้ */}
      <div className="flex items-center gap-4 flex-grow">
        <Avatar
          type="sm"
          image={userInfo?.profilePicture || "/default-avatar.png"}
        />
        <div className="flex flex-col overflow-hidden">
          <span className="text-primary-strong text-sm font-semibold truncate">
            {/* ✅ ป้องกัน undefined firstName/lastName */}
            {userInfo?.firstName || userInfo?.name || "ไม่ระบุ"}{" "}
            {userInfo?.lastName || ""}
            {userInfo?.role && (
              <span className="text-xs text-gray-400 ml-1">
                ({userInfo.role})
              </span>
            )}
          </span>
          <span className="text-secondary text-xs truncate">
            {userInfo?.about || "ไม่มีข้อมูลส่วนตัว"}
          </span>
        </div>
      </div>

      {/* 🧭 ปุ่มควบคุม */}
  <div className="flex gap-6">
        <BsFillChatLeftTextFill
          className="text-panel-header-icon cursor-pointer text-xl"
          title="แชทใหม่"
          onClick={handleAllContactsPage}
        />
        <FiUsers
          className="text-panel-header-icon cursor-pointer text-xl"
          title="แชทกลุ่ม"
          onClick={() => {
            dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE, payload: false });
            dispatch({ type: reducerCases.SET_GROUPS_PAGE, payload: true });
          }}
        />
        <BsThreeDotsVertical
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={showContextMenu}
          id="context-opener"
        />
        {/* ปุ่มไปยัง Admin Dashboard (เห็นเฉพาะ admin) */}
        {userInfo?.role === "admin" && (
          <button
            onClick={() => router.push("/admin")}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
            title="ไปยัง Admin Dashboard"
          >
            Admin Dashboard
          </button>
        )}
      </div>

      {isContextMenuVisible && (
        <ContextMenu
          options={contextMenuOptions}
          coordinates={contextMenuCoordinates}
          contextMenu={isContextMenuVisible}
          setContextMenu={setIsContextMenuVisible}
        />
      )}

      {showProfileModal && (
        <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}

export default ChatListHeader;
