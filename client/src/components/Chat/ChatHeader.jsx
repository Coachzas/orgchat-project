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

  const showContextMenu = (e) => {
    e.preventDefault();
    const { pageX, pageY } = e;
    setContextMenuCoordinates({ x: pageX - 50, y: pageY + 20 });
    setIsContextMenuVisible(true);
  };

  const contextMenuOptions = [
    { name: "Exit", callBack: () => dispatch({ type: reducerCases.SET_EXIT_CHAT }) },
  ];

  const handleVoiceCall = () => {
    dispatch({
      type: reducerCases.SET_VOICE_CALL,
      voiceCall: { ...currentChatUser, type: "out-going", callType: "voice", roomId: Date.now() },
    });
  };

  const handleVideoCall = () => {
    dispatch({
      type: reducerCases.SET_VIDEO_CALL,
      videoCall: { ...currentChatUser, type: "out-going", callType: "video", roomId: Date.now() },
    });
  };

  // ---------- role badge style ----------
  const role = currentChatUser?.role?.toLowerCase();
  const roleTitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
  const roleStyles = {
    admin:   "bg-red-500/15 text-red-300 border border-red-500/30",
    manager: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    user:    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  };
  const roleClass = roleStyles[role] || "bg-slate-500/15 text-slate-300 border border-slate-500/30";
  // --------------------------------------

  return (
    <div
      className="h-16 px-4 py-3 flex justify-between items-center bg-panel-header-background z-10"
      onContextMenu={showContextMenu}
    >
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

      <div className="flex gap-6">
        <MdCall
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={handleVoiceCall}
        />
        <IoVideocam
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={handleVideoCall}
        />
        <BiSearchAlt2
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={() => dispatch({ type: reducerCases.SET_MESSAGE_SEARCH })}
        />
        <BsThreeDotsVertical
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={(e) => showContextMenu(e)}
          id="context-opener"
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
