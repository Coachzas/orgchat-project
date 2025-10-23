import React, { useState } from "react";
import Avatar from "../common/Avatar";
import { useStateProvider } from "../../context/StateContext";
import { MdCall } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { reducerCases } from "@/context/constants";
import ContextMenu from "../common/ContextMenu";

function ChatHeader() {
  const [{ currentChatUser, onlineUsers }, dispatch] = useStateProvider();
  const [contextMenuCoordinates, setContextMenuCoordinates] = useState({ x: 0, y: 0 });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

  // ---------- เปิดเมนูคลิกขวา ----------
  const showContextMenu = (e) => {
    e.preventDefault();
    const { pageX, pageY } = e;
    setContextMenuCoordinates({ x: pageX - 50, y: pageY + 20 });
    setIsContextMenuVisible(true);
  };

  const contextMenuOptions = [
    { name: "Exit", callBack: () => dispatch({ type: reducerCases.SET_EXIT_CHAT }) },
  ];

  // ---------- 📞 โทรออกแบบเสียง ----------
  const handleVoiceCall = () => {
    if (!currentChatUser?.id) return;
    dispatch({
      type: reducerCases.SET_VOICE_CALL,
      voiceCall: {
        id: currentChatUser.id, // ✅ ต้องมี id ผู้รับ
        firstName: currentChatUser.firstName,
        lastName: currentChatUser.lastName,
        profilePicture: currentChatUser.profilePicture,
        type: "out-going",
        callType: "voice",
        roomId: Date.now(),
      },
    });
  };

  // ---------- 🎥 โทรออกแบบวิดีโอ ----------
  const handleVideoCall = () => {
    if (!currentChatUser?.id) return;
    dispatch({
      type: reducerCases.SET_VIDEO_CALL,
      videoCall: {
        id: currentChatUser.id, // ✅ ต้องมี id ผู้รับ
        firstName: currentChatUser.firstName,
        lastName: currentChatUser.lastName,
        profilePicture: currentChatUser.profilePicture,
        type: "out-going",
        callType: "video",
        roomId: Date.now(),
      },
    });
  };

  // ---------- ป้าย role (admin / manager / user) ----------
  const role = currentChatUser?.role?.toLowerCase();
  const roleTitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
  const roleStyles = {
    admin:   "bg-red-500/15 text-red-300 border border-red-500/30",
    manager: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    user:    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  };
  const roleClass = roleStyles[role] || "bg-slate-500/15 text-slate-300 border border-slate-500/30";
  // -------------------------------------------------------

  return (
    <div
      className="h-16 px-4 py-3 flex justify-between items-center bg-panel-header-background z-10"
      onContextMenu={showContextMenu}
    >
      {/* ---------- ด้านซ้าย: ชื่อผู้ใช้ + สถานะ ---------- */}
      <div className="flex items-center justify-center gap-6">
        <Avatar type="sm" image={currentChatUser?.profilePicture} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-primary-strong font-medium">
              {currentChatUser?.firstName} {currentChatUser?.lastName}
            </span>
            {role && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] leading-none ${roleClass}`}>
                {roleTitle}
              </span>
            )}
          </div>
          <span className="text-secondary text-sm">
            {currentChatUser?.id &&
              (onlineUsers.includes(currentChatUser.id) ? "ออนไลน์" : "ออฟไลน์")}
          </span>
        </div>
      </div>

      {/* ---------- ด้านขวา: ปุ่มโทร / ค้นหา / เมนู ---------- */}
      <div className="flex gap-6">
        <MdCall
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={handleVoiceCall}
          title="โทรเสียง"
        />
        <IoVideocam
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={handleVideoCall}
          title="วิดีโอคอล"
        />
        <BiSearchAlt2
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={() => dispatch({ type: reducerCases.SET_MESSAGE_SEARCH })}
          title="ค้นหาข้อความ"
        />
        <BsThreeDotsVertical
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={(e) => showContextMenu(e)}
          id="context-opener"
          title="เมนูเพิ่มเติม"
        />

        {/* ---------- เมนูคลิกขวา ---------- */}
        {isContextMenuVisible && (
          <ContextMenu
            options={contextMenuOptions}
            coordinates={contextMenuCoordinates}
            contextMenu={isContextMenuVisible}
            setContextMenu={setIsContextMenuVisible}
          />
        )}
      </div>
    </div>
  );
}

export default ChatHeader;
