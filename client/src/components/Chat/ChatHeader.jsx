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
  const [{ currentChatUser, currentGroup, onlineUsers, userInfo, socket }, dispatch] =
    useStateProvider();
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
    {
      name: "Exit",
      callBack: () => {
        setIsContextMenuVisible(false);
        dispatch({ type: reducerCases.SET_EXIT_CHAT });
      },
    },
  ];

  // ---------- 📞 โทรออก (1-1) ----------
  const handleVoiceCall = () => {
    if (!currentChatUser?.id || currentGroup) return;
    dispatch({
      type: reducerCases.SET_VOICE_CALL,
      voiceCall: {
        id: currentChatUser.id,
        firstName: currentChatUser.firstName || currentChatUser.name || "",
        lastName: currentChatUser.lastName || "",
        profilePicture: currentChatUser.profilePicture || "/default-avatar.png",
        type: "out-going",
        callType: "voice",
        roomId: Date.now(),
      },
    });
  };

  // ---------- 🎥 วิดีโอคอล (1-1) ----------
  const handleVideoCall = () => {
    if (!currentChatUser?.id || currentGroup) return;
    dispatch({
      type: reducerCases.SET_VIDEO_CALL,
      videoCall: {
        id: currentChatUser.id,
        firstName: currentChatUser.firstName || currentChatUser.name || "",
        lastName: currentChatUser.lastName || "",
        profilePicture: currentChatUser.profilePicture || "/default-avatar.png",
        type: "out-going",
        callType: "video",
        roomId: Date.now(),
      },
    });
  };

  // ---------- 📞 โทรกลุ่ม ----------
  const handleGroupCall = (callType) => {
    if (!currentGroup || !socket?.current) return;

    const roomId = `group_${currentGroup.id}_${Date.now()}`;

    // 🔊 ส่ง event ไป server
    socket.current.emit("outgoing-group-call", {
      groupId: currentGroup.id,
      groupName: currentGroup.name,
      from: userInfo,
      callType,
      roomId,
    });

    // 🧠 ตั้งค่า state ฝั่ง client เพื่อเปิด GroupCallContainer
    dispatch({
      type: reducerCases.SET_GROUP_CALL,
      groupCall: {
        groupId: currentGroup.id,
        groupName: currentGroup.name,
        from: userInfo,
        callType,
        roomId,
        type: "out-going",
      },
    });
  };

  // ---------- ป้าย role ----------
  const role = currentChatUser?.role?.toLowerCase();
  const roleTitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
  const roleStyles = {
    admin: "bg-red-500/15 text-red-300 border border-red-500/30",
    manager: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    employee: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  };
  const roleClass =
    roleStyles[role] || "bg-slate-500/15 text-slate-300 border border-slate-500/30";

  // ---------- UI ----------
  return (
    <div
      className="h-16 px-4 py-3 flex justify-between items-center bg-panel-header-background z-10"
      onContextMenu={showContextMenu}
    >
      {/* ---------- ด้านซ้าย ---------- */}
      <div className="flex items-center justify-center gap-6">
        <Avatar
          type="sm"
          image={
            currentGroup
              ? "/default-avatar.png"
              : currentChatUser?.profilePicture || "/default-avatar.png"
          }
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-primary-strong font-medium">
              {currentGroup
                ? currentGroup.name
                : `${currentChatUser?.firstName || currentChatUser?.name || ""} ${
                    currentChatUser?.lastName || ""
                  }`}
            </span>

            {!currentGroup && role && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] leading-none ${roleClass}`}
              >
                {roleTitle}
              </span>
            )}
          </div>

          {/* สถานะ */}
          {!currentGroup && currentChatUser?.id && (
            <span className="text-secondary text-sm">
              {onlineUsers.includes(currentChatUser.id) ? "ออนไลน์" : "ออฟไลน์"}
            </span>
          )}
          {currentGroup && (
            <span className="text-secondary text-sm">
              👥 สมาชิก {currentGroup.members?.length || 0} คน
            </span>
          )}
        </div>
      </div>

      {/* ---------- ด้านขวา ---------- */}
      <div className="flex gap-6">
        {/* 📂 ฝากไฟล์ (เฉพาะแอดมิน/เมเนเจอร์) */}
        {currentGroup && (userInfo?.role === "admin" || userInfo?.role === "manager") && (
          <button
            onClick={() => {
              dispatch({ type: reducerCases.SHOW_GROUP_FILES, payload: currentGroup });
            }}
            className="bg-icon-green hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
          >
            📂 ฝากไฟล์
          </button>
        )}

        {/* 🔊 โทรกลุ่ม */}
        {currentGroup && (
          <>
            <MdCall
              className="text-blue-500 hover:text-blue-400 cursor-pointer text-xl"
              title="โทรเสียงกลุ่ม"
              onClick={() => handleGroupCall("voice")}
            />
            <IoVideocam
              className="text-blue-500 hover:text-blue-400 cursor-pointer text-xl"
              title="วิดีโอคอลกลุ่ม"
              onClick={() => handleGroupCall("video")}
            />
          </>
        )}

        {/* 📞 โทร 1-1 */}
        {!currentGroup && (
          <>
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
          </>
        )}

        {/* 🔍 ค้นหา / เมนู */}
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
